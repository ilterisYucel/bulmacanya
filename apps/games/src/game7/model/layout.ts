/**
 * layout — responsive yerleşim hesabı (UC-2, K27). SAF.
 *
 * Sözleşme:
 * - phoneArea ≤480px, yatay ortalanmış; TEK dikey oryantasyon (shapetris S14 deseni).
 * - Slot KUTUSU sabit boyuttadır — pencere yüksekliğinden türetilen `unit` ile;
 *   kelime uzunluğundan BAĞIMSIZDIR (2026-11-07 düzeltme: harf sayısı kutuyu
 *   büyütmez/küçültmez). Ray kompakt, oyun alanında dikey ortalanmış.
 * - Çok küçük ekranda ray taşarsa gap minimuma çekilir, kutu yüksekliği sığacak
 *   kadar küçülür (shortcut: yalnız ekstrem viewport'lar için).
 * - Tüm bölgeler canvas içinde — taşma/negatif YOK (AK-2.9).
 */
export interface Viewport {
  width: number;
  height: number;
}

export interface LayoutMetrics {
  /** oyun alanı genişliği (≤480) */
  areaWidth: number;
  /** geniş ekranda yatay ortalama ofseti */
  offsetX: number;
  hudReserve: number;
  slotCount: number;
  slotX: number;
  /** slot merkezleri arası dikey adım (kutu + boşluk) */
  slotStep: number;
  /** ilk slot kutusunun MERKEZ y'si (alan içi koordinat) */
  slotTop: number;
  /** slot kutusu genişliği (= kolon genişliği) */
  slotWidth: number;
  /** slot kutusu boyutu — kelime uzunluğundan bağımsız sabit */
  slotBox: { width: number; height: number };
  balloonArea: { x: number; y: number; width: number; height: number };
  stepMin: number;
}

const STEP_MIN = 8;
const HUD_RESERVE = 56; // başlangıç değeri — tune edilir
const MAX_AREA = 480; // phoneArea (shapetris S14)

export function calculateLayout(viewport: Viewport, slotCount: number): LayoutMetrics {
  const areaWidth = Math.min(viewport.width, MAX_AREA);
  const offsetX = (viewport.width - areaWidth) / 2;
  const playHeight = viewport.height - HUD_RESERVE;

  // Sabit kutu birimi — pencere yüksekliğine bağlı (kelime uzunluğundan bağımsız).
  // 2026-11-07: slot göstergesi soru işareti balonu oldu — kutu balon boyutuna daraldı.
  const unit = Math.max(44, Math.min(80, Math.round(viewport.height * 0.085)));
  let slotBox = {
    width: Math.round(unit * 0.9),
    height: Math.round(unit * 1.05),
  };
  let gap = Math.max(6, Math.round(unit * 0.25));
  let slotStep = slotBox.height + gap;
  let railH = slotStep * slotCount - gap;
  if (railH > playHeight) {
    // ekstrem küçük ekran: gap minimuma, kutu yüksekliği kalan alana (shortcut)
    gap = 4;
    const boxH = Math.max(STEP_MIN, Math.floor((playHeight - gap * (slotCount - 1)) / slotCount));
    slotBox = { width: Math.max(40, Math.round(boxH * 1.13)), height: boxH };
    slotStep = boxH + gap;
    railH = slotStep * slotCount - gap;
  }
  const slotTop = HUD_RESERVE + (playHeight - railH) / 2 + slotBox.height / 2;
  const slotWidth = slotBox.width;
  const balloonWidth = areaWidth - slotWidth;

  return {
    areaWidth,
    offsetX,
    hudReserve: HUD_RESERVE,
    slotCount,
    slotX: balloonWidth + slotWidth / 2,
    slotStep,
    slotTop,
    slotWidth,
    slotBox,
    balloonArea: { x: 0, y: HUD_RESERVE, width: balloonWidth, height: playHeight },
    stepMin: STEP_MIN,
  };
}

/** y koordinatından en yakın slot indeksi (0..slotCount-1, kenetlenmiş). */
export function nearestSlot(layout: LayoutMetrics, y: number): number {
  const idx = Math.round((y - layout.slotTop) / layout.slotStep);
  return Math.max(0, Math.min(layout.slotCount - 1, idx));
}

/** Balon görsel boyutu — slot kutusuna sığar (eski oran ~4:5 — K33). */
export function balloonSize(layout: LayoutMetrics): { width: number; height: number } {
  const height = layout.slotBox.height;
  return { width: Math.round(height * 0.8), height };
}
