/**
 * layout testleri — FAZ-GAME7 AK-2.9 (UC-2, K27).
 */
import { describe, expect, test } from "bun:test";
import { balloonSize, calculateLayout, nearestSlot } from "./layout";

test("AK-2.9: 390×844 — tüm bölgeler canvas içinde, taşma/negatif yok", () => {
  const l = calculateLayout({ width: 390, height: 844 }, 4);
  expect(l.offsetX).toBe(0);
  expect(l.areaWidth).toBe(390);
  expect(l.balloonArea.x).toBeGreaterThanOrEqual(0);
  expect(l.balloonArea.width).toBeGreaterThan(0);
  expect(l.balloonArea.x + l.balloonArea.width).toBeLessThanOrEqual(390);
  expect(l.slotX).toBeLessThanOrEqual(390);
  expect(l.slotX).toBeGreaterThan(l.balloonArea.width);
  const lastSlotY = l.slotTop + l.slotStep * (l.slotCount - 1);
  expect(l.slotTop - l.slotBox.height / 2).toBeGreaterThanOrEqual(l.hudReserve);
  expect(lastSlotY + l.slotBox.height / 2).toBeLessThanOrEqual(844);
  expect(l.slotStep).toBeGreaterThanOrEqual(l.stepMin);
});

test("slot kutusu SABİT: kelime uzunluğundan bağımsız, ray kompakt ve ortalanmış", () => {
  const l3 = calculateLayout({ width: 390, height: 844 }, 3);
  const l6 = calculateLayout({ width: 390, height: 844 }, 6);
  // aynı kutu boyutu (harf sayısı değiştirmez — 2026-11-07 düzeltme)
  expect(l3.slotBox).toEqual(l6.slotBox);
  expect(l3.slotStep).toBe(l6.slotStep);
  // ray yüksekliği yalnız harf sayısıyla büyür, oyun alanının yarısını aşmaz (3 harfte)
  const rail3 = l3.slotStep * 3 - (l3.slotStep - l3.slotBox.height);
  expect(rail3).toBeLessThanOrEqual((844 - l3.hudReserve) / 2);
  const rail6 = l6.slotStep * 6 - (l6.slotStep - l6.slotBox.height);
  expect(rail6).toBeGreaterThan(rail3);
  expect(rail6).toBeLessThanOrEqual(844 - l6.hudReserve);
  // ortalanmış: ray dışı boşluklar eşit
  const gapTop3 = l3.slotTop - l3.slotBox.height / 2 - l3.hudReserve;
  const gapBottom3 = 844 - (l3.slotTop + l3.slotStep * 2 + l3.slotBox.height / 2);
  expect(Math.abs(gapTop3 - gapBottom3)).toBeLessThanOrEqual(1);
});

test("balon görseli slot kutusuna sığar (4:5 oran)", () => {
  const l = calculateLayout({ width: 390, height: 844 }, 4);
  const b = balloonSize(l);
  expect(b.width).toBe(Math.round(l.slotBox.height * 0.8));
  expect(b.width).toBeLessThan(l.slotBox.width);
  expect(b.height).toBe(l.slotBox.height);
});

test("AK-2.9: geniş ekranda phoneArea ≤480 + yatay ortalama (S14 deseni)", () => {
  const l = calculateLayout({ width: 1920, height: 1080 }, 4);
  expect(l.areaWidth).toBe(480);
  expect(l.offsetX).toBe((1920 - 480) / 2);
  expect(l.balloonArea.x + l.balloonArea.width).toBeLessThanOrEqual(480);
});

test("AK-2.9: çok küçük viewport'ta ray taşmaz, step alt sınırda", () => {
  const l = calculateLayout({ width: 200, height: 200 }, 8);
  expect(l.slotStep).toBeGreaterThanOrEqual(8);
  const lastSlotY = l.slotTop + l.slotStep * (l.slotCount - 1);
  expect(lastSlotY + l.slotBox.height / 2).toBeLessThanOrEqual(200);
  expect(l.slotTop - l.slotBox.height / 2).toBeGreaterThanOrEqual(l.hudReserve);
});

test("nearestSlot: yuvarlama + kenetleme (quantize emsali)", () => {
  const l = calculateLayout({ width: 390, height: 844 }, 4);
  expect(nearestSlot(l, l.slotTop)).toBe(0);
  expect(nearestSlot(l, l.slotTop + l.slotStep)).toBe(1);
  expect(nearestSlot(l, -100)).toBe(0);
  expect(nearestSlot(l, 10000)).toBe(3);
});
