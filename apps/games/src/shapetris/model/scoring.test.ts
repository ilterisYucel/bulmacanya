import { describe, expect, test } from "bun:test";
import { addScore, levelScore } from "./scoring";

describe("shapetris scoring (UC-5)", () => {
  test("AK-5.2: bölüm skoru = 10 − ipucu kullanımı", () => {
    expect(levelScore(0)).toBe(10);
    expect(levelScore(2)).toBe(8);
    expect(levelScore(10)).toBe(1);
  });

  test("alt sınır 1 (ipucu 9'dan fazla olsa bile)", () => {
    expect(levelScore(9)).toBe(1);
    expect(levelScore(50)).toBe(1);
  });

  test("toplam skor birikir", () => {
    let total = 0;
    total = addScore(total, levelScore(1));
    total = addScore(total, levelScore(0));
    expect(total).toBe(9 + 10);
  });
});
