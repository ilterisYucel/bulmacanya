/**
 * campaign — mod sabitleri + seed türetimi (UC-6, K14/K20). SAF; DOM/Pixi YOK.
 *
 * - Kampanya: rol seed = `campaignSeed(difficulty, levelNo)` — deterministik,
 *   paylaşılabilir (FR-6.3).
 * - Günlük: yerel gün anahtarı `dateKey` → `dailySeed` (FR-6.5).
 * Bu modül index.ts tarafından re-export edilir; hub da buradan okur (subpath).
 */
import type { Difficulty } from "./types";

export const CAMPAIGN_LEVELS = 30;
export const CAMPAIGN_FLOORS = 6;
export const CAMPAIGN_PAR = 10;
export const TIME_MODE_SECONDS = 60;

const TIER_INDEX: Record<Difficulty, number> = { kolay: 0, orta: 1, zor: 2 };

/** Kampanya rolünün deterministik seed'i. */
export function campaignSeed(difficulty: Difficulty, levelNo: number): number {
  return 1000 + TIER_INDEX[difficulty] * 1000 + levelNo;
}

/** Yerel gün anahtarı: YYYY-MM-DD. */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** FNV-1a — string → 32-bit seed. */
export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Günlük kule seed'i — aynı gün herkes için aynı (FR-6.5). */
export function dailySeed(date: Date): number {
  return hashString(dateKey(date));
}
