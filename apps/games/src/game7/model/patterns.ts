/**
 * patterns — sabit harf desen üreteci (UC-3, K14/K16/FR-3.6/FR-3.7). SAF.
 *
 * Sözleşme:
 * - `buildPattern` kelime harflerinin `ratioRange` aralığındaki bir oranını sabitler
 *   (varsayılan %30-50; tier sabit oranı progression#TIER_PARAMS'tan gelir);
 *   seed'li rng ile deterministik; EN AZ 1 serbest pozisyon bırakır (FR-3.6).
 * - `patternMatch`: uzunluk eşit VE sabit pozisyonlar birebir (AK-3.3).
 */
export type Pattern = (string | null)[];

/** Kelime harflerinin ratioRange aralığındaki bir oranını sabitleyen desen üretir. */
export function buildPattern(
  word: string,
  rng: () => number,
  ratioRange: readonly [number, number] = [0.3, 0.5],
): Pattern {
  const len = word.length;
  const ratio = ratioRange[0] + (ratioRange[1] - ratioRange[0]) * rng();
  let fixedCount = Math.round(len * ratio);
  fixedCount = Math.max(1, Math.min(len - 1, fixedCount)); // en az 1 serbest

  const indices = Array.from({ length: len }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  const fixedSet = new Set(indices.slice(0, fixedCount));
  return [...word].map((ch, i) => (fixedSet.has(i) ? ch : null));
}

export function patternMatch(word: string, pattern: readonly (string | null)[]): boolean {
  if (word.length !== pattern.length) return false;
  for (let i = 0; i < word.length; i++) {
    const p = pattern[i];
    if (p !== null && word[i] !== p) return false;
  }
  return true;
}
