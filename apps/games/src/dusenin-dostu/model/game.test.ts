/**
 * game testleri — UC-2/UC-3/UC-5/UC-6: tap-ip, bırakma, iniş, kırıcı, kopma,
 * kat geçişi, kota, determinizm ve mod kuralları (SC-3).
 */
import { describe, expect, test } from "bun:test";
import { createGame, step } from "./game";
import { attachRejection, previewLanding } from "./preview";
import { DIFFICULTY_PARAMS } from "./difficulty";
import type { GameState } from "./types";
import { FIXED_DT } from "./types";

const OPTS = {
  mode: "endless" as const,
  difficulty: "orta" as const,
  seed: 42,
  worldWidth: 80,
  worldHeight: 90,
};

function manual(over: Partial<GameState>): GameState {
  return {
    ...createGame(OPTS),
    ...over,
  };
}

function run(state: GameState, frames: number, input: Parameters<typeof step>[1] = null) {
  let s = state;
  const events: ReturnType<typeof step>["events"] = [];
  for (let i = 0; i < frames; i++) {
    const r = step(s, i === 0 ? input : null, FIXED_DT);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}

describe("createGame", () => {
  test("başlangıç durumu: havada, kutu var, kota dolu", () => {
    const s = createGame(OPTS);
    expect(s.phase).toBe("air");
    expect(s.bricks.length).toBeGreaterThan(0);
    expect(s.ropesLeft).toBe(DIFFICULTY_PARAMS.orta.ropeQuota);
    expect(s.floor).toBe(0);
    expect(s.deathReason).toBeNull();
  });
});

describe("tap-ip (UC-3)", () => {
  test("menzildeki kutuya tap ip atar, kota düşer", () => {
    const s = createGame(OPTS);
    const target = s.bricks
      .filter((b) => b.kind === "stone" || b.kind === "rotor-cw" || b.kind === "rotor-ccw")
      .map((b) => ({ b, d: Math.hypot(b.x - s.player.x, b.y - s.player.y) }))
      .filter(({ b, d }) => d <= 6 && attachRejection(s, b.id) === null)
      .sort((a, b) => a.d - b.d)[0]!;
    const r = step(s, { kind: "tap", brickId: target.b.id }, 0);
    expect(r.events.some((e) => e.type === "attach")).toBe(true);
    expect(r.state.phase).toBe("swing");
    expect(r.state.ropesLeft).toBe(s.ropesLeft - 1);
  });

  test("menzil dışı kutuya tap yok sayılır", () => {
    const s = createGame(OPTS);
    const far = s.bricks
      .map((b) => ({ b, d: Math.hypot(b.x - s.player.x, b.y - s.player.y) }))
      .sort((a, b) => b.d - a.d)[0]!;
    expect(far.d).toBeGreaterThan(6);
    const r = step(s, { kind: "tap", brickId: far.b.id }, FIXED_DT);
    expect(r.events.some((e) => e.type === "attach")).toBe(false);
    expect(r.state.phase).toBe("air");
  });

  test("boşluğa tap salınımı bitirir, teğet hızla havaya geçer", () => {
    const s = manual({
      phase: "swing",
      rope: { brickId: 1, length: 4, angle: Math.PI / 2, omega: 2 },
      bricks: [{ id: 1, kind: "stone", x: 20, y: 20, used: false }],
      player: { x: 20, y: 24 },
    });
    const r = step(s, { kind: "tap", brickId: null }, FIXED_DT);
    expect(r.events.some((e) => e.type === "release")).toBe(true);
    expect(r.state.phase).toBe("air");
    expect(r.state.rope).toBeNull();
    expect(r.state.velocity.x).toBeCloseTo(-8, 3);
  });

  test("yerde boşluğa tap zıplatır", () => {
    const s = manual({
      phase: "ground",
      player: { x: 20, y: 28.5 },
      velocity: { x: 0, y: 0 },
      bricks: [{ id: 1, kind: "stone", x: 20, y: 30, used: false }],
      ropesLeft: 2,
    });
    const r = step(s, { kind: "tap", brickId: null }, FIXED_DT);
    expect(r.state.phase).toBe("air");
    expect(r.state.velocity.y).toBeLessThan(0);
  });
});

describe("çarpışma (UC-2/UC-5)", () => {
  test("kutu üstüne iniş: ground + zincir sıfır + land olayı", () => {
    const s = manual({
      player: { x: 20, y: 32 },
      velocity: { x: 0, y: 15 },
      chain: 3,
      bricks: [{ id: 1, kind: "stone", x: 20, y: 52, used: false }],
    });
    const { state, events } = run(s, 120);
    expect(events.some((e) => e.type === "land")).toBe(true);
    expect(state.phase).toBe("ground");
    expect(state.chain).toBe(0);
    expect(state.player.y).toBeCloseTo(52 - 0.75 - 0.75, 3);
  });

  test("kırıcıya oyuncu teması oyunu bitirir", () => {
    const s = manual({
      player: { x: 20, y: 40 },
      velocity: { x: 0, y: 5 },
      bricks: [{ id: 1, kind: "breaker", x: 20, y: 50, used: false }],
    });
    const { state, events } = run(s, 60);
    expect(events.some((e) => e.type === "over" && e.reason === "breaker")).toBe(true);
    expect(state.phase).toBe("over");
  });

  test("ip kırıcıdan geçerse kopar, oyuncu havaya geçer", () => {
    const s = manual({
      phase: "swing",
      rope: { brickId: 1, length: 5, angle: Math.PI / 2, omega: 0 },
      player: { x: 20, y: 35 },
      bricks: [
        { id: 1, kind: "stone", x: 20, y: 30, used: false },
        { id: 2, kind: "breaker", x: 20, y: 32.5, used: false },
      ],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "ropeBreak")).toBe(true);
    expect(r.state.phase).toBe("air");
  });

  test("coin toplanır, skor artar", () => {
    const s = manual({
      player: { x: 20, y: 35 },
      velocity: { x: 0, y: 0 },
      bricks: [{ id: 1, kind: "coin", x: 20, y: 36, used: false }],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "coin")).toBe(true);
    expect(r.state.coins).toBe(1);
    expect(r.state.bricks[0]!.used).toBe(true);
  });

  test("sandık dokununca +1 ip +1 coin (çarpışmasız bonus)", () => {
    const s = manual({
      player: { x: 20, y: 35 },
      velocity: { x: 0, y: 2 },
      ropesLeft: 1,
      bricks: [{ id: 1, kind: "chest", x: 21.5, y: 36, used: false }],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "chest")).toBe(true);
    expect(r.state.ropesLeft).toBe(2);
    expect(r.state.coins).toBe(1);
  });
});

describe("kat geçişi ve kota (UC-4/UC-5)", () => {
  test("üst bölgeye çıkınca kat +1, skor +100, kota yenilenir", () => {
    const s = manual({
      player: { x: 20, y: 2 },
      velocity: { x: 0, y: 0 },
      floor: 5,
      score: 500,
      ropesLeft: 0,
      bricks: [{ id: 1, kind: "stone", x: 20, y: 60, used: false }],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "floorUp")).toBe(true);
    expect(r.state.floor).toBe(6);
    expect(r.state.score).toBeGreaterThanOrEqual(600);
    expect(r.state.ropesLeft).toBe(DIFFICULTY_PARAMS.orta.ropeQuota);
  });

  test("kota bitip yerde kalınca 'ip bitti' bitişi", () => {
    const s = manual({
      phase: "ground",
      player: { x: 20, y: 28.5 },
      ropesLeft: 0,
      bricks: [{ id: 1, kind: "stone", x: 20, y: 30, used: false }],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "over" && e.reason === "out-of-rope")).toBe(true);
  });

  test("404. katta paskalya yumurtası bir kez tetiklenir", () => {
    const s = manual({
      player: { x: 20, y: 2 },
      floor: 403,
      bricks: [{ id: 1, kind: "stone", x: 20, y: 60, used: false }],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "egg404")).toBe(true);
    expect(r.state.egg404).toBe(true);
  });
});

describe("ölüm ve süre (UC-6)", () => {
  test("ekran altına düşmek oyunu bitirir", () => {
    const s = manual({
      player: { x: 20, y: 170 },
      velocity: { x: 0, y: 20 },
      bricks: [],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "over" && e.reason === "fall")).toBe(true);
  });

  test("zamana karşı süre bitince biter", () => {
    const s = manual({ timeLeft: 0.01, bricks: [] });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "over" && e.reason === "time")).toBe(true);
  });

  test("over durumunda step değişiklik üretmez", () => {
    const s = manual({ phase: "over", deathReason: "fall" });
    const r = step(s, { kind: "tap", brickId: 1 }, FIXED_DT);
    expect(r.state).toEqual(s);
    expect(r.events.length).toBe(0);
  });
});

