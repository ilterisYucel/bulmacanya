/**
 * scoring testleri — FAZ-GAME7 AK-4.5 (UC-4, FR-4.5).
 */
import { describe, expect, test } from "bun:test";
import {
  addScore,
  applyHintPenalty,
  completionBonus,
  levelScore,
  wordScore,
} from "./scoring";

test("AK-4.5: dedektif 5 harf + 2 hak − 1 ipucu = 120", () => {
  const score = levelScore("dedektif", 5, 2, 1);
  expect(wordScore("dedektif", 5)).toBe(100);
  expect(completionBonus("dedektif", 2)).toBe(30);
  expect(score).toBe(120);
});

test("klasik: uzunluk×10 + kalan saniye×5", () => {
  expect(wordScore("klasik", 4)).toBe(40);
  expect(completionBonus("klasik", 10)).toBe(50);
  expect(levelScore("klasik", 4, 10, 0)).toBe(90);
});

test("sabit: uzunluk×20 + kalan can×15", () => {
  expect(levelScore("sabit", 4, 2, 0)).toBe(110);
});

test("ipucu kesintisi: alt sınır 1; kalan negatifse bonus 0", () => {
  expect(applyHintPenalty(25, 3)).toBe(1);
  expect(completionBonus("klasik", -5)).toBe(0);
});

test("toplam birikir (shapetris emsali)", () => {
  expect(addScore(100, 30)).toBe(130);
});
