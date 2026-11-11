/**
 * game — saf oyun durum makinesi (UC-2..UC-6, SC-3).
 *
 * `step(state, input, dt)` immutable çalışır: state klonlanır, sabit adımlarla
 * (FIXED_DT, dt clamp MAX_DT) ilerletilir ve olay listesi döner. Aynı seed +
 * input dizisi → aynı sonuç (determinizm). Yan etki: YOK.
 *
 * Fazlar: air → (tap kutu) swing → (tap boşluk) air … air → (iniş) ground.
 * Ölüm: fall (ekran altı), breaker (oyuncu teması), out-of-rope (kota bitti +
 * yerde), time (Zamana Karşı süresi).
 */
import type {
  Brick,
  DeathReason,
  GameEvent,
  GameMode,
  GameState,
  Input,
  Rope,
  Vec2,
} from "./types";
import {
  BRICK_SIZE,
  FIXED_DT,
  HOP_VELOCITY,
  MAX_DT,
  PLAYER_SIZE,
  isSolidKind,
} from "./types";
import { paramsFor } from "./difficulty";
import {
  initialSwingOmega,
  integrateAir,
  mulberry32,
  releaseVelocity,
  ropePosition,
  segIntersectsAabb,
  stepSwing,
} from "./physics";
import { initialSpawnCount, planFloor, spawnBricks } from "./tower";
import { COIN_SCORE, FLOOR_SCORE } from "./scoring";
import { attachRejection } from "./preview";

export interface CreateOptions {
  mode: GameMode;
  difficulty: GameState["difficulty"];
  seed: number;
  worldWidth: number;
  worldHeight: number;
  targetFloor?: number | null;
  timeLeft?: number | null;
}

/** Yeni oyun kurar: ilk kule + oyuncu yukarıda havada. */
export function createGame(opts: CreateOptions): GameState {
  const params = paramsFor(opts.difficulty, 0, opts.mode);
  const spawn = spawnBricks({
    rng: mulberry32(opts.seed),
    nextId: 1,
    worldWidth: opts.worldWidth,
    worldHeight: opts.worldHeight,
    params,
    from: null,
    count: initialSpawnCount(opts.worldHeight, params),
  });
  const top = spawn.bricks
    .filter((b) => b.kind !== "coin" && b.kind !== "breaker")
    .sort((a, b) => a.y - b.y)[0];
  return {
    player: { x: opts.worldWidth / 2, y: (top?.y ?? opts.worldHeight * 0.5) - 3 },
    velocity: { x: 0, y: 0 },
    phase: "air",
    rope: null,
    bricks: spawn.bricks,
    floor: 0,
    ropesLeft: params.ropeQuota,
    ropesUsedTotal: 0,
    chain: 0,
    coins: 0,
    score: 0,
    timeLeft: opts.timeLeft ?? null,
    targetFloor: opts.targetFloor ?? null,
    mode: opts.mode,
    difficulty: opts.difficulty,
    params,
    worldWidth: opts.worldWidth,
    worldHeight: opts.worldHeight,
    seed: opts.seed,
    nextBrickId: spawn.nextId,
    egg404: false,
    deathReason: null,
  };
}

/** Bir mantık adımı — yeni state + olaylar döner (saf). */
export function step(
  state: GameState,
  input: Input | null,
  dt: number,
): { state: GameState; events: GameEvent[] } {
  if (state.phase === "over") return { state, events: [] };
  const s: GameState = structuredClone(state);
  const events: GameEvent[] = [];

  applyInput(s, input, events);

  let remaining = Math.min(Math.max(dt, 0), MAX_DT);
  while (remaining > 1e-9 && s.phase !== "over") {
    const h = Math.min(FIXED_DT, remaining);
    remaining -= h;
    advancePhysics(s, h, events);
  }
  return { state: s, events };
}

// --- girdi ---

function applyInput(s: GameState, input: Input | null, events: GameEvent[]): void {
  if (input === null || input.kind !== "tap") return;

  if (input.brickId !== null) {
    if (attachRejection(s, input.brickId) !== null) return;
    const brick = s.bricks.find((b) => b.id === input.brickId);
    if (!brick) return;
    const airborne = s.phase === "swing" || s.phase === "air";
    if (airborne) s.chain += 1;
    s.ropesLeft -= 1;
    s.ropesUsedTotal += 1;
    const dx = s.player.x - brick.x;
    const dy = s.player.y - brick.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    s.rope = {
      brickId: brick.id,
      length,
      angle,
      omega: initialSwingOmega(s.params, brick.kind, angle, length, s.velocity),
    };
    s.phase = "swing";
    events.push({ type: "attach", brickId: brick.id, chain: s.chain, ropesLeft: s.ropesLeft });
    return;
  }

  if (s.rope !== null) {
    s.velocity = releaseVelocity(s.rope);
    s.rope = null;
    s.phase = "air";
    events.push({ type: "release" });
  } else if (s.phase === "ground") {
    s.velocity = { x: 0, y: HOP_VELOCITY };
    s.phase = "air";
  }
}

