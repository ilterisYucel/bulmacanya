/**
 * patterns testleri — FAZ-GAME7 AK-3.6 (desen üreteci) + AK-3.3 (eşleşme).
 */
import { describe, expect, test } from "bun:test";
import { buildPattern, patternMatch } from "./patterns";

function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

test("AK-3.6: sabit oranı %30-50, en az 1 serbest; deterministik", () => {
  const a = buildPattern("KALİ", seq([0.5, 0.5, 0.5]));
  const b = buildPattern("KALİ", seq([0.5, 0.5, 0.5]));
  expect(a).toEqual(b);
  const fixed = a.filter((c) => c !== null).length;
  expect(fixed).toBe(2); // 4 harf, %40 → 2 sabit
  expect(a.filter((c) => c === null).length).toBeGreaterThanOrEqual(1);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== null) expect(a[i]).toBe("KALİ"[i]);
  }
});

test("AK-3.6: 6 harfli kelimede sabit sayısı 2-3 arası", () => {
  for (let r = 0; r < 10; r++) {
    const p = buildPattern("ANKARA", seq([r / 10, r / 10, r / 10, r / 10, r / 10]));
    const fixed = p.filter((c) => c !== null).length;
    expect(fixed).toBeGreaterThanOrEqual(2);
    expect(fixed).toBeLessThanOrEqual(3);
    expect(p.filter((c) => c === null).length).toBeGreaterThanOrEqual(1);
  }
});

test("AK-3.6: 3 harfli kelimede en az 1 serbest korunur", () => {
  const p = buildPattern("NAR", seq([0.99, 0, 0]));
  expect(p.filter((c) => c === null).length).toBeGreaterThanOrEqual(1);
  expect(p.filter((c) => c !== null).length).toBeLessThanOrEqual(2);
});

test("patternMatch: sabit pozisyon birebir, uzunluk eşit (AK-3.3)", () => {
  expect(patternMatch("KEDİ", ["K", null, null, "İ"])).toBe(true);
  expect(patternMatch("KALİ", ["K", null, null, "İ"])).toBe(true);
  expect(patternMatch("KAZİ", ["K", null, null, "İ"])).toBe(true);
  expect(patternMatch("ELMA", ["K", null, null, "İ"])).toBe(false);
  expect(patternMatch("KEDİ", ["K", null, null])).toBe(false); // uzunluk farkı
});
