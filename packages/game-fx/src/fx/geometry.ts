/**
 * geometry — SAF efekt geometrisi (FAZ-GAME-FX-SPEC UC-2).
 *
 * Sözleşme:
 * - Tüm üreteçler saf fonksiyondur: renderer'a bağımlılık YOK; adapter bu
 *   nokta listelerini host motorun çizim API'sine çevirir.
 * - `starPoints(rays)` → 1 + 2·rays nokta (merkez + dış/iç alternatifi).
 * - `FX_PRIMITIVES` v1 primitif boyutlarının TEK kaynağıdır (AK-2.3).
 */
export interface Point {
  x: number;
  y: number;
}

export function starPoints(rays: number, outerR: number, innerR: number): Point[] {
  const pts: Point[] = [{ x: 0, y: 0 }];
  for (let i = 0; i < rays; i++) {
    const aOut = (Math.PI * 2 * i) / rays - Math.PI / 2;
    const aIn = aOut + Math.PI / rays;
    pts.push({ x: Math.cos(aOut) * outerR, y: Math.sin(aOut) * outerR });
    pts.push({ x: Math.cos(aIn) * innerR, y: Math.sin(aIn) * innerR });
  }
  return pts;
}

/** Düzensiz kırık poligonu — index ile deterministik (aynı index → aynı şekil). */
export function shardPoints(index: number, w: number, h: number): Point[] {
  const pts: Point[] = [];
  const sides = 5;
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides;
    const jitter = 1 + 0.35 * Math.sin(index * 7.3 + i * 2.7);
    pts.push({
      x: Math.cos(a) * (w / 2) * jitter,
      y: Math.sin(a) * (h / 2) * jitter,
    });
  }
  return pts;
}

/** v1 primitif boyutları (px) — tek kaynak (AK-2.3). */
export const FX_PRIMITIVES = {
  dot: { w: 32, h: 32 },
  ring: { w: 128, h: 128 },
  sparkle: { w: 96, h: 96 },
  shard: { w: 64, h: 64 },
  confetti: { w: 32, h: 8 },
} as const;

export type FxPrimitiveName = keyof typeof FX_PRIMITIVES;
