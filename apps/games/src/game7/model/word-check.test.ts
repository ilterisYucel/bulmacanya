/**
 * word-check testleri — FAZ-GAME7 AK-3.1/3.2/3.3/3.8 (UC-3).
 */
import { describe, expect, test } from "bun:test";
import { checkSlotWord, dedektifSinyal, readSlotWord } from "./word-check";

test("AK-3.1: klasik kazanç birebir; sıkıştırmalı okuma boş slotu atlar", () => {
  expect(checkSlotWord(["K", "E", "D", "İ"], { mode: "klasik", targetWord: "KEDİ" }).matched).toBe(true);
  expect(checkSlotWord(["E", "K", "D", "İ"], { mode: "klasik", targetWord: "KEDİ" }).matched).toBe(false);
  // boş slot okumayı bölmez (eski checkWord davranışı — FR-3.1)
  const result = checkSlotWord([null, "K", "E", "D", "İ"], { mode: "klasik", targetWord: "KEDİ" });
  expect(result.word).toBe("KEDİ");
  expect(result.matched).toBe(true);
});

test("AK-3.2: dedektif çoklu aday — herhangi geçerli kelime kazanır (K13)", () => {
  const candidates = ["KEDİ", "KUZU", "EŞEK"];
  expect(checkSlotWord(["K", "U", "Z", "U"], { mode: "dedektif", candidates }).matched).toBe(true);
  expect(checkSlotWord(["K", "A", "Z", "İ"], { mode: "dedektif", candidates }).matched).toBe(false);
});

test("AK-3.3: sabit kazanç = desen + sözlük geçerliliği", () => {
  const ctx = { mode: "sabit" as const, pattern: ["K", null, null, "İ"], tier: "kolay" as const };
  expect(checkSlotWord(["K", "E", "D", "İ"], ctx).matched).toBe(true); // KEDİ sözlükte
  expect(checkSlotWord(["K", "A", "Z", "İ"], ctx).matched).toBe(false); // desen tutar, sözlükte YOK
  expect(checkSlotWord(["E", "L", "M", "A"], ctx).matched).toBe(false); // desen tutmaz
});

test("AK-3.8: dedektif sinyali YOK/VAR/YERİNDE (kolay — 3 durum)", () => {
  const candidates = ["KEDİ", "KADİ", "KODU"];
  const signal = dedektifSinyal(["K", "A", "Z", "İ"], candidates, "kolay");
  expect(signal).toEqual(["yerinde", "var", "yok", "var"]);
});

test("AK-3.8: zor tier'da sinyal 2 duruma düşer (YERİNDE yok)", () => {
  const candidates = ["KEDİ", "KADİ", "KODU"];
  const signal = dedektifSinyal(["K", "A", "Z", "İ"], candidates, "zor");
  expect(signal).toEqual(["var", "var", "yok", "var"]);
});

test("sinyal: boş pozisyon null döner", () => {
  const signal = dedektifSinyal(["K", null, "D"], ["KEDİ"], "kolay");
  expect(signal).toEqual(["yerinde", null, "yerinde"]);
});

test("readSlotWord: sıkıştırma", () => {
  expect(readSlotWord([null, "A", null, "B"])).toBe("AB");
  expect(readSlotWord([null, null])).toBe("");
});
