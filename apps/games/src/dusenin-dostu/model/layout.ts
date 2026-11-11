/**
 * layout — responsive ölçü hesabı (K19, UC-4). SAF; Pixi/DOM bağımsız.
 *
 * `step = min(W,H) × 0.05`; kutu ve oyuncu 1.5×step; ip menzili 6×step.
 * Model koordinatları step biriminde; bu fonksiyon piksel karşılığını üretir.
 *
 * Hata kategorisi: `LAYOUT_INVALID` — viewport ölçülemedi (0/negatif/NaN).
 * Yan etkiler: YOK.
 */
import type { LayoutMetrics } from "./types";
import { BRICK_SIZE, PLAYER_SIZE, ROPE_RANGE } from "./types";

export function calculateLayout(viewport: { width: number; height: number }): LayoutMetrics {
  const { width, height } = viewport;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("LAYOUT_INVALID: viewport ölçülemedi");
  }
  const step = Math.min(width, height) * 0.05;
  return {
    width,
    height,
    step,
    brickSize: BRICK_SIZE * step,
    playerSize: PLAYER_SIZE * step,
    ropeRange: ROPE_RANGE * step,
    scrollStep: height / 3,
  };
}
