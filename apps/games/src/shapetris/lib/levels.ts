/**
 * levels — kampanya bölüm yükleyici (UC-11, K16). UI/asset katmanı (model DEĞİL).
 *
 * `assets/levels/{kolay,orta,zor}/level0..99.json` — eski oyunun elde hazırlanmış
 * 8×8 hedef matrisleri (300 bölüm). Statik import haritası ÜRETİLMİŞ dosyada:
 * `bun run scripts/gen-levels.mjs` (bun test + Vite ikisinde de çalışır).
 */

import { parseLevel } from "../model/level";
import { LEVEL_FILES } from "./levels-index.gen";

export type CampaignDifficulty = "kolay" | "orta" | "zor";

export const CAMPAIGN_LEVEL_COUNT = 100;

export async function loadCampaignLevel(
  difficulty: CampaignDifficulty,
  levelNo: number,
): Promise<boolean[][]> {
  const matrix = LEVEL_FILES[`${difficulty}/${levelNo}`];
  if (!matrix) {
    throw new Error(
      `ASSET_LOAD_FAILED: bölüm bulunamadı ${difficulty}/${levelNo}`,
    );
  }
  return parseLevel(matrix);
}
