/**
 * progression — tier parametreleri + kilitler + checkpoint şeması (UC-4, K15/K16/FR-4.x). SAF.
 *
 * Sözleşme:
 * - Tier parametreleri TEK kaynak `TIER_PARAMS` (FR-4.8 — kodda dağınık sabit YOK).
 * - Tier başına `TIER_LEVELS` bölüm (başlangıç: 10); tamamlanınca sonraki tier açılır.
 * - Kilitler: kolay açık; orta/zor kademeli (FR-4.7). UZMAN: yalnız klasik+sabit,
 *   HER İKİSİNİN zor'u bitince (K15); dedektif'te uzman YOK.
 * - Checkpoint payload şeması saveRequested için (FR-4.6).
 *
 * shortcut: uzman tier zor değerlerini devralır (uzunluk 3-8 hariç) — tam liste
 * içerik göreviyle (K15) ayrı denge gerekebilir; başlangıç değerleri tune edilir.
 */
import type { Game7Mode, Tier } from "./words";

export interface TierParams {
  /** s — Klasik bölüm süresi */
  sure?: number;
  /** Dedektif yanlış kelime hakkı */
  hak?: number;
  /** Sabit can */
  can?: number;
  uzunluk: readonly [number, number];
  /** balon hızı çarpanı (Klasik — K16/K18) */
  hiz?: number;
  /** çeldirici oranı 0..1 */
  celdirici: number;
  /** Klasik: seviye başına kelime sayısı */
  kelimeSayisi?: number;
  kategoriGenislik?: "dar" | "orta" | "genis";
  /** Dedektif sinyal durum sayısı (2|3) */
  sinyalDurum?: 2 | 3;
  /** Sabit harf oranı aralığı (buildPattern'e gider) */
  sabitOran?: readonly [number, number];
}

type ProgressTier = "kolay" | "orta" | "zor";

export const TIER_PARAMS: Record<Game7Mode, Record<ProgressTier, TierParams>> = {
  klasik: {
    kolay: { sure: 90, uzunluk: [3, 4], hiz: 1, celdirici: 0.2, kelimeSayisi: 2 },
    orta: { sure: 60, uzunluk: [4, 5], hiz: 1.25, celdirici: 0.3, kelimeSayisi: 3 },
    zor: { sure: 45, uzunluk: [5, 6], hiz: 1.5, celdirici: 0.4, kelimeSayisi: 4 },
  },
  dedektif: {
    kolay: { hak: 3, uzunluk: [3, 4], celdirici: 0.2, kategoriGenislik: "dar", sinyalDurum: 3 },
    orta: { hak: 3, uzunluk: [4, 5], celdirici: 0.3, kategoriGenislik: "orta", sinyalDurum: 3 },
    zor: { hak: 2, uzunluk: [5, 7], celdirici: 0.4, kategoriGenislik: "genis", sinyalDurum: 2 },
  },
  sabit: {
    kolay: { can: 3, uzunluk: [3, 4], celdirici: 0.2, sabitOran: [0.5, 0.5] },
    orta: { can: 2, uzunluk: [4, 6], celdirici: 0.3, sabitOran: [0.4, 0.4] },
    zor: { can: 2, uzunluk: [5, 8], celdirici: 0.4, sabitOran: [0.3, 0.3] },
  },
};

/** Tier başına bölüm sayısı — başlangıç değeri (FR-4.7, tune edilir). */
export const TIER_LEVELS = 10;

export function tierParams(mode: Game7Mode, tier: Tier): TierParams {
  if (tier === "uzman") {
    const zor = TIER_PARAMS[mode].zor;
    return { ...zor, uzunluk: [3, 8] };
  }
  return TIER_PARAMS[mode][tier];
}

export interface TierProgressEntry {
  mode: Game7Mode;
  tier: Tier;
  levelsDone: number;
}

export function isTierCompleted(levelsDone: number): boolean {
  return levelsDone >= TIER_LEVELS;
}

export function isTierUnlocked(
  mode: Game7Mode,
  tier: Tier,
  progress: readonly TierProgressEntry[],
): boolean {
  if (tier === "kolay") return true;
  const done = (m: Game7Mode, t: Tier): boolean =>
    isTierCompleted(progress.find((p) => p.mode === m && p.tier === t)?.levelsDone ?? 0);
  if (tier === "orta") return done(mode, "kolay");
  if (tier === "zor") return done(mode, "orta");
  // uzman (K15): dedektif YOK; klasik VE sabit zor'u bitmeli
  if (mode === "dedektif") return false;
  return done("klasik", "zor") && done("sabit", "zor");
}

/** saveRequested payload şeması (FR-4.6). */
export interface CheckpointPayload {
  mode: Game7Mode;
  tier: Tier;
  levelNo: number;
  totalScore: number;
  completed: boolean;
}
