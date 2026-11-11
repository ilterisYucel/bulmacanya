/**
 * campaign testleri — UC-6/FR-6.3/FR-6.5: kademe seed türetimi, günlük seed.
 */
import { describe, expect, test } from "bun:test";
import {
  CAMPAIGN_FLOORS,
  CAMPAIGN_LEVELS,
  CAMPAIGN_PAR,
  TIME_MODE_SECONDS,
  campaignSeed,
  dailySeed,
  dateKey,
  hashString,
} from "./campaign";

describe("sabitler", () => {
  test("K14 değerleri", () => {
    expect(CAMPAIGN_LEVELS).toBe(30);
    expect(CAMPAIGN_FLOORS).toBe(6);
    expect(CAMPAIGN_PAR).toBe(10);
    expect(TIME_MODE_SECONDS).toBe(60);
  });
});

describe("campaignSeed", () => {
  test("deterministik + kademe/kat bazında benzersiz", () => {
    expect(campaignSeed("kolay", 0)).toBe(campaignSeed("kolay", 0));
    expect(campaignSeed("kolay", 0)).not.toBe(campaignSeed("orta", 0));
    expect(campaignSeed("orta", 0)).not.toBe(campaignSeed("zor", 0));
    expect(campaignSeed("orta", 5)).toBe(campaignSeed("orta", 5));
    expect(campaignSeed("orta", 5)).not.toBe(campaignSeed("orta", 6));
  });
});

describe("dateKey / dailySeed", () => {
  test("YYYY-MM-DD ve sıfır dolgusu", () => {
    expect(dateKey(new Date(2026, 10, 10))).toBe("2026-11-10");
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("aynı gün aynı seed, ertesi gün farklı", () => {
    const a = dailySeed(new Date(2026, 10, 10, 9, 0));
    const b = dailySeed(new Date(2026, 10, 10, 23, 59));
    const c = dailySeed(new Date(2026, 10, 11));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  test("hashString deterministik", () => {
    expect(hashString("2026-11-10")).toBe(hashString("2026-11-10"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });
});
