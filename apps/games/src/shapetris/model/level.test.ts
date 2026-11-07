import { describe, expect, test } from "bun:test";
import { generateLevel, mulberry32, parseLevel, seedFromString } from "./level";

describe("shapetris level (UC-2)", () => {
  test("AK-2.2: üretim formülü — level 0'da eksiltme yok", () => {
    const rng = mulberry32(1);
    const { goal, filledCount, removedCount } = generateLevel(0, rng);
    expect(goal.length).toBe(8);
    expect(goal.every((r) => r.length === 8)).toBe(true);
    expect(removedCount).toBe(0);
    expect(filledCount).toBeLessThanOrEqual(144);
    expect(filledCount).toBeGreaterThan(0);
  });

  test("AK-2.2: eksiltme sayısı ceil(min(dolu, min(32, level/5)))", () => {
    for (const level of [1, 4, 5, 7, 50, 200]) {
      const rng = mulberry32(42);
      const { filledCount, removedCount } = generateLevel(level, rng);
      const target = Math.min(filledCount, Math.min(32, level / 5));
      const expected = target <= 0 ? 0 : Math.ceil(target);
      // rastgele seçim tekrar edebilir → en fazla expected kadar silinir
      expect(removedCount).toBeLessThanOrEqual(expected);
      expect(removedCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("AK-2.4: aynı seed aynı hedefi üretir (deterministik)", () => {
    const a = generateLevel(12, mulberry32(7)).goal;
    const b = generateLevel(12, mulberry32(7)).goal;
    expect(a).toEqual(b);
  });

  test("hedef yalnız 8×8 iç bölge yansımasıdır; tüm hücreler boolean", () => {
    const { goal } = generateLevel(3, mulberry32(99));
    for (const row of goal) {
      for (const cell of row) {
        expect(typeof cell).toBe("boolean");
      }
    }
  });

  test("yüksek seviyede formül doyar (max_tiles=144, eksiltme≤32)", () => {
    const rng = mulberry32(5);
    const { filledCount, removedCount } = generateLevel(1000, rng);
    expect(filledCount).toBeLessThanOrEqual(144);
    expect(removedCount).toBeLessThanOrEqual(32);
  });
});

describe("shapetris level — kampanya/günlük/sonsuz (UC-11, UC-14)", () => {
  test("AK-11.1: parseLevel geçerli 8×8 JSON'u boolean matrise çevirir", () => {
    const json = [
      [0, 1, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const goal = parseLevel(json);
    expect(goal.length).toBe(8);
    expect(goal[0]?.[1]).toBe(true);
    expect(goal[0]?.[0]).toBe(false);
    expect(goal[1]?.[2]).toBe(true);
  });

  test("AK-11.1: parseLevel bozuk boyutları REDDEDER", () => {
    expect(() => parseLevel([[1, 0], [0, 1]])).toThrow();
    expect(() => parseLevel("string")).toThrow();
    expect(() => parseLevel(null)).toThrow();
  });

  test("AK-14.1/14.2: seedFromString deterministik ve farklı girdide farklı", () => {
    const a = seedFromString("gunluk.2026-11-05");
    const b = seedFromString("gunluk.2026-11-05");
    const c = seedFromString("gunluk.2026-11-06");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(seedFromString("sonsuz.0")).not.toBe(seedFromString("sonsuz.1"));
  });

  test("AK-14.1: aynı tarih tohumu aynı hedefi üretir", () => {
    const g1 = generateLevel(0, mulberry32(seedFromString("gunluk.2026-11-05"))).goal;
    const g2 = generateLevel(0, mulberry32(seedFromString("gunluk.2026-11-05"))).goal;
    expect(g1).toEqual(g2);
  });
});
