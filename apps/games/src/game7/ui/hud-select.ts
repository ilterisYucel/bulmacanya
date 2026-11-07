/**
 * hud-select — moda göre HUD gösterge seçimi (UC-6, AK-6.1/6.2). SAF.
 */
import type { Game7Mode } from "../model/words";
import type { Game7Phase } from "../model/api-types";

export interface HudConfig {
  showSure: boolean;
  showHak: boolean;
  showCan: boolean;
  showTargetWord: boolean;
  showCategory: boolean;
  showPattern: boolean;
  showSubmit: boolean;
  showWordsProgress: boolean;
}

/** Mod → gösterge seti (AK-6.1): başka modun göstergesi GÖRÜNMEZ. */
export function hudConfig(mode: Game7Mode): HudConfig {
  switch (mode) {
    case "klasik":
      return {
        showSure: true,
        showHak: false,
        showCan: false,
        showTargetWord: true,
        showCategory: false,
        showPattern: false,
        showSubmit: false,
        showWordsProgress: true,
      };
    case "dedektif":
      return {
        showSure: false,
        showHak: true,
        showCan: false,
        showTargetWord: false,
        showCategory: true,
        showPattern: false,
        showSubmit: true,
        showWordsProgress: false,
      };
    case "sabit":
      return {
        showSure: false,
        showHak: false,
        showCan: true,
        showTargetWord: false,
        showCategory: false,
        showPattern: true,
        showSubmit: true,
        showWordsProgress: false,
      };
  }
}

/** "Kontrol Et" yalnız Dedektif/Sabit'te; slotlar dolmadan PASİF (AK-6.2). */
export function submitEnabled(mode: Game7Mode, isFull: boolean, phase: Game7Phase): boolean {
  if (phase !== "playing") return false;
  if (mode === "klasik") return false;
  return isFull;
}
