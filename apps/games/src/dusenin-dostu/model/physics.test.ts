/**
 * physics testleri — UC-2/SC-3: PRNG determinizmi, segment-AABB, sarkaç
 * (motorlu/pasif), teğet çıkış hızı, balistik entegrasyon.
 */
import { describe, expect, test } from "bun:test";
import {
  integrateAir,
  mulberry32,
  releaseVelocity,
  ropePosition,
  segIntersectsAabb,
  stepSwing,
} from "./physics";
import { DIFFICULTY_PARAMS } from "./difficulty";

describe("mulberry32", () => {
  test("aynı seed aynı diziyi üretir", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  test("farklı seed farklı dizi", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });
});

describe("segIntersectsAabb", () => {
  test("kutunun içinden geçen segment kesişir", () => {
    expect(segIntersectsAabb({ x: 0, y: 0 }, { x: 10, y: 0 }, 5, 0, 1)).toBe(true);
  });

  test("kutunun yanından geçen segment kesişmez", () => {
    expect(segIntersectsAabb({ x: 0, y: 0 }, { x: 10, y: 0 }, 5, 5, 1)).toBe(false);
  });

  test("uç noktası kutunun içinde", () => {
    expect(segIntersectsAabb({ x: 5, y: 0 }, { x: 5.2, y: 0 }, 5, 0, 1)).toBe(true);
  });
});

describe("stepSwing", () => {
  const rotorCw = { brickId: 1, length: 5, angle: 0, omega: 0 };

  test("CW rotor torkla hızlanır ve ω_max'ı aşmaz", () => {
    let r = { ...rotorCw };
    for (let i = 0; i < 600; i++) {
      r = stepSwing(r, "rotor-cw", DIFFICULTY_PARAMS.orta, 1 / 60);
    }
    expect(r.omega).toBeGreaterThan(0);
    expect(r.omega).toBeLessThanOrEqual(DIFFICULTY_PARAMS.orta.rotorMaxOmega + 1e-6);
  });

  test("CCW rotor negatif yönde döner", () => {
    let r = { ...rotorCw };
    for (let i = 0; i < 60; i++) {
      r = stepSwing(r, "rotor-ccw", DIFFICULTY_PARAMS.orta, 1 / 60);
    }
    expect(r.omega).toBeLessThan(0);
  });

  test("pasif sarkaç sönümlenir ve aşağıda dengelenir", () => {
    let r = { brickId: 1, length: 5, angle: 0, omega: 0 };
    for (let i = 0; i < 60 * 60; i++) {
      r = stepSwing(r, "stone", DIFFICULTY_PARAMS.orta, 1 / 60);
    }
    expect(Math.abs(r.omega)).toBeLessThan(0.1);
    expect(Math.abs(r.angle - Math.PI / 2)).toBeLessThan(0.1);
  });
});

describe("ropePosition / releaseVelocity", () => {
  test("aşağıdaki oyuncu: pozisyon merkez + (0, L)", () => {
    const p = ropePosition({ x: 10, y: 10 }, { brickId: 1, length: 5, angle: Math.PI / 2, omega: 0 });
    expect(p.x).toBeCloseTo(10, 5);
    expect(p.y).toBeCloseTo(15, 5);
  });

  test("teğet çıkış hızı ω×L, aşağı noktada sola", () => {
    const v = releaseVelocity({ brickId: 1, length: 5, angle: Math.PI / 2, omega: 2 });
    expect(v.x).toBeCloseTo(-10, 5);
    expect(v.y).toBeCloseTo(0, 5);
  });
});

describe("integrateAir", () => {
  test("yerçekimi dikey hızı artırır", () => {
    const r = integrateAir({ x: 0, y: 0 }, { x: 3, y: 0 }, 8, 1 / 60);
    expect(r.vel.y).toBeCloseTo(8 / 60, 5);
    expect(r.vel.x).toBe(3);
    expect(r.pos.x).toBeCloseTo(3 / 60, 5);
  });
});
