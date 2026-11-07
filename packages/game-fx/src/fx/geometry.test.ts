/**
 * geometry testleri — FAZ-GAME-FX-SPEC AK-2.1 (geometri saflığı) + AK-2.3 (meta boyutlar).
 */
import { describe, expect, test } from "bun:test";
import { FX_PRIMITIVES, shardPoints, starPoints } from "./geometry";

test("AK-2.1: starPoints(4) → 9 nokta, hepsi dış yarıçap sınırı içinde", () => {
  const pts = starPoints(4, 48, 20);
  expect(pts).toHaveLength(9); // merkez + 4 dış + 4 iç
  for (const p of pts) {
    expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(48 + 1e-9);
  }
  expect(pts[0]).toEqual({ x: 0, y: 0 });
});

test("starPoints: dış noktalar outerR'de, iç noktalar innerR'de", () => {
  const pts = starPoints(4, 50, 25);
  for (let i = 1; i < pts.length; i += 2) {
    expect(Math.hypot(pts[i]!.x, pts[i]!.y)).toBeCloseTo(50);
    expect(Math.hypot(pts[i + 1]!.x, pts[i + 1]!.y)).toBeCloseTo(25);
  }
});

test("shardPoints: deterministik ve boyut sınırında (jitter dahil)", () => {
  const a = shardPoints(2, 64, 64);
  const b = shardPoints(2, 64, 64);
  expect(a).toEqual(b);
  expect(a).toHaveLength(5);
  for (const p of a) {
    expect(Math.abs(p.x)).toBeLessThanOrEqual(32 * 1.35 + 1e-9);
    expect(Math.abs(p.y)).toBeLessThanOrEqual(32 * 1.35 + 1e-9);
  }
});

test("AK-2.3: FX_PRIMITIVES boyutları SPEC'teki değerlerle birebir", () => {
  expect(FX_PRIMITIVES.dot).toEqual({ w: 32, h: 32 });
  expect(FX_PRIMITIVES.ring).toEqual({ w: 128, h: 128 });
  expect(FX_PRIMITIVES.sparkle).toEqual({ w: 96, h: 96 });
  expect(FX_PRIMITIVES.shard).toEqual({ w: 64, h: 64 });
  expect(FX_PRIMITIVES.confetti).toEqual({ w: 32, h: 8 });
});
