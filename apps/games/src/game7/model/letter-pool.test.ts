/**
 * letter-pool testleri — FAZ-GAME7 AK-1.1..1.4/1.6 (UC-1).
 */
import { describe, expect, test } from "bun:test";
import { buildLetterPool, pickLetter } from "./letter-pool";
import { TR_ALPHABET } from "./words";

function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

function count(letters: readonly string[], ch: string): number {
  return letters.filter((l) => l === ch).length;
}

test("AK-1.1: SEVEN emsali — tekrarlı harf max tekrar kadar üretilir (B1 bug kapanışı)", () => {
  const pool = buildLetterPool(
    { mode: "klasik", targetWords: ["SEVEN", "GAME"], distractorRatio: 0 },
    seq([0]),
  );
  expect(count(pool.letters, "E")).toBe(2); // SEVEN → E×2, GAME → E×1 → max 2
  expect(count(pool.letters, "S")).toBe(1);
  expect(count(pool.letters, "G")).toBe(1);
  // her aday birebir oluşturulabilir: SEVEN için 2 E mevcut
  expect(count(pool.letters, "E")).toBeGreaterThanOrEqual(2);
});

test("AK-1.2: çeldirici ≈ toplamın %30'u ve hedef harflerden ÇELDİRİCİ üretilmez", () => {
  const pool = buildLetterPool(
    { mode: "klasik", targetWords: ["KEDİ"], distractorRatio: 0.3 },
    seq(Array(29).fill(0)),
  );
  const target = pool.letters.length - pool.distractorCount; // K,E,D,İ = 4
  expect(target).toBe(4);
  const total = pool.letters.length;
  expect(pool.distractorCount).toBe(Math.round((4 * 0.3) / 0.7)); // 2
  expect(Math.abs(pool.distractorCount / total - 0.3)).toBeLessThan(0.1);
  for (const ch of pool.letters.slice(target)) {
    expect(["K", "E", "D", "İ"]).not.toContain(ch);
  }
});

test("AK-1.2: oran 0 → çeldirici yok", () => {
  const pool = buildLetterPool(
    { mode: "klasik", targetWords: ["ELMA"], distractorRatio: 0 },
    seq([0]),
  );
  expect(pool.distractorCount).toBe(0);
  expect(pool.letters).toEqual(["E", "L", "M", "A"]);
});

test("AK-1.3: çekim multiset'ten ağırlıklı — çoğul harf daha sık", () => {
  const pool = { letters: ["A", "B", "B"], distractorCount: 0 };
  expect(pickLetter(pool, () => 0)).toBe("A");
  expect(pickLetter(pool, () => 0.5)).toBe("B");
  expect(pickLetter(pool, () => 0.99)).toBe("B");
});

test("AK-1.4: aynı rng dizisi → birebir aynı havuz", () => {
  const input = {
    mode: "klasik" as const,
    targetWords: ["KEDİ", "KUŞ"],
    distractorRatio: 0.3,
  };
  const a = buildLetterPool(input, seq([0.1, 0.2, 0.3, 0.4, 0.5]));
  const b = buildLetterPool(input, seq([0.1, 0.2, 0.3, 0.4, 0.5]));
  expect(a).toEqual(b);
});

test("AK-1.6: sabit modda kilitli pozisyon harfleri havuzda ÜRETİLMEZ", () => {
  const pool = buildLetterPool(
    {
      mode: "sabit",
      targetWords: ["KEDİ", "KALİ"],
      pattern: ["K", null, null, "İ"],
      distractorRatio: 0,
    },
    seq([0]),
  );
  // serbest pozisyonlar (1,2): KEDİ→E,D; KALİ→A,L
  expect(pool.letters.sort()).toEqual(["A", "D", "E", "L"]);
  expect(count(pool.letters, "K")).toBe(0);
  expect(count(pool.letters, "İ")).toBe(0);
});

test("edge: tüm harfler hedefteyse çeldirici üretilmez; oran ≥1 kırpılır", () => {
  // 29 harfin tamamı hedef → çeldirici adayı kalmaz (AK edge)
  const pool = buildLetterPool(
    { mode: "klasik", targetWords: [...TR_ALPHABET], distractorRatio: 1 },
    seq([0]),
  );
  expect(pool.distractorCount).toBe(0);
  expect(pool.letters).toHaveLength(29);
});

test("edge: boş hedef-set → boş havuz, hata yok", () => {
  const pool = buildLetterPool(
    { mode: "klasik", targetWords: [], distractorRatio: 0.3 },
    seq([0]),
  );
  expect(pool.letters).toEqual([]);
  expect(() => pickLetter(pool, () => 0)).toThrow();
});
