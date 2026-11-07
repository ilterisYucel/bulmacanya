/**
 * words — game7 TR kelime verisi ve sözlük sorguları (UC-1, K15/K16). SAF.
 *
 * Sözleşme:
 * - `TR_ALPHABET` 29 harf (A-Z + Ç,Ğ,İ,Ö,Ş,Ü) — oyunun tek karakter seti (AK-1.5).
 * - `pickWord`/`candidatesFor`/`wordsMatching`/`hasWord` hepsi deterministiktir
 *   (rng enjeksiyonlu) ve aday seti boşsa `LevelDataError` (LEVEL_DATA_EMPTY) fırlatır (FR-3.7).
 * - `tier: "uzman"` TÜM tier'ları kapsar (K15: filtreli tam liste).
 *
 * shortcut: başlangıç kürasyon seti (~50 kelime) — LibreOffice TR çekimi + filtre +
 * geniş kürasyon AYRICA içerik görevi (K15); veri ŞEKLİ değişmez, yalnız liste büyür.
 */
import { patternMatch } from "./patterns";

export type Game7Mode = "klasik" | "dedektif" | "sabit";

export type Tier = "kolay" | "orta" | "zor" | "uzman";

export const TR_ALPHABET = [
  "A", "B", "C", "Ç", "D", "E", "F", "G", "Ğ", "H",
  "I", "İ", "J", "K", "L", "M", "N", "O", "Ö", "P",
  "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z",
] as const;

export interface WordEntry {
  word: string;
  tier: Tier;
  category?: string;
}

/** LEVEL_DATA_EMPTY hata kategorisi (§7) — boş aday seti/desen eşleşmesi. */
export class LevelDataError extends Error {
  readonly category = "LEVEL_DATA_EMPTY";

  constructor(message: string) {
    super(message);
    this.name = "LevelDataError";
  }
}

/** Başlangıç kürasyon seti (shortcut — K15 içerik görevi büyütür). */
export const WORD_LIST: readonly WordEntry[] = [
  // kolay (3-4 harf)
  { word: "KEDİ", tier: "kolay", category: "hayvan" },
  { word: "KUŞ", tier: "kolay", category: "hayvan" },
  { word: "ARI", tier: "kolay", category: "hayvan" },
  { word: "İNEK", tier: "kolay", category: "hayvan" },
  { word: "FOK", tier: "kolay", category: "hayvan" },
  { word: "ELMA", tier: "kolay", category: "meyve" },
  { word: "ÜZÜM", tier: "kolay", category: "meyve" },
  { word: "NAR", tier: "kolay", category: "meyve" },
  { word: "MUZ", tier: "kolay", category: "meyve" },
  { word: "KİVİ", tier: "kolay", category: "meyve" },
  { word: "KAPI", tier: "kolay", category: "eşya" },
  { word: "MASA", tier: "kolay", category: "eşya" },
  { word: "SAAT", tier: "kolay", category: "eşya" },
  { word: "ÇATI", tier: "kolay", category: "eşya" },
  { word: "AYNA", tier: "kolay", category: "eşya" },
  { word: "DAĞ", tier: "kolay", category: "doğa" },
  { word: "GÖL", tier: "kolay", category: "doğa" },
  { word: "KUM", tier: "kolay", category: "doğa" },
  { word: "BUZ", tier: "kolay", category: "doğa" },
  { word: "MOR", tier: "kolay", category: "renk" },
  { word: "SARI", tier: "kolay", category: "renk" },
  // orta (4-5 harf)
  { word: "KÖPEK", tier: "orta", category: "hayvan" },
  { word: "ASLAN", tier: "orta", category: "hayvan" },
  { word: "BALIK", tier: "orta", category: "hayvan" },
  { word: "ÖRDEK", tier: "orta", category: "hayvan" },
  { word: "MARTI", tier: "orta", category: "hayvan" },
  { word: "GEYİK", tier: "orta", category: "hayvan" },
  { word: "ARMUT", tier: "orta", category: "meyve" },
  { word: "İNCİR", tier: "orta", category: "meyve" },
  { word: "HURMA", tier: "orta", category: "meyve" },
  { word: "KALEM", tier: "orta", category: "eşya" },
  { word: "FIRIN", tier: "orta", category: "eşya" },
  { word: "KİTAP", tier: "orta", category: "eşya" },
  { word: "DENİZ", tier: "orta", category: "doğa" },
  { word: "ÇİÇEK", tier: "orta", category: "doğa" },
  { word: "BEYAZ", tier: "orta", category: "renk" },
  { word: "SİYAH", tier: "orta", category: "renk" },
  { word: "YEŞİL", tier: "orta", category: "renk" },
  // zor (5-8 harf)
  { word: "ŞAHİN", tier: "zor", category: "hayvan" },
  { word: "KARTAL", tier: "zor", category: "hayvan" },
  { word: "LEYLEK", tier: "zor", category: "hayvan" },
  { word: "KAPLAN", tier: "zor", category: "hayvan" },
  { word: "ZÜRAFA", tier: "zor", category: "hayvan" },
  { word: "ŞEFTALİ", tier: "zor", category: "meyve" },
  { word: "KİRAZ", tier: "zor", category: "meyve" },
  { word: "PORTAKAL", tier: "zor", category: "meyve" },
  { word: "KARPUZ", tier: "zor", category: "meyve" },
  { word: "UÇURTMA", tier: "zor", category: "eşya" },
  { word: "ANAHTAR", tier: "zor", category: "eşya" },
  { word: "BİSİKLET", tier: "zor", category: "eşya" },
  { word: "ŞİMŞEK", tier: "zor", category: "doğa" },
  { word: "YILDIRIM", tier: "zor", category: "doğa" },
  { word: "MÜREKKEP", tier: "zor", category: "eşya" },
];

