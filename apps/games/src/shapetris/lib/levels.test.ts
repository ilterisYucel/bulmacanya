import { describe, expect, test } from "bun:test";
import { CAMPAIGN_LEVEL_COUNT, loadCampaignLevel } from "../lib/levels";

describe("shapetris levels (UC-11)", () => {
  test("AK-11.1: kampanya bölümü yüklenir ve 8×8 boolean matris döner", async () => {
    const goal = await loadCampaignLevel("kolay", 0);
    expect(goal.length).toBe(8);
    expect(goal.every((row) => row.length === 8)).toBe(true);
  });

  test("her zorluk klasöründen bölüm yüklenebilir", async () => {
    for (const difficulty of ["kolay", "orta", "zor"] as const) {
      const goal = await loadCampaignLevel(difficulty, 12);
      expect(goal.length).toBe(8);
    }
  });

  test("olmayan bölüm → hata (sessiz DEĞİL)", async () => {
    try {
      await loadCampaignLevel("kolay", CAMPAIGN_LEVEL_COUNT + 5);
      expect.unreachable();
    } catch (error) {
      expect(String(error)).toContain("bölüm bulunamadı");
    }
  });
});