describe("determinizm (SC-3)", () => {
  test("aynı state + input dizisi aynı sonucu verir", () => {
    const s = createGame(OPTS);
    const target = s.bricks[0]!;
    const a = run(s, 120, { kind: "tap", brickId: target.id });
    const b = run(s, 120, { kind: "tap", brickId: target.id });
    expect(a.state).toEqual(b.state);
    expect(a.events).toEqual(b.events);
  });
});

describe("review düzeltme turu (G1/G2/S1)", () => {
  test("G1 — önizleme inişi gerçek inişle ±1 kutu örtüşür (SC-4)", () => {
    const s = manual({
      player: { x: 20, y: 30 },
      velocity: { x: 2, y: 4 },
      bricks: [{ id: 1, kind: "stone", x: 22, y: 45, used: false }],
    });
    const preview = previewLanding(s);
    expect(preview.landing).not.toBeNull();
    const { state, events } = run(s, 200);
    expect(events.some((e) => e.type === "land")).toBe(true);
    expect(Math.abs(state.player.x - preview.landing!.x)).toBeLessThan(0.75);
    expect(Math.abs(state.player.y - preview.landing!.y)).toBeLessThan(0.75);
  });

  test("G2 — havadayken ikinci kutuya tap zinciri artırır (retarget)", () => {
    const s = manual({
      phase: "swing",
      rope: { brickId: 1, length: 4, angle: Math.PI / 2, omega: 0 },
      player: { x: 20, y: 34 },
      ropesLeft: 3,
      bricks: [
        { id: 1, kind: "stone", x: 20, y: 30, used: false },
        { id: 2, kind: "stone", x: 24, y: 32, used: false },
      ],
    });
    const r = step(s, { kind: "tap", brickId: 2 }, FIXED_DT);
    const attach = r.events.find((e) => e.type === "attach");
    expect(attach).toBeTruthy();
    if (attach?.type === "attach") expect(attach.chain).toBe(1);
    expect(r.state.rope?.brickId).toBe(2);
    expect(r.state.ropesLeft).toBe(2);
  });

  test("S1 — kullanılmış sandık artık zemin değil (bonus toplandı)", () => {
    const s = manual({
      player: { x: 20, y: 32 },
      velocity: { x: 0, y: 15 },
      ropesLeft: 1,
      bricks: [{ id: 1, kind: "chest", x: 20, y: 52, used: true }],
    });
    const { state, events } = run(s, 120);
    expect(events.some((e) => e.type === "chest")).toBe(false);
    expect(state.phase).toBe("air");
  });
});

