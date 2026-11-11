/**
 * tower — seed'li kule üretimi + erişilebilirlik garantisi (UC-4, K14, FR-4.1/4.5).
 *
 * Omurga: `from` kutusundan yukarı (y azalır) her adımda dikey aralık
 * [gapMin,gapMax], yatay sapma `maxDx = √((0.85·range)² − gap²)` ile sınırlı —
 * böylece her omurga kenarı ip menzilinde kalır (BFS garantisi, SC-7).
 * Süsler (kırıcı/coin) omurgayı kapatmayacak kadar yana konur.
 *
 * Yan etkiler: YOK (rng enjekte edilir).
 */
import type { Brick, BrickKind, PhysicsParams, Vec2 } from "./types";
import { BRICK_SIZE, ROPE_RANGE, isSolidKind } from "./types";
import { mulberry32 } from "./physics";

/** Menzil güvenlik payı — BFS eşiği ile aynı (0.9 > 0.85). */
const RANGE_FACTOR = 0.85;
const BFS_FACTOR = 0.9;

export interface SpawnOptions {
  rng: () => number;
  nextId: number;
  worldWidth: number;
  worldHeight: number;
  params: PhysicsParams;
  /** En yüksek (en küçük y) omurga kutusu; null = ilk üretim. */
  from: Brick | null;
  count?: number;
}

export interface SpawnResult {
  bricks: Brick[];
  nextId: number;
}

export function spawnBricks(opts: SpawnOptions): SpawnResult {
  const count = opts.count ?? 3;
  const bricks: Brick[] = [];
  let id = opts.nextId;
  const margin = BRICK_SIZE;
  const clampX = (x: number): number =>
    Math.min(opts.worldWidth - margin, Math.max(margin, x));

  let prev: Brick =
    opts.from ?? {
      id: -1,
      kind: "stone",
      x: opts.worldWidth / 2,
      y: opts.worldHeight * 0.85,
      used: false,
    };

  for (let i = 0; i < count; i++) {
    const gap = opts.params.gapMin + opts.rng() * (opts.params.gapMax - opts.params.gapMin);
    const maxDx = Math.sqrt(
      Math.max(0, (ROPE_RANGE * RANGE_FACTOR) ** 2 - gap ** 2),
    );
    const dx = (opts.rng() * 2 - 1) * maxDx;
    const x = clampX(prev.x + dx);
    const y = prev.y - gap;

    // Rev-3 (2026-11-10): rotor yoğunluğu zorluk parametresinden (K13).
    let kind: BrickKind = "stone";
    if (opts.rng() < opts.params.rotorRatio) {
      kind = opts.rng() < 0.5 ? "rotor-cw" : "rotor-ccw";
    } else if (opts.rng() < 0.08) {
      kind = "chest";
    }
    const brick: Brick = { id: id++, kind, x, y, used: false };
    bricks.push(brick);

    // Süs: kırıcı (omurga dışına yana) — K5/K13
    if (opts.rng() < opts.params.breakerRatio) {
      const side = opts.rng() < 0.5 ? -1 : 1;
      bricks.push({
        id: id++,
        kind: "breaker",
        x: clampX(x + side * (BRICK_SIZE + 1.2)),
        y: y - gap / 2,
        used: false,
      });
    }
    // Süs: coin (çarpışmasız) — UC-5
    if (opts.rng() < 0.5) {
      bricks.push({
        id: id++,
        kind: "coin",
        x: clampX(x + (opts.rng() * 2 - 1) * 2),
        y: y - gap / 2,
        used: false,
      });
    }
    prev = brick;
  }
  return { bricks, nextId: id };
}

/**
 * Erişilebilirlik BFS'i (SC-7): en alçak kutudan en yükseğe, yalnız yukarı
 * kenarlar ve `ropeRange × 0.9` mesafe ile rota var mı? Coin/kırıcı düğüm değil.
 */
export function verifyReachable(bricks: Brick[], ropeRange: number): boolean {
  const solid = bricks.filter((b) => b.kind !== "coin" && b.kind !== "breaker");
  if (solid.length < 2) return true;
  const byY = [...solid].sort((a, b) => b.y - a.y);
  const start = byY[0]!;
  const target = byY[byY.length - 1]!;
  const limit = ropeRange * BFS_FACTOR;
  const seen = new Set<number>([start.id]);
  const queue: Brick[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.id === target.id) return true;
    for (const b of solid) {
      if (seen.has(b.id) || b.y >= cur.y) continue;
      if (Math.hypot(b.x - cur.x, b.y - cur.y) <= limit) {
        seen.add(b.id);
        queue.push(b);
      }
    }
  }
  return seen.has(target.id);
}

/**
 * Çözülebilirlik garantisi (K29, 2026-11-10): oyuncudan tetik bölgesine
 * (`y < goalY + ropeRange`) ulaşmak için gereken EN AZ İP sayısı (BFS).
 *
 * Model bilinçli olarak HAFİF bir bütçe tahminidir: kenar A→B, B daha yukarıda
 * ve mesafe ≤ ropeRange × 1.5 (salınım + bırakma kazancı) ise 1 ip sayılır.
 * İp kopma (görüş hattı) kuralı bu tahmine DAHİL DEĞİL — oynanışta anlık
 * reddedilir; burada amaç katın kota ile "makul" çözülebilirliğini garanti etmek.
 */
