/**
 * shake testleri — FAZ-GAME-FX-SPEC AK-4.1/4.2/4.3.
 */
import { describe, expect, test } from "bun:test";
import { Shake } from "./shake";

test("AK-4.1: süre bitince hedef orijinal konumuna döner", () => {
  const target = { x: 10, y: 20 };
  const s = new Shake(target);
  s.start({ px: 3, ms: 150 }, 0);
  s.update(75);
  expect(target.x).not.toBe(10);
  const still = s.update(150);
  expect(still).toBe(false);
  expect(target.x).toBe(10);
  expect(target.y).toBe(20);
});

test("AK-4.2: ofset eksen başına px sınırı içinde ve deterministik", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 0, y: 0 };
  const sa = new Shake(a);
  const sb = new Shake(b);
  sa.start({ px: 5, ms: 100 }, 0);
  sb.start({ px: 5, ms: 100 }, 0);
  for (let t = 10; t < 100; t += 10) {
    sa.update(t);
    sb.update(t);
    expect(a).toEqual(b); // aynı zaman → aynı ofset
    expect(Math.abs(a.x)).toBeLessThanOrEqual(5 + 1e-9);
    expect(Math.abs(a.y)).toBeLessThanOrEqual(5 + 1e-9);
  }
});

test("AK-4.3: çakışan shake'lerde sonuncusu kazanır — birikim yok", () => {
  const target = { x: 0, y: 0 };
  const s = new Shake(target);
  s.start({ px: 4, ms: 100 }, 0);
  s.update(10); // ilk sarsıntı sürüyor
  s.start({ px: 10, ms: 100 }, 10); // yenisi ezer
  s.update(15);
  // taban hâlâ (0,0) — ofset 10px bütçesinden hesaplanır, 4px'lik eskisiyle birikmez
  expect(Math.abs(target.x)).toBeLessThanOrEqual(10 + 1e-9);
  expect(Math.abs(target.y)).toBeLessThanOrEqual(10 + 1e-9);
  s.update(110);
  expect(target).toEqual({ x: 0, y: 0 });
});

test("stop: anında orijinal konuma döner", () => {
  const target = { x: 5, y: 7 };
  const s = new Shake(target);
  s.start({ px: 6, ms: 200 }, 0);
  s.update(50);
  s.stop();
  expect(target).toEqual({ x: 5, y: 7 });
  expect(s.update(60)).toBe(false);
});