describe("oynanış revizyonu (Rev-1/Rev-2)", () => {
  test("rotora tutunma anında ω = ±ω_max (motor hissi)", () => {
    const s = manual({
      phase: "air",
      player: { x: 25, y: 40 },
      velocity: { x: 0, y: 0 },
      bricks: [{ id: 1, kind: "rotor-cw", x: 20, y: 40, used: false }],
    });
    const r = step(s, { kind: "tap", brickId: 1 }, FIXED_DT);
    expect(r.state.rope?.omega).toBeCloseTo(DIFFICULTY_PARAMS.orta.rotorMaxOmega, 5);

    const ccw = manual({
      phase: "air",
      player: { x: 25, y: 40 },
      velocity: { x: 0, y: 0 },
      bricks: [{ id: 1, kind: "rotor-ccw", x: 20, y: 40, used: false }],
    });
    const rc = step(ccw, { kind: "tap", brickId: 1 }, FIXED_DT);
    expect(rc.state.rope?.omega).toBeCloseTo(-DIFFICULTY_PARAMS.orta.rotorMaxOmega, 5);
  });

  test("taşa tutunma teğet momentumu korur", () => {
    const s = manual({
      phase: "air",
      player: { x: 25, y: 40 },
      velocity: { x: 0, y: 10 },
      bricks: [{ id: 1, kind: "stone", x: 20, y: 40, used: false }],
    });
    // θ=0 (sağda), v=(0,10) → v_tan=10, L=5 → ω₀=2 (dt=0: fizik adımı yok)
    const r = step(s, { kind: "tap", brickId: 1 }, 0);
    expect(r.state.rope?.omega).toBeCloseTo(2, 5);
  });

  test("salınımda ip taşa değerse kopar, serbest düşüşe geçer", () => {
    const s = manual({
      phase: "swing",
      rope: { brickId: 1, length: 5, angle: Math.PI / 2, omega: 0.5 },
      player: { x: 20, y: 45 },
      bricks: [
        { id: 1, kind: "stone", x: 20, y: 40, used: false },
        { id: 2, kind: "stone", x: 20, y: 42.5, used: false },
      ],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "ropeBreak")).toBe(true);
    expect(r.state.phase).toBe("air");
    expect(r.state.rope).toBeNull();
  });

  test("salınımda oyuncu yandan çarparsa ip KOPMAZ, geri seker", () => {
    const s = manual({
      phase: "swing",
      rope: { brickId: 1, length: 5, angle: Math.PI / 2, omega: 0.5 },
      player: { x: 20, y: 45 },
      bricks: [
        { id: 1, kind: "stone", x: 20, y: 40, used: false },
        { id: 2, kind: "stone", x: 21.2, y: 44, used: false },
      ],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "ropeBreak")).toBe(false);
    expect(r.state.phase).toBe("swing");
    expect(r.state.rope).not.toBeNull();
    expect(r.state.rope!.omega).toBeLessThan(0);
  });

  test("salınımda oyuncu üstten çarparsa kutunun üzerine iner", () => {
    const s = manual({
      phase: "swing",
      rope: { brickId: 1, length: 5, angle: Math.PI / 2, omega: 0.2 },
      player: { x: 20, y: 45 },
      bricks: [
        { id: 1, kind: "stone", x: 20, y: 40, used: false },
        { id: 2, kind: "stone", x: 20.5, y: 45.5, used: false },
      ],
    });
    const r = step(s, null, FIXED_DT);
    expect(r.events.some((e) => e.type === "land")).toBe(true);
    expect(r.state.phase).toBe("ground");
    expect(r.state.rope).toBeNull();
  });
});
