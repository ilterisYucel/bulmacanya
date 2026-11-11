/**
 * layout testleri — UC-4/SC-5: 6 referans viewport'ta geçerli ölçü; sıfır/negatif
 * viewport `LAYOUT_INVALID` fırlatır.
 */
import { describe, expect, test } from "bun:test";
import { calculateLayout } from "./layout";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1024, height: 1024 },
  { width: 360, height: 640 },
  { width: 768, height: 1024 },
  { width: 1280, height: 720 },
];

describe("calculateLayout", () => {
  test.each(VIEWPORTS)("$width×$height geçerli ölçü üretir", ({ width, height }) => {
    const m = calculateLayout({ width, height });
    expect(m.step).toBeCloseTo(Math.min(width, height) * 0.05, 5);
    expect(m.brickSize).toBeCloseTo(m.step * 1.5, 5);
    expect(m.ropeRange).toBeCloseTo(m.step * 6, 5);
    expect(m.scrollStep).toBeCloseTo(height / 3, 5);
    for (const v of Object.values(m)) expect(v).toBeGreaterThan(0);
  });

  test("sıfır viewport LAYOUT_INVALID fırlatır", () => {
    expect(() => calculateLayout({ width: 0, height: 844 })).toThrow("LAYOUT_INVALID");
    expect(() => calculateLayout({ width: 390, height: -1 })).toThrow("LAYOUT_INVALID");
    expect(() => calculateLayout({ width: Number.NaN, height: 844 })).toThrow("LAYOUT_INVALID");
  });
});