// --- fizik ---

function advancePhysics(s: GameState, h: number, events: GameEvent[]): void {
  if (s.timeLeft !== null) {
    s.timeLeft -= h;
    if (s.timeLeft <= 0) {
      die(s, "time", events);
      return;
    }
  }

  if (s.phase === "swing") {
    swingStep(s, h, events);
  } else if (s.phase === "air") {
    airStep(s, h, events);
  } else if (s.phase === "ground") {
    groundStep(s, events);
  }

  if (s.phase === "over") return;
  collectPickups(s, events);

  if (s.player.y < s.worldHeight / 3) floorUp(s, events);
  if (s.player.y > s.worldHeight + 2) {
    die(s, "fall", events);
  }
}

/**
 * Salınım adımı (kullanıcı kuralları, 2026-11-10 — A11):
 * 1) İp segmenti HERHANGİ katı kutuya değerse → ip kopar, serbest düşüş.
 * 2) Oyuncu kutuya ÜSTTEN çarparsa → kutunun üzerine iner (ground).
 * 3) Oyuncu kutuya YANDAN çarparsa → ip KOPMAZ, sarkaç geri seker
 *    (ω ters, ×0.6 geri dönüş katsayısı).
 * 4) Kırıcıya oyuncu teması → ölüm.
 */
function swingStep(s: GameState, h: number, events: GameEvent[]): void {
  if (s.rope === null) {
    s.phase = "air";
    return;
  }
  const anchor = s.bricks.find((b) => b.id === s.rope!.brickId);
  if (!anchor) {
    s.rope = null;
    s.phase = "air";
    return;
  }
  const next = stepSwing(s.rope, anchor.kind, s.params, h);
  s.player = ropePosition(anchor, next);
  s.velocity = releaseVelocity(next);
  s.rope = next;

  // 1) İp ↔ katı kutu → kopma.
  //    Oyuncunun BEDENİYLE temas eden kutu burada atlanır — o durum 2/3'te
  //    (iniş/sekme/ölüm) çözülür; aksi halde her yan çarpışma ipi koparırdı.
  for (const b of s.bricks) {
    if (!isSolidKind(b.kind) || b.id === anchor.id) continue;
    if (overlaps(s.player, b)) continue;
    if (segIntersectsAabb(s.player, anchor, b.x, b.y, BRICK_SIZE / 2)) {
      events.push({ type: "ropeBreak", brickId: b.id });
      s.rope = null;
      s.phase = "air";
      break;
    }
  }

  // 2–3) Oyuncu ↔ kutu
  if (s.phase === "swing") {
    for (const b of s.bricks) {
      if (!isSolidKind(b.kind) || !overlaps(s.player, b)) continue;
      if (b.kind === "breaker") {
        die(s, "breaker", events);
        return;
      }
      if (s.player.y <= b.y) {
        // Üstten çarpış → kutuya in.
        s.player = { x: s.player.x, y: b.y - (BRICK_SIZE + PLAYER_SIZE) / 2 };
        s.velocity = { x: 0, y: 0 };
        s.rope = null;
        s.phase = "ground";
        s.chain = 0;
        events.push({ type: "land", brickId: b.id });
      } else {
        // Yan çarpış → ip kopmaz; fiziksel geri sekme (ω ters × 0.6).
        const current = s.rope;
        if (current !== null) {
          const bounced = { ...current, omega: -current.omega * 0.6 };
          s.rope = bounced;
          s.velocity = releaseVelocity(bounced);
        }
      }
      break;
    }
  }
}

function airStep(s: GameState, h: number, events: GameEvent[]): void {
  const prev = s.player;
  const r = integrateAir(s.player, s.velocity, s.params.gravity, h);
  s.player = r.pos;
  s.velocity = r.vel;
  collideAir(s, prev, events);
}