function tierMatches(entry: WordEntry, tier: Tier): boolean {
  // shortcut: uzman tier = filtreli tam liste; v1'de tüm kürasyon seti geçerli (K15)
  return tier === "uzman" || entry.tier === tier;
}

/** Klasik: tier + uzunluk aralığında rastgele hedef kelime (rng deterministik). */
export function pickWord(
  tier: Tier,
  minLen: number,
  maxLen: number,
  rng: () => number,
): string {
  const pool = WORD_LIST.filter(
    (w) => tierMatches(w, tier) && w.word.length >= minLen && w.word.length <= maxLen,
  );
  if (pool.length === 0) {
    throw new LevelDataError(`tier=${tier} uzunluk=${minLen}-${maxLen} için kelime yok`);
  }
  return pool[Math.floor(rng() * pool.length)]!.word;
}

/** Dedektif: kategori + uzunluk + tier filtreli aday seti (FR-3.7 boşsa fırlar). */
export function candidatesFor(category: string, length: number, tier: Tier): string[] {
  const list = WORD_LIST.filter(
    (w) => tierMatches(w, tier) && w.category === category && w.word.length === length,
  ).map((w) => w.word);
  if (list.length === 0) {
    throw new LevelDataError(`kategori=${category} uzunluk=${length} tier=${tier} için aday yok`);
  }
  return list;
}

/** Sabit: desene uyan kelimeler (FR-3.7 boşsa fırlar). */
export function wordsMatching(
  pattern: readonly (string | null)[],
  tier: Tier,
): string[] {
  const list = WORD_LIST.filter(
    (w) => tierMatches(w, tier) && patternMatch(w.word, pattern),
  ).map((w) => w.word);
  if (list.length === 0) {
    throw new LevelDataError(`desene uyan kelime yok (tier=${tier})`);
  }
  return list;
}

/** Sabit kazanç: tam kelime tier sözlüğünde geçerli mi (FR-3.3). */
export function hasWord(word: string, tier: Tier): boolean {
  return WORD_LIST.some((w) => tierMatches(w, tier) && w.word === word);
}