export function minRopesToGoal(
  bricks: Brick[],
  ropeRange: number,
  from: Vec2,
  goalY: number,
): number {
  const solid = bricks.filter((b) => isSolidKind(b.kind));
  if (from.y < goalY) return 0;
  if (solid.length === 0) return Number.POSITIVE_INFINITY;
  const boosted = ropeRange * 1.5;

  const dist = new Map<number, number>();
  const queue: Array<{ brick: Brick; cost: number }> = [];
  for (const b of solid) {
    if (Math.hypot(b.x - from.x, b.y - from.y) > ropeRange) continue;
    dist.set(b.id, 1);
    queue.push({ brick: b, cost: 1 });
  }
  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const { brick, cost } = queue.shift()!;
    // Hedef: tetik bölgesine bir salınım mesafesinde ulaşan kutu (K29).
    if (brick.y < goalY + ropeRange) return cost;
    for (const other of solid) {
      if (other.y >= brick.y) continue;
      const known = dist.get(other.id);
      if (known !== undefined && known <= cost + 1) continue;
      if (Math.hypot(other.x - brick.x, other.y - brick.y) > boosted) continue;
      dist.set(other.id, cost + 1);
      queue.push({ brick: other, cost: cost + 1 });
    }
  }
  return Number.POSITIVE_INFINITY;
}

/** Kat planlama: kota ile çözülebilir kat üret — en fazla 5 deneme (K29). */
export interface FloorPlanOptions {
  bricks: Brick[];
  player: Vec2;
  seed: number;
  floor: number;
  worldWidth: number;
  worldHeight: number;
  params: PhysicsParams;
}

export interface FloorPlan {
  /** Yeni doğan kutular (mevcut `bricks`'e eklenecek). */
  bricks: Brick[];
  nextId: number;
  minRopes: number;
  attempts: number;
  guaranteed: boolean;
}

export const PLAN_ATTEMPTS = 5;

/**
 * Kat başına üretilecek omurga kutusu — dünya kaydırması (H/3) kadar dikey
 * mesafeyi kapatacak sayı (K29: kule her kat tetik bölgesine ulaşmalı).
 */
export function floorSpawnCount(worldHeight: number, params: PhysicsParams): number {
  const gapAvg = (params.gapMin + params.gapMax) / 2;
  return Math.max(3, Math.ceil(worldHeight / 3 / gapAvg) + 1);
}

/** Başlangıç kulesi: tepe noktası tetik bölgesinin hemen altına gelsin. */
export function initialSpawnCount(worldHeight: number, params: PhysicsParams): number {
  const gapAvg = (params.gapMin + params.gapMax) / 2;
  const startY = worldHeight * 0.85;
  // Tepe, tetik eşiğinin bir ip menzili ALTINDA kalsın: oyun "tetiklenmiş" başlamaz.
  const targetTop = worldHeight / 3 + 6;
  return Math.max(5, Math.ceil((startY - targetTop) / gapAvg) + 1);
}

export function planFloor(opts: FloorPlanOptions): FloorPlan {
  const goalY = opts.worldHeight / 3;
  const top =
    opts.bricks.filter((b) => isSolidKind(b.kind)).sort((a, b) => a.y - b.y)[0] ?? null;
  let best: FloorPlan | null = null;
  for (let attempt = 0; attempt < PLAN_ATTEMPTS; attempt++) {
    const spawn = spawnBricks({
      rng: mulberry32(opts.seed + opts.floor * 7 + attempt + 1),
      nextId: opts.bricks.reduce((max, b) => Math.max(max, b.id), 0) + 1,
      worldWidth: opts.worldWidth,
      worldHeight: opts.worldHeight,
      params: opts.params,
      from: top,
      count: floorSpawnCount(opts.worldHeight, opts.params),
    });
    const combined = [...opts.bricks, ...spawn.bricks];
    const minRopes = minRopesToGoal(
      combined,
      ROPE_RANGE,
      opts.player,
      goalY,
    );
    const plan: FloorPlan = {
      bricks: spawn.bricks,
      nextId: spawn.nextId,
      minRopes,
      attempts: attempt + 1,
      guaranteed: minRopes <= opts.params.ropeQuota,
    };
    if (best === null || plan.minRopes < best.minRopes) best = plan;
    if (plan.guaranteed) return plan;
  }

  // Fallback (K29): doğal kule kotaya sığmıyorsa oyuncunun üstüne GARANTİLİ
  // "çıkış merdiveni" bırak — ilk basamak ip menzilinde, sonrakiler ≤ 1.5×menzil.
  const ladder: Brick[] = [];
  let id = best!.nextId;
  let y = opts.player.y;
  for (let k = 0; k < opts.params.ropeQuota; k++) {
    y -= k === 0 ? ROPE_RANGE * 0.9 : ROPE_RANGE * 1.4;
    ladder.push({
      id: id++,
      kind: "stone",
      x: Math.min(
        opts.worldWidth - BRICK_SIZE,
        Math.max(BRICK_SIZE, opts.player.x + (k % 2 === 0 ? 0.6 : -0.6)),
      ),
      y,
      used: false,
    });
  }
  const bricks = [...best!.bricks, ...ladder];
  const minRopes = minRopesToGoal(
    [...opts.bricks, ...bricks],
    ROPE_RANGE,
    opts.player,
    goalY,
  );
  return {
    bricks,
    nextId: id,
    minRopes,
    attempts: PLAN_ATTEMPTS,
    guaranteed: minRopes <= opts.params.ropeQuota,
  };
}
