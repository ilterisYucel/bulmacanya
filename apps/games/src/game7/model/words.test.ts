/**
 * words testleri — FAZ-GAME7 AK-1.5 (TR karakter seti) + sözlük sorguları (UC-1/UC-3).
 */
import { describe, expect, test } from "bun:test";
import {
  LevelDataError,
  TR_ALPHABET,
  WORD_LIST,
  candidatesFor,
  hasWord,
  pickWord,
  wordsMatching,
} from "./words";

test("AK-1.5: tüm kelimeler TR alfabesiyle yazılabilir ve uzunluk 3-8", () => {
  const alphabet: Set<string> = new Set(TR_ALPHABET);
  for (const entry of WORD_LIST) {
    expect(entry.word.length).toBeGreaterThanOrEqual(3);
    expect(entry.word.length).toBeLessThanOrEqual(8);
    for (const ch of entry.word) {
      expect(alphabet.has(ch)).toBe(true);
    }
  }
});

test("pickWord: tier + uzunluk aralığına uyar, rng deterministik", () => {
  const a = pickWord("kolay", 3, 4, () => 0.5);
  const b = pickWord("kolay", 3, 4, () => 0.5);
  expect(a).toBe(b);
  expect(a.length).toBeGreaterThanOrEqual(3);
  expect(a.length).toBeLessThanOrEqual(4);
  const entry = WORD_LIST.find((w) => w.word === a)!;
  expect(entry.tier).toBe("kolay");
});

test("pickWord: aralık boşsa LEVEL_DATA_EMPTY (FR-3.7)", () => {
  expect(() => pickWord("kolay", 5, 5, () => 0)).toThrow(LevelDataError);
});

test("pickWord: uzman tier tüm tier'ları kapsar (K15)", () => {
  // uzman + 3-8 → zor kelime de dönebilir; boş DEĞİL ve sözlükte geçerli
  const word = pickWord("uzman", 3, 8, () => 0.5);
  expect(WORD_LIST.some((w) => w.word === word)).toBe(true);
});

test("candidatesFor: kategori+uzunluk+tier filtresi (AK-3.2 girdisi)", () => {
  const list = candidatesFor("hayvan", 4, "kolay");
  expect(list).toContain("KEDİ");
  expect(list).toContain("İNEK");
  for (const w of list) {
    expect(w.length).toBe(4);
  }
});

test("candidatesFor: boş kombinasyon → LEVEL_DATA_EMPTY (AK-3.7)", () => {
  expect(() => candidatesFor("hayvan", 8, "kolay")).toThrow(LevelDataError);
  expect(() => candidatesFor("yokKategori", 4, "kolay")).toThrow(LevelDataError);
});

test("wordsMatching: desene uyan kelimeler (FR-3.3 girdisi)", () => {
  const list = wordsMatching(["K", null, null, "İ"], "kolay");
  expect(list).toContain("KEDİ");
  expect(list).toContain("KİVİ");
  for (const w of list) {
    expect(w[0]).toBe("K");
    expect(w[3]).toBe("İ");
  }
});

test("wordsMatching: eşleşme yoksa LEVEL_DATA_EMPTY", () => {
  expect(() => wordsMatching(["Z", "Z", "Z", "Z", "Z", "Z", "Z", "Z"], "kolay")).toThrow(
    LevelDataError,
  );
});

test("hasWord: tier sözlük geçerliliği (FR-3.3)", () => {
  expect(hasWord("KEDİ", "kolay")).toBe(true);
  expect(hasWord("KAZİ", "kolay")).toBe(false);
  expect(hasWord("KEDİ", "orta")).toBe(false);
  expect(hasWord("KARTAL", "uzman")).toBe(true); // uzman tüm tier'lar
});
