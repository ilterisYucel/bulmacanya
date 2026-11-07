import { describe, expect, test } from "bun:test";
import { calculateLayout, ghostAnchorPos, phoneArea, snapPiece } from "./layout";

// SC-3: referans viewport'larda taşma/negatif koordinat yok (S14: telefon alanı)
const VIEWPORTS: Array<{ width: number; height: number }> = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1024, height: 1024 },
  { width: 360, height: 640 },
  { width: 768, height: 1024 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
];

describe("shapetris layout (UC-7)", () => {
  test("AK-7.1: dikey viewport — step = min(kısaKenar/12, 0.85·uzunKenar/coef)", () => {
    const layout = calculateLayout({ width: 390, height: 844 });
    expect(layout.step).toBeCloseTo(390 / 12, 5);
    expect(layout.valid).toBe(true);
  });

  test("S14: phoneArea geniş ekranı 480px kolona sıkıştırır", () => {
    expect(phoneArea({ width: 1920, height: 1080 })).toEqual({ width: 480, height: 1080 });
    expect(phoneArea({ width: 844, height: 390 })).toEqual({ width: 480, height: 390 });
    expect(phoneArea({ width: 390, height: 844 })).toEqual({ width: 390, height: 844 });
  });

  test("AK-7.3: tüm referans viewport'larda (telefon alanında) negatif koordinat ve taşma YOK", () => {
    for (const v of VIEWPORTS) {
      const layout = calculateLayout(phoneArea(v));
      expect(layout.valid, JSON.stringify(v)).toBe(true);
      expect(layout.step).toBeGreaterThanOrEqual(8);
      for (const key of ["xStart", "yStart", "indent", "bannerSize", "headerStartX", "headerStartY"] as const) {
        expect(layout[key], `${JSON.stringify(v)} ${key}`).toBeGreaterThanOrEqual(0);
      }
      const area = phoneArea(v);
      expect(layout.xStart + 12 * layout.step).toBeLessThanOrEqual(area.width + 1e-6);
    }
  });

  test("snapPiece: O parçası bilinen noktaya bilinen hücreye oturur (eski matematik)", () => {
    const layout = calculateLayout({ width: 390, height: 844 });
    // O (tileId 2), rotasyon 0; çapa (0.5, 0.5) → drop (xStart+1.5step, yStart+2.5step) hücre (1,1)
    const { x, y } = snapPiece(
      layout.xStart + 1.5 * layout.step,
      layout.yStart + 2.5 * layout.step,
      2,
      0,
      layout,
    );
    expect(x).toBe(1);
    expect(y).toBe(1);
  });

  test("snapPiece: 4 kez döndürülmüş parça tahta sınırları içinde kalır", () => {
    const layout = calculateLayout({ width: 390, height: 844 });
    for (let rot = 0; rot < 4; rot++) {
      const { x, y } = snapPiece(
        layout.xStart + 4 * layout.step,
        layout.yStart + 4 * layout.step,
        0,
        rot,
        layout,
      );
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(12);
      expect(y).toBeLessThan(12);
    }
  });

  test("ghostAnchorPos round-trip: snapPiece(ghostAnchorPos(hücre)) === hücre (7 parça × 4 rotasyon)", () => {
    const layout = calculateLayout({ width: 390, height: 844 });
    for (let tileId = 0; tileId < 7; tileId++) {
      for (let rot = 0; rot < 4; rot++) {
        for (const cell of [
          { x: 1, y: 1 },
          { x: 4, y: 3 },
          { x: 8, y: 8 },
          { x: 0, y: 0 },
        ]) {
          const anchor = ghostAnchorPos(cell, tileId, rot, layout);
          const snapped = snapPiece(anchor.x, anchor.y, tileId, rot, layout);
          expect(snapped.x, `tile=${tileId} rot=${rot} cell=${cell.x},${cell.y}`).toBe(cell.x);
          expect(snapped.y, `tile=${tileId} rot=${rot} cell=${cell.x},${cell.y}`).toBe(cell.y);
        }
      }
    }
  });

  test("sıfır boyutlu viewport geçersiz", () => {
    expect(calculateLayout({ width: 0, height: 0 }).valid).toBe(false);
  });
});
