/**
 * word-check — üç modun kazanç kuralı + dedektif sinyali (UC-3, K12/K13/K14/K17). SAF.
 *
 * Sözleşme:
 * - Okuma boş slotları SIKIŞTIRIR (eski `main.js#checkWord` davranışı — FR-3.1).
 * - klasik: okuma == hedef kelime; dedektif: okuma ∈ aday seti (K13);
 *   sabit: desen eşleşmesi VE tier sözlüğünde geçerlilik (FR-3.3).
 * - Sinyal aday seti bazlı ve durumsuzdur (K17): YOK/VAR/YERİNDE;
 *   zor tier'da 2 durum (YERİNDE üretilmez). Sinyal kazanç kuralını DEĞİŞTİRMEZ.
 */
import { hasWord } from "./words";
import type { Game7Mode, Tier } from "./words";
import { patternMatch } from "./patterns";
import type { Pattern } from "./patterns";

export interface WordCheckContext {
  mode: Game7Mode;
  /** klasik: hedef kelime */
  targetWord?: string;
  /** dedektif: aday seti */
  candidates?: readonly string[];
  /** sabit: desen */
  pattern?: Pattern;
  /** sabit: sözlük geçerliliği tier'ı */
  tier?: Tier;
}

export interface WordCheckResult {
  matched: boolean;
  /** sıkıştırılmış okuma (boş slotlar atlanır) */
  word: string;
}

export function readSlotWord(slots: readonly (string | null)[]): string {
  return slots.filter((s): s is string => s !== null).join("");
}

export function checkSlotWord(
  slots: readonly (string | null)[],
  ctx: WordCheckContext,
): WordCheckResult {
  const word = readSlotWord(slots);
  let matched = false;
  switch (ctx.mode) {
    case "klasik":
      matched = ctx.targetWord !== undefined && word === ctx.targetWord;
      break;
    case "dedektif":
      matched = ctx.candidates !== undefined && ctx.candidates.includes(word);
      break;
    case "sabit":
      matched =
        ctx.pattern !== undefined &&
        ctx.tier !== undefined &&
        patternMatch(word, ctx.pattern) &&
        hasWord(word, ctx.tier);
      break;
  }
  return { matched, word };
}

export type Signal = "yok" | "var" | "yerinde";

/**
 * Dedektif sinyali (K17): her pozisyon için aday seti bazlı geri bildirim.
 * zor tier'da YERİNDE üretilmez (2 durum — K16).
 */
export function dedektifSinyal(
  letters: readonly (string | null)[],
  candidates: readonly string[],
  tier: Tier,
): (Signal | null)[] {
  const twoState = tier === "zor";
  return letters.map((letter, i) => {
    if (letter === null) return null;
    const all = candidates.every((c) => c[i] === letter);
    const any = candidates.some((c) => c[i] === letter);
    if (all) return twoState ? "var" : "yerinde";
    if (any) return "var";
    return "yok";
  });
}
