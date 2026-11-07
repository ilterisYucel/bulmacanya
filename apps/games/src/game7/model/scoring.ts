/**
 * scoring — mod bazlı skor (UC-4, FR-4.5). SAF.
 *
 * Sözleşme:
 * - Kelime puanı: klasik uzunluk×10; dedektif/sabit uzunluk×20.
 * - Tamamlama bonusu: klasik kalan saniye×5; diğerleri kalan hak/can×15.
 * - Her ipucu kullanımı bölüm skorundan 10 düşer; alt sınır 1 (shapetris emsali).
 * - Tüm değerler başlangıçtır — tune edilir (FR-4.5).
 */
import type { Game7Mode } from "./words";

export function wordScore(mode: Game7Mode, length: number): number {
  return mode === "klasik" ? length * 10 : length * 20;
}

/** `remaining`: klasik = kalan saniye; dedektif/sabit = kalan hak/can. */
export function completionBonus(mode: Game7Mode, remaining: number): number {
  const rem = Math.max(0, Math.floor(remaining));
  return mode === "klasik" ? rem * 5 : rem * 15;
}

export function applyHintPenalty(score: number, hintsUsed: number): number {
  return Math.max(1, score - hintsUsed * 10);
}

/** Bölüm skoru: kelime puanı + bonus − ipucu kesintisi (alt sınır 1). */
export function levelScore(
  mode: Game7Mode,
  length: number,
  remaining: number,
  hintsUsed: number,
): number {
  return applyHintPenalty(wordScore(mode, length) + completionBonus(mode, remaining), hintsUsed);
}

/** Toplam skor birikimi. */
export function addScore(total: number, gained: number): number {
  return total + gained;
}