function collideAir(s: GameState, prev: Vec2, events: GameEvent[]): void {
  const half = (BRICK_SIZE + PLAYER_SIZE) / 2;
  for (const b of s.bricks) {
    if (!isSolidKind(b.kind)) continue;
    const dx = s.player.x - b.x;
    const dy = s.player.y - b.y;
    if (Math.abs(dx) >= half || Math.abs(dy) >= half) continue;

    if (b.kind === "breaker") {
      die(s, "breaker", events);
      return;
    }

    // İniş (çapraz giriş dahil): düşüyor + merkez kutu merkezinin üstünde.
    if (s.velocity.y > 0 && s.player.y <= b.y) {
      const snapX =
        s.params.landingMagnet > 0 && Math.abs(dx) < s.params.landingMagnet
          ? b.x
          : s.player.x;
      s.player = { x: snapX, y: b.y - (BRICK_SIZE + PLAYER_SIZE) / 2 };
      s.velocity = { x: 0, y: 0 };
      s.phase = "ground";
      s.chain = 0;
      events.push({ type: "land", brickId: b.id });
      return;
    }

    // Yan temas: SÜRTÜNME — dikey hız korunur, sekme yok.
    const penX = half - Math.abs(dx);
    const penY = half - Math.abs(dy);
    if (penX <= penY) {
      s.player.x = b.x + (dx >= 0 ? half : -half);
      s.velocity.x = 0;
    } else if (dy > 0) {
      // Alttan gelen kafa vuruşu (zıplarken).
      s.player.y = b.y + half;
      s.velocity.y = 0;
    } else {
      s.player.y = b.y - half;
      s.velocity.y = 0;
    }
  }
}

function groundStep(s: GameState, events: GameEvent[]): void {
  const supported = s.bricks.some(
    (b) =>
      (b.kind === "stone" || b.kind === "rotor-cw" || b.kind === "rotor-ccw") &&
      Math.abs(s.player.x - b.x) < (BRICK_SIZE + PLAYER_SIZE) / 2 &&
      Math.abs(s.player.y + PLAYER_SIZE / 2 + BRICK_SIZE / 2 - b.y) < 0.25,
  );
  if (!supported) {
    s.phase = "air";
    s.velocity = { x: 0, y: 0 };
    return;
  }
  if (s.ropesLeft <= 0) die(s, "out-of-rope", events);
}

/**
 * Toplanabilirler (kullanıcı kuralı, 2026-11-10): coin ve sandık ÇARPIŞMASIZ —
 * her taraftan dokununca alınır. Sandık bonusu: +1 ip +1 coin (K8).
 * Coin toplama alanı kutudan bir tık geniştir (her taraftan).
 */
function collectPickups(s: GameState, events: GameEvent[]): void {
  const half = (BRICK_SIZE + PLAYER_SIZE) / 2;
  const coinHalf = half + 0.5;
  for (const b of s.bricks) {
    if (b.used) continue;
    if (b.kind === "coin") {
      if (Math.abs(s.player.x - b.x) < coinHalf && Math.abs(s.player.y - b.y) < coinHalf) {
        b.used = true;
        s.coins += 1;
        s.score += COIN_SCORE;
        events.push({ type: "coin" });
      }
    } else if (b.kind === "chest") {
      if (Math.abs(s.player.x - b.x) < coinHalf && Math.abs(s.player.y - b.y) < coinHalf) {
        b.used = true;
        s.ropesLeft += 1;
        s.coins += 1;
        s.score += COIN_SCORE;
        events.push({ type: "chest" });
      }
    }
  }
}

function overlaps(player: Vec2, brick: { x: number; y: number }): boolean {
  const half = (BRICK_SIZE + PLAYER_SIZE) / 2;
  return Math.abs(player.x - brick.x) < half && Math.abs(player.y - brick.y) < half;
}

// --- kat / ölüm ---

function floorUp(s: GameState, events: GameEvent[]): void {
  const shift = s.worldHeight / 3;
  s.player.y += shift;
  s.bricks = s.bricks
    .filter((b) => b.y <= s.worldHeight * 0.67)
    .map((b) => ({ ...b, y: b.y + shift }));

  // K29: kat, kota ile çözülebilir olana kadar yeniden üretilir (≤5 deneme).
  const plan = planFloor({
    bricks: s.bricks,
    player: s.player,
    seed: s.seed,
    floor: s.floor,
    worldWidth: s.worldWidth,
    worldHeight: s.worldHeight,
    params: s.params,
  });
  s.bricks.push(...plan.bricks);
  s.nextBrickId = plan.nextId;

  s.floor += 1;
  s.score += FLOOR_SCORE;
  s.params = paramsFor(s.difficulty, s.floor, s.mode);
  s.ropesLeft = s.params.ropeQuota;
  events.push({ type: "floorUp", floor: s.floor });
  if (s.floor === 404 && !s.egg404) {
    s.egg404 = true;
    events.push({ type: "egg404" });
  }
}

function die(s: GameState, reason: DeathReason, events: GameEvent[]): void {
  s.phase = "over";
  s.deathReason = reason;
  events.push({ type: "over", reason });
}
