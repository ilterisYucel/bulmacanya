/**
 * scoring — Shapetris skor formülü (UC-5, K15). SAF.
 *
 * Eski challange.js ile birebir: bölüm skoru = 10 − ipucu kullanım sayısı;
 * her ipucu uygulaması bölüm skorundan 1 düşer. Alt sınır 1.
 */

/** Bölüm skoru: max(1, 10 − ipucu kullanımı). */
export function levelScore(hintsUsed: number): number {
  return Math.max(1, 10 - hintsUsed);
}

/** Toplam skor birikimi. */
export function addScore(total: number, gained: number): number {
  return total + gained;
}
