/**
 * audio-state — SAF ses durum makinesi + eşleme tablosu (FAZ-GAME-FX-SPEC UC-3).
 *
 * Sözleşme:
 * - `canPlay` = unlocked VE mute DEĞİL; kapılar çekirdektedir, runtime uygular.
 * - `SOUND_MAP` 4 sesin TEK kaynağıdır (frekans/zarf verisi).
 * - `SoundDef.wave` değerleri WebAudio osilatör tipleriyle birebir.
 */
export type FxSound = "pop" | "tick" | "arpeggio" | "boop";

export interface Note {
  freq: number;
  startMs: number;
  durationMs: number;
}

export interface SoundDef {
  wave: "sine" | "square" | "triangle" | "sawtooth";
  gain: number;
  notes: Note[];
}

export const SOUND_MAP: Record<FxSound, SoundDef> = {
  pop: {
    wave: "square",
    gain: 0.22,
    notes: [{ freq: 340, startMs: 0, durationMs: 90 }],
  },
  tick: {
    wave: "triangle",
    gain: 0.18,
    notes: [{ freq: 880, startMs: 0, durationMs: 45 }],
  },
  arpeggio: {
    wave: "sine",
    gain: 0.2,
    notes: [
      { freq: 523.25, startMs: 0, durationMs: 130 },
      { freq: 659.25, startMs: 90, durationMs: 130 },
      { freq: 783.99, startMs: 180, durationMs: 160 },
    ],
  },
  boop: {
    wave: "sawtooth",
    gain: 0.16,
    notes: [{ freq: 220, startMs: 0, durationMs: 160 }],
  },
};

export interface AudioFlags {
  muted: boolean;
  unlocked: boolean;
}

export function canPlay(flags: AudioFlags): boolean {
  return flags.unlocked && !flags.muted;
}
