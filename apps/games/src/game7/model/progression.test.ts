/**
 * progression testleri — FAZ-GAME7 AK-4.7/4.8 (UC-4, K15/K16).
 */
import { describe, expect, test } from "bun:test";
import {
  TIER_LEVELS,
  TIER_PARAMS,
  isTierCompleted,
  isTierUnlocked,
  tierParams,
} from "./progression";

test("AK-4.8: tier parametreleri tek kaynak tablodan (K16 değerleri)", () => {
  const k = tierParams("klasik", "kolay");
  expect(k.sure).toBe(90);
  expect(k.uzunluk).toEqual([3, 4]);
  expect(k.kelimeSayisi).toBe(2);
  expect(k.hiz).toBe(1);
  expect(tierParams("dedektif", "zor").hak).toBe(2);
  expect(tierParams("sabit", "zor").can).toBe(2);
  expect(tierParams("sabit", "kolay").sabitOran).toEqual([0.5, 0.5]);
  expect(tierParams("dedektif", "zor").sinyalDurum).toBe(2);
});

test("uzman tier: zor değerlerini devralır + uzunluk 3-8 (K15 shortcut)", () => {
  const u = tierParams("klasik", "uzman");
  expect(u.sure).toBe(45);
  expect(u.uzunluk).toEqual([3, 8]);
  expect(tierParams("sabit", "uzman").can).toBe(2);
});

test("AK-4.7: kolay her zaman açık; orta/zor kademeli", () => {
  expect(isTierUnlocked("klasik", "kolay", [])).toBe(true);
  expect(isTierUnlocked("klasik", "orta", [])).toBe(false);
  const kolayDone = [{ mode: "klasik" as const, tier: "kolay" as const, levelsDone: TIER_LEVELS }];
  expect(isTierUnlocked("klasik", "orta", kolayDone)).toBe(true);
  expect(isTierUnlocked("klasik", "zor", kolayDone)).toBe(false);
  const ortaDone = [...kolayDone, { mode: "klasik" as const, tier: "orta" as const, levelsDone: TIER_LEVELS }];
  expect(isTierUnlocked("klasik", "zor", ortaDone)).toBe(true);
});

test("AK-4.7: uzman yalnız klasik+sabit zor bitince; dedektif'te YOK (K15)", () => {
  const done = (mode: "klasik" | "sabit") => [
    { mode, tier: "kolay" as const, levelsDone: TIER_LEVELS },
    { mode, tier: "orta" as const, levelsDone: TIER_LEVELS },
  ];
  // yalnız klasik zor bitmiş
  expect(
    isTierUnlocked("klasik", "uzman", [...done("klasik"), { mode: "klasik", tier: "zor", levelsDone: TIER_LEVELS }]),
  ).toBe(false);
  // ikisi de bitmiş
  expect(
    isTierUnlocked("klasik", "uzman", [
      ...done("klasik"),
      ...done("sabit"),
      { mode: "klasik", tier: "zor", levelsDone: TIER_LEVELS },
      { mode: "sabit", tier: "zor", levelsDone: TIER_LEVELS },
    ]),
  ).toBe(true);
  // dedektif uzman HİÇBİR ZAMAN açılmaz
  expect(
    isTierUnlocked("dedektif", "uzman", [
      ...done("klasik"),
      ...done("sabit"),
      { mode: "klasik", tier: "zor", levelsDone: TIER_LEVELS },
      { mode: "sabit", tier: "zor", levelsDone: TIER_LEVELS },
    ]),
  ).toBe(false);
});

test("isTierCompleted: TIER_LEVELS eşiği (başlangıç: 10)", () => {
  expect(isTierCompleted(9)).toBe(false);
  expect(isTierCompleted(10)).toBe(true);
});
