/**
 * hud-select testleri — FAZ-GAME7 AK-6.1/6.2 (UC-6).
 */
import { describe, expect, test } from "bun:test";
import { hudConfig, submitEnabled } from "./hud-select";

test("AK-6.1: moda göre gösterge seti — başka modun göstergesi görünmez", () => {
  const k = hudConfig("klasik");
  expect(k.showSure).toBe(true);
  expect(k.showHak).toBe(false);
  expect(k.showTargetWord).toBe(true);
  expect(k.showSubmit).toBe(false);

  const d = hudConfig("dedektif");
  expect(d.showHak).toBe(true);
  expect(d.showCategory).toBe(true);
  expect(d.showTargetWord).toBe(false);
  expect(d.showSubmit).toBe(true);

  const s = hudConfig("sabit");
  expect(s.showCan).toBe(true);
  expect(s.showPattern).toBe(true);
  expect(s.showSure).toBe(false);
});

test("AK-6.2: Kontrol Et yalnız Dedektif/Sabit + tam doluyken aktif", () => {
  expect(submitEnabled("klasik", true, "playing")).toBe(false);
  expect(submitEnabled("dedektif", false, "playing")).toBe(false);
  expect(submitEnabled("dedektif", true, "playing")).toBe(true);
  expect(submitEnabled("sabit", true, "playing")).toBe(true);
  expect(submitEnabled("sabit", true, "victory")).toBe(false);
});
