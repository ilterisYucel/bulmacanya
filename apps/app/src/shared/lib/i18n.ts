/**
 * i18n baseline — UI metinleri TÜRKÇEDİR (FR-3.4).
 * Faz 1'de gerçek i18n kütüphanesine geçilebilir; kontrat `t(key)` kalır.
 */
const TR = {
  "home.title": "Bulmacanya",
  "home.start": "Başla",
  "home.playShapetris": "TetroVizyon Oyna",
  "home.playGame7": "HarfGüder Oyna",
} as const;

export type TrKey = keyof typeof TR;

export function t(key: TrKey): string {
  return TR[key] ?? key;
}
