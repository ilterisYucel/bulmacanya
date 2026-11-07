/**
 * particle-sim testleri — FAZ-GAME-FX-SPEC AK-1.3 (determinizm) + kinematik.
 */
import { describe, expect, test } from "bun:test";
import { particleAlpha, simulateParticle, spawnParticle } from "./particle-sim";
import type { BurstSpec } from "./particle-sim";

const SPEC: BurstSpec = {
  count: 10,
  speed: [100, 200],
  angle: [0, Math.PI],
  gravity: 300,
  drag: 0.5,
  lifeMs: [400, 600],
  fadeOutMs: 150,
  scale: [0.5, 1.5],
};

function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

test("AK-1.3: aynı spec + rng dizisi → birebir aynı durum", () => {
  const a = spawnParticle(SPEC, 10, 20, seq([0.5, 0.25, 0.75]));
  const b = spawnParticle(SPEC, 10, 20, seq([0.5, 0.25, 0.75]));
  expect(a).toEqual(b);
});

test("spawn: açı/speed/ömür/ölçek rng'den gelir", () => {
  const p = spawnParticle(SPEC, 0, 0, seq([0, 1, 0.5]));
  // rng sırası: açı=0 → sadece +x; speed=1 → 200; ömür=0.5 → 500; ölçek=0.5 → 1.0
  expect(p.vx).toBeCloseTo(200);
  expect(p.vy).toBeCloseTo(0);
  expect(p.lifeMs).toBe(500);
  expect(p.scale).toBeCloseTo(1.0);
});

test("sim: yerçekimi hızı artırır, drag hızı azaltır", () => {
  const p = spawnParticle(SPEC, 0, 0, seq([0.5, 0.5, 0.5]));
  p.gravity = 0;
  p.drag = 1;
  p.vx = 100;
  p.vy = 0;
  simulateParticle(p, 1000);
  expect(p.x).toBeCloseTo(100);
  const q = spawnParticle(SPEC, 0, 0, seq([0.5, 0.5, 0.5]));
  q.gravity = 500;
  q.drag = 1;
  q.vx = 0;
  q.vy = 0;
  simulateParticle(q, 1000);
  // Euler: önce hız güncellenir (vy=500), sonra konum (y=500·1)
  expect(q.vy).toBeCloseTo(500);
  expect(q.y).toBeCloseTo(500);
});

test("sim: ömür bitince active = false", () => {
  const p = spawnParticle(SPEC, 0, 0, seq([0.5, 0.5, 0]));
  simulateParticle(p, 401); // lifeMs = 400
  expect(p.active).toBe(false);
});

test("sim: dt ≤ 0 no-op", () => {
  const p = spawnParticle(SPEC, 0, 0, seq([0.5, 0.5, 0.5]));
  const before = { ...p };
  simulateParticle(p, 0);
  simulateParticle(p, -5);
  expect(p).toEqual(before);
});

test("alfa: son fadeOutMs penceresinde 1→0, öncesinde 1", () => {
  const p = spawnParticle(SPEC, 0, 0, seq([0.5, 0.5, 1])); // lifeMs = 600
  expect(particleAlpha(p)).toBe(1);
  p.ageMs = 500; // kalan 100 < fadeOutMs 150
  expect(particleAlpha(p)).toBeCloseTo(100 / 150);
  p.ageMs = 600;
  expect(particleAlpha(p)).toBe(0);
});
