/**
 * fx-audio — WebAudio runtime (ince katman; FAZ-GAME-FX-SPEC UC-3, K6).
 *
 * Sözleşme:
 * - `AudioContext` FABRİKASI constructor'da injectable (DI — headless test).
 * - `unlock()` ilk kullanıcı dokunuşunda çağrılır; öncesinde tüm sesler sessiz no-op.
 * - Mute açıkken no-op; görsel efektler bu sınıfın KONUSU DEĞİLDİR.
 * - Fabrika null dönerse `AUDIO_CONTEXT_FAILED` kategorisi: çökme YOK, tüm çağrılar sessiz.
 * - `destroy` sonrası çağrılar sessiz no-op.
 *
 * shortcut: v1 sentez sabit frekanslıdır (frekans ramp yok); gerçek asset'ler
 * ileride aynı arayüze takılır (game7 SPEC K31).
 */
import { SOUND_MAP, canPlay, type AudioFlags, type FxSound } from "./audio-state";

export interface IAudioContextLike {
  currentTime: number;
  destination: unknown;
  createOscillator(): IOscillatorLike;
  createGain(): IGainLike;
  resume(): void | Promise<void>;
  close(): void | Promise<void>;
}

export interface IOscillatorLike {
  type: string;
  frequency: { value: number };
  connect(node: unknown): void;
  start(when?: number): void;
  stop(when?: number): void;
}

export interface IGainLike {
  gain: { value: number };
  connect(node: unknown): void;
}

export type AudioContextFactory = () => IAudioContextLike | null;

export class FxAudio {
  private readonly flags: AudioFlags = { muted: false, unlocked: false };
  private ctx: IAudioContextLike | null = null;
  private destroyed = false;

  constructor(private readonly factory: AudioContextFactory) {}

  get muted(): boolean {
    return this.flags.muted;
  }

  get unlocked(): boolean {
    return this.flags.unlocked;
  }

  /** İlk kullanıcı dokunuşunda çağrılır; context'i kurar ve resume eder. */
  unlock(): void {
    if (this.destroyed || this.flags.unlocked) return;
    this.flags.unlocked = true;
    const ctx = this.factory();
    if (ctx === null) return; // AUDIO_CONTEXT_FAILED — sessiz kalır
    this.ctx = ctx;
    ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.flags.muted = muted;
  }

  play(sound: FxSound): void {
    const ctx = this.ctx;
    if (this.destroyed || !canPlay(this.flags) || ctx === null) return;
    const def = SOUND_MAP[sound];
    const base = ctx.currentTime;
    for (const note of def.notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = def.wave;
      osc.frequency.value = note.freq;
      gain.gain.value = def.gain;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = base + note.startMs / 1000;
      osc.start(t0);
      osc.stop(t0 + note.durationMs / 1000);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.ctx?.close();
    this.ctx = null;
  }
}
