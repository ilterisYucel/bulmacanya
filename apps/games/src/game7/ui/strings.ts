/**
 * strings — game7 UI metinleri, TÜRKÇE (UC-6, AK-6.5).
 * Oyun paketi app'in i18n'ine bağımlı OLAMAZ (purity — ters yön yasak; shapetris emsali).
 */
export const STR = {
  score: "Skor",
  level: "Bölüm",
  time: "Süre",
  hak: "Hak",
  can: "Can",
  submit: "Kontrol Et",
  hintGlow: "İpucu: Harfi Parlat",
  hintReveal: "İpucu: Harf Aç",
  mute: "Ses",
  restart: "Tekrar Dene",
  next: "Sonraki Bölüm",
  back: "Geri",
  skip: "Geç",
  victory: "Kelime Tamamlandı!",
  levelDone: "Bölüm Tamamlandı!",
  gameOver: "Bölüm Bitti!",
  rescueTime: "+15 saniye (İpucu)",
  rescueRight: "+1 Hak (İpucu)",
  rescueLife: "+1 Can (İpucu)",
  wordsProgress: "Kelimeler",
  category: "Kategori",
  tutorial1: "Balonu tut, sürükle",
  tutorial2: "Sağdaki yuvaya bırak",
  tutorial3: "Kontrol et — sinyallere bak",
} as const;

export type StrKey = keyof typeof STR;
