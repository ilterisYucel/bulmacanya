/**
 * fx testleri — FAZ-GAME7 AK-5.5 (sinyal renk eşlemesi) + burst yaşam döngüsü (AK-5.9).
 */
import { describe, expect, test } from "bun:test";
import { signalColor } from "./fx";

test("AK-5.5: sinyal renk eşlemesi — yok=gri, var=sarı, yerinde=yeşil", () => {
  expect(signalColor("yok")).toBe("#9ca3af");
  expect(signalColor("var")).toBe("#f59e0b");
  expect(signalColor("yerinde")).toBe("#22c55e");
});
