/**
 * letter-pool — harf havuzu üretimi + ağırlıklı çekim (UC-1, K3/K20/FR-1.x). SAF.
 *
 * Sözleşme:
 * - Çoğullama: harf sayısı = hedef-set'teki max tekrar — HİÇBİR aday imkânsız
 *   kalmaz (FR-1.1); sabit modda yalnız SERBEST pozisyonlar sayılır (FR-1.6).
 * - Çeldiriciler yalnız hedefte OLMAYAN harflerden; oran parametriktir (FR-1.2);
 *   oran ≥ 1 ise 0.99'a kırpılır (bölme koruması).
 * - Üretim ve çekim deterministiktir (rng enjeksiyonlu — FR-1.4).
 */
import { TR_ALPHABET } from "./words";
import type { Game7Mode } from "./words";

export interface PoolInput {
  mode: Game7Mode;
  /** klasik: [hedef]; dedektif: aday seti; sabit: desene uyan adaylar */
  targetWords: readonly string[];
  /** sabit modda zorunlu: kilitli pozisyonlar (harfleri havuzda ÜRETİLMEZ) */
  pattern?: readonly (string | null)[];
  /** 0..1 — çeldiricinin toplam havuzdaki hedef oranı */
  distractorRatio: number;
}

export interface LetterPool {
  /** multiset: aynı harf birden çok kez bulunabilir (SEVEN → E×2) */
  letters: string[];
  distractorCount: number;
}

export function buildLetterPool(input: PoolInput, rng: () => number): LetterPool {
  if (input.mode === "sabit" && input.pattern === undefined) {
    throw new Error("letter-pool: sabit mod pattern gerektirir");
  }
  const counts = new Map<string, number>();
  for (const word of input.targetWords) {
    const wordCounts = new Map<string, number>();
    for (let i = 0; i < word.length; i++) {
      const ch = word[i]!;
      // sabit modda kilitli pozisyonlar havuz hesabına GİRMEZ (FR-1.6)
      if (input.mode === "sabit" && input.pattern![i] !== null) continue;
      wordCounts.set(ch, (wordCounts.get(ch) ?? 0) + 1);
    }
    for (const [ch, n] of wordCounts) {
      counts.set(ch, Math.max(counts.get(ch) ?? 0, n));
    }
  }

  const targetLetters: string[] = [];
  for (const [ch, n] of counts) {
    for (let i = 0; i < n; i++) targetLetters.push(ch);
  }

  // çeldirici sayısı ≈ toplamın ratio kadarı: D = T·ratio/(1−ratio)
  const ratio = Math.min(0.99, Math.max(0, input.distractorRatio));
  const distractorTarget = Math.round((targetLetters.length * ratio) / (1 - ratio));
  const targetSet = new Set(counts.keys());
  const candidateChars = [...TR_ALPHABET].filter((c) => !targetSet.has(c));
  for (let i = candidateChars.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidateChars[i], candidateChars[j]] = [candidateChars[j]!, candidateChars[i]!];
  }
  const distractors = candidateChars.slice(0, distractorTarget);

  return {
    letters: [...targetLetters, ...distractors],
    distractorCount: distractors.length,
  };
}

/** Havuz multiset'inden ağırlıklı çekim (çoğul harf daha sık gelir — FR-1.3). */
export function pickLetter(pool: LetterPool, rng: () => number): string {
  if (pool.letters.length === 0) {
    throw new Error("letter-pool: boş havuzdan harf çekilemez");
  }
  return pool.letters[Math.floor(rng() * pool.letters.length)]!;
}
