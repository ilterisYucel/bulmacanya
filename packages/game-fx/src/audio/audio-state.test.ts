/**
 * audio-state testleri — FAZ-GAME-FX-SPEC AK-3.1/3.3 (durum kapıları + eşleme tablosu).
 */
import { describe, expect, test } from "bun:test";
import { SOUND_MAP, canPlay } from "./audio-state";

test("AK-3.3: 4 ses tanımlı; her biri frekans + zarf taşır", () => {
  const names = Object.keys(SOUND_MAP).sort();
  expect(names).toEqual(["arpeggio", "boop", "pop", "tick"]);
  for (const def of Object.values(SOUND_MAP)) {
    expect(def.notes.length).toBeGreaterThan(0);
    for (const n of def.notes) {
      expect(n.freq).toBeGreaterThan(0);
      expect(n.durationMs).toBeGreaterThan(0);
      expect(n.startMs).toBeGreaterThanOrEqual(0);
    }
    expect(def.gain).toBeGreaterThan(0);
    expect(def.gain).toBeLessThanOrEqual(1);
  }
});

test("canPlay kapıları: unlocked + mute kapalı gerekir", () => {
  expect(canPlay({ unlocked: false, muted: false })).toBe(false);
  expect(canPlay({ unlocked: true, muted: true })).toBe(false);
  expect(canPlay({ unlocked: true, muted: false })).toBe(true);
});
