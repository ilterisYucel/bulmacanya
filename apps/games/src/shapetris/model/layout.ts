/**
 * layout — Shapetris responsive yerleşim hesabı (UC-7, K12, S14). SAF.
 *
 * S14 (2026-11-05): Oyun her zaman "telefon alanı"nda dikey (p) yerleşimle çizilir.
 * `phoneArea` geniş ekranları en fazla 480px'lik bir kolona sıkıştırır (yatayda
 * ortalanır — UI işi); `calculateLayout` eski p matematiğini korur (B8):
 * - step = min(kısaKenar / 12, 0.85 · uzunKenar / coef); coef = oran ≤ 3/2 ? 18 : 12
 * - tahta kısa eksene ortalanır (indent); banner (tepsi bandı) üstte.
 *
 * Edge cases:
 * - `valid = false` — sıfır/negatif boyut veya step < 8px (oynanamaz — SC-3).
 * - `snapPiece`/`ghostAnchorPos` eski onDragEnd matematiğidir (kare token + çapa,
 *   round-trip test pimli).
 */

import { PIECE_ORIGINS } from "./pieces";

export interface Viewport {
  width: number;
  height: number;
}

/** Geniş ekranlarda oyun alanının azami genişliği (telefon kolonu). */
export const PHONE_AREA_MAX_WIDTH = 480;

/** Oyun alanını telefon benzeri bir kolona sıkıştırır (genişlik tavanı, tam yükseklik). */
export function phoneArea(v: Viewport): Viewport {
  return { width: Math.min(v.width, PHONE_AREA_MAX_WIDTH), height: v.height };
}

export interface LayoutMetrics {
  /** Hücre kenarı (px). */
  step: number;
  /** Kısa eksende tahta merkezleme payı. */
  indent: number;
  /** Banner (tepsi bandı) kalınlığı. */
  bannerSize: number;
  /** Tahta sol-üst köşesi (px). */
  xStart: number;
  /** Tahta sol-üst köşesi (px). */
  yStart: number;
  /** Başlık (buton) alanı başlangıcı. */
  headerStartX: number;
  headerStartY: number;
  /** Oynanabilir boyut mu (step ≥ 8px). */
  valid: boolean;
}

export function calculateLayout(v: Viewport): LayoutMetrics {
  const { width, height } = v;
  const ratio = width / height;
  const coef = ratio <= 3 / 2 ? 18 : 12;
  const ref = 0.85 * height;
  const ref1 = width / 12;
  const step = Math.min(ref1, ref / coef);
  const indent = (width - 12 * step) / 2;
  const bannerSize = width * 0.15;
  const xStart = indent;
  const yStart = bannerSize + 2.5 * step;
  const headerStartX = indent;
  const headerStartY = bannerSize + step;
  return {
    step,
    indent,
    bannerSize,
    xStart,
    yStart,
    headerStartX,
    headerStartY,
    valid: width > 0 && height > 0 && step >= 8,
  };
}

/**
 * Sürükleme bırakma noktasından tahta hücresine snap (S10: eski onDragEnd).
 * Kare token (2×2 hücre) PIECE_ORIGINS çapasıyla render edilir; bu fonksiyon
 * token'ın yerleşeceği matris hücresini döner — eski game.js matematiği BİREBİR.
 */
export function snapPiece(
  dropX: number,
  dropY: number,
  tileId: number,
  countRotate: number,
  layout: LayoutMetrics,
): { x: number; y: number } {
  const origin = PIECE_ORIGINS[tileId]!;
  const pads = [tileId === 3 ? 0 : 1, 1, tileId === 2 ? 1 : 0, tileId === 3 ? 2 : 1];
  const mod = (n: number) => ((n % 4) + 4) % 4;
  const pad_x = pads[mod(0 - countRotate)]!;
  const pad_y = pads[mod(1 - countRotate)]!;
  const anchors = [
    4 * origin.x - 0.5,
    4 * (1 - origin.y) - 0.5,
    4 * (1 - origin.x) - 0.5,
    4 * origin.y - 0.5,
  ];
  const anchor_x = anchors[mod(countRotate)]!;
  const anchor_y = anchors[mod(3 + countRotate)]!;
  const square_x =
    Math.floor((dropX - (layout.xStart + anchor_x * layout.step)) / layout.step) + pad_x;
  const square_y =
    Math.floor((dropY - (layout.yStart + anchor_y * layout.step)) / layout.step) + pad_y - 1;
  return { x: square_x, y: square_y };
}

/**
 * Ghost önizleme: `snapPiece`'in tersi — hedef hücreye oturacak token'ın
 * çapa noktası (sprite konumu). Özellik: snapPiece(ghostAnchorPos(hücre)) === hücre
 * (round-trip testi ile pimlenir).
 */
export function ghostAnchorPos(
  cell: { x: number; y: number },
  tileId: number,
  countRotate: number,
  layout: LayoutMetrics,
): { x: number; y: number } {
  const origin = PIECE_ORIGINS[tileId]!;
  const pads = [tileId === 3 ? 0 : 1, 1, tileId === 2 ? 1 : 0, tileId === 3 ? 2 : 1];
  const mod = (n: number) => ((n % 4) + 4) % 4;
  const pad_x = pads[mod(0 - countRotate)]!;
  const pad_y = pads[mod(1 - countRotate)]!;
  const anchors = [
    4 * origin.x - 0.5,
    4 * (1 - origin.y) - 0.5,
    4 * (1 - origin.x) - 0.5,
    4 * origin.y - 0.5,
  ];
  const anchor_x = anchors[mod(countRotate)]!;
  const anchor_y = anchors[mod(3 + countRotate)]!;
  const x = layout.xStart + anchor_x * layout.step + (cell.x - pad_x) * layout.step + layout.step / 2;
  const y = layout.yStart + anchor_y * layout.step + (cell.y - pad_y + 1) * layout.step + layout.step / 2;
  return { x, y };
}
