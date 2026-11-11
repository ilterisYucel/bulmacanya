/**
 * scoring testleri — UC-5/UC-6 K9: zincir bonusu + yıldız eşikleri.
 */
import { describe, expect, test } from "bun:test";
import { CHAIN_SCORE, COIN_SCORE, FLOOR_SCORE, chainBonus, starsFor } from "./scoring";

describe("scoring", () => {
  test("sabit puanlar", () => {
    expect(FLOOR_SCORE).toBe(100);
    expect(COIN_SCORE).toBe(25);
    expect(CHAIN_SCORE).toBe(25);
  });

  test("zincir bonusu 25×halka; negatif güvenli", () => {
    expect(chainBonus(0)).toBe(0);
    expect(chainBonus(3)).toBe(75);
    expect(chainBonus(-2)).toBe(0);
  });

  test("yıldız: par → 3, 1.5×par → 2, üstü 1", () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(11, 10)).toBe(2);
    expect(starsFor(15, 10)).toBe(2);
    expect(starsFor(16, 10)).toBe(1);
  });
});
