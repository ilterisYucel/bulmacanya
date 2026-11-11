/**
 * scoring — skor + yıldız kuralları (UC-5/UC-6, K9).
 *
 * Skor: ilk kez girilen kat +100, coin +25, zincir halkası +25×halka.
 * Saniye cezası YALNIZ zamana karşı modunda (modelde timeLeft).
 * Yıldız (kampanya): ip ≤ par → 3, ≤ 1.5×par → 2, aksi 1.
 *
 * Yan etkiler: YOK.
 */
export const FLOOR_SCORE = 100;
export const COIN_SCORE = 25;
export const CHAIN_SCORE = 25;

/** Zincir halkası bonusu — halka sayısı kadar 25. */
export function chainBonus(chain: number): number {
  return CHAIN_SCORE * Math.max(0, chain);
}

/** Kampanya yıldızı (1-3). */
export function starsFor(ropesUsed: number, par: number): 1 | 2 | 3 {
  if (ropesUsed <= par) return 3;
  if (ropesUsed <= Math.ceil(par * 1.5)) return 2;
  return 1;
}
