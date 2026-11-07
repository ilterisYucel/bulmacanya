/**
 * fx — game-fx tüketimi: efekt tetikleyicileri + ses + sarsıntı (UC-5, K28-K31).
 *
 * - `signalColor` SAF eşleme (AK-5.5): yok→gri, var→sarı, yerinde→yeşil (Wordle paleti).
 * - `FxController`: game-fx burst'leri (E1/E3/E4/E5) + ses (FxAudio) + Shake (E5/E7);
 *   burst'ler tek-şat: onComplete'te havuzdan düşer (sızıntı yok — AK-5.9).
 * - Audio: ilk kullanıcı dokunuşunda `unlock()` (mobil — FR-3.2); mute HUD'dan gelir.
 */
import {
  FxAudio,
  ParticleBurst,
  Shake,
  type AudioContextFactory,
  type BurstSpec,
  type FxSound,
  type IRenderAdapter,
  type ITexture,
} from "@bulmacanya/game-fx";
import type { FxAtlas } from "@bulmacanya/game-fx-pixi";
import type { Signal } from "../model/word-check";

export function signalColor(signal: Signal): string {
  switch (signal) {
    case "yok":
      return "#9ca3af"; // gri
    case "var":
      return "#f59e0b"; // sarı
    case "yerinde":
      return "#22c55e"; // yeşil
  }
}

/** E1 balon patlaması (kazanç) */
const POP_SPEC: BurstSpec = {
  count: 12,
  speed: [60, 180],
  angle: [0, Math.PI * 2],
  gravity: 200,
  drag: 0.9,
  lifeMs: [300, 600],
  fadeOutMs: 150,
  scale: [0.5, 1],
};

/** E2 yanlış yerleştirme tozu */
const DUST_SPEC: BurstSpec = {
  count: 3,
  speed: [20, 60],
  angle: [0, Math.PI * 2],
  gravity: 0,
  drag: 0.95,
  lifeMs: [180, 280],
  fadeOutMs: 100,
  scale: [0.5, 0.9],
};

/** E3 snap pufu */
const PUFF_SPEC: BurstSpec = {
  count: 4,
  speed: [10, 40],
  angle: [0, Math.PI * 2],
  gravity: 0,
  drag: 0.95,
  lifeMs: [180, 280],
  fadeOutMs: 100,
  scale: [0.6, 1],
};

/** E4 doğru harf ışıltısı */
const SPARKLE_SPEC: BurstSpec = {
  count: 6,
  speed: [10, 40],
  angle: [0, Math.PI * 2],
  gravity: -20,
  drag: 0.95,
  lifeMs: [250, 400],
  fadeOutMs: 120,
  scale: [0.4, 0.8],
};

/** E5 kelime zaferi burst (konfeti) */
const CONFETTI_SPEC: BurstSpec = {
  count: 40,
  speed: [80, 260],
  angle: [0, Math.PI * 2],
  gravity: 400,
  drag: 0.95,
  lifeMs: [700, 1100],
  fadeOutMs: 200,
  scale: [0.7, 1.3],
};

const MAX_PARTICLES = 150; // game-fx tavanı (FAZ-GAME-FX-SPEC §7)

/** Varsayılan tarayıcı fabrikası — AudioContext yoksa null (sessiz no-op). */
const defaultFactory: AudioContextFactory = () =>
  typeof AudioContext !== "undefined" ? new AudioContext() : null;

export class FxController {
  readonly audio: FxAudio;
  private readonly shake: Shake;
  private readonly bursts = new Set<ParticleBurst>();

  constructor(
    private readonly adapter: IRenderAdapter,
    private readonly atlas: FxAtlas,
    stage: { x: number; y: number },
    audioContextFactory: AudioContextFactory = defaultFactory,
  ) {
    this.audio = new FxAudio(audioContextFactory);
    this.shake = new Shake(stage);
  }

  /** Stage ticker'ı her frame çağırır (dt ms + şimdiki zaman ms). */
  tick(dtMs: number, now: number): void {
    this.shake.update(now);
    for (const burst of this.bursts) {
      burst.update(dtMs);
    }
  }

  unlockAudio(): void {
    this.audio.unlock();
  }

  setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
  }

  /** E1 — kelime kazancında balon patlaması. */
  pop(x: number, y: number, color: string): void {
    this.fire(POP_SPEC, [this.atlas.shard, this.atlas.sparkle], x, y, color);
    this.play("pop");
  }

  /** E2 — yanlış yerleştirme tozu (geri sekme tween sahnenin işi). */
  wrongDust(x: number, y: number): void {
    this.fire(DUST_SPEC, [this.atlas.dot], x, y, "#ef4444");
    this.play("boop");
  }

  /** E3 — snap pufu. */
  snapPuff(x: number, y: number): void {
    this.fire(PUFF_SPEC, [this.atlas.ring, this.atlas.dot], x, y, "#ffffff");
    this.play("tick");
  }

  /** E4 — Klasik doğru harf ışıltısı. */
  sparkle(x: number, y: number): void {
    this.fire(SPARKLE_SPEC, [this.atlas.sparkle], x, y, "#fde047");
    this.play("tick");
  }

  /** E5 — zafer burst + sarsıntı. */
  victory(cx: number, cy: number): void {
    this.fire(
      CONFETTI_SPEC,
      [this.atlas.confetti, this.atlas.sparkle, this.atlas.shard],
      cx,
      cy,
      undefined,
    );
    this.shake.start({ px: 4, ms: 150 }, performance.now());
    this.play("arpeggio");
  }

  /** E7 — hak/can kaybı sarsıntısı (kırmızı flash DOM'da). */
  lifeLost(): void {
    this.shake.start({ px: 3, ms: 120 }, performance.now());
    this.play("boop");
  }

  destroy(): void {
    for (const burst of this.bursts) burst.destroy();
    this.bursts.clear();
    this.audio.destroy();
    this.atlas.destroy();
  }

  private fire(
    spec: BurstSpec,
    textures: ITexture[],
    x: number,
    y: number,
    color?: string,
  ): void {
    const burst = new ParticleBurst(this.adapter, {
      x,
      y,
      spec,
      textures,
      color,
      maxParticles: MAX_PARTICLES,
      onComplete: () => {
        this.bursts.delete(burst);
        burst.destroy();
      },
    });
    this.bursts.add(burst);
    burst.fire();
  }

  private play(sound: FxSound): void {
    this.audio.play(sound);
  }
}
