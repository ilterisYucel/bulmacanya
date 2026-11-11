/**
 * fx — game-fx tüketimi (UC-8, K16/K22): burst + shake + sentez ses.
 * Yalnız `ui/` katmanı; model bu API'yi import ETMEZ (Purity 7).
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

/** İniş tozu. */
const LAND_SPEC: BurstSpec = {
  count: 5,
  speed: [20, 70],
  angle: [0, Math.PI * 2],
  gravity: 0,
  drag: 0.95,
  lifeMs: [200, 320],
  fadeOutMs: 100,
  scale: [0.5, 0.9],
};

/** İp kopması — kıvılcım. */
const BREAK_SPEC: BurstSpec = {
  count: 10,
  speed: [40, 140],
  angle: [0, Math.PI * 2],
  gravity: 220,
  drag: 0.92,
  lifeMs: [220, 420],
  fadeOutMs: 120,
  scale: [0.5, 1],
};

/** Coin parıltısı. */
const COIN_SPEC: BurstSpec = {
  count: 6,
  speed: [15, 45],
  angle: [0, Math.PI * 2],
  gravity: -20,
  drag: 0.95,
  lifeMs: [250, 400],
  fadeOutMs: 120,
  scale: [0.4, 0.8],
};

/** Kat konfetisi. */
const CONFETTI_SPEC: BurstSpec = {
  count: 28,
  speed: [60, 200],
  angle: [0, Math.PI * 2],
  gravity: 380,
  drag: 0.95,
  lifeMs: [600, 900],
  fadeOutMs: 200,
  scale: [0.6, 1.2],
};

const MAX_PARTICLES = 120;

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

  tick(dtMs: number, now: number): void {
    this.shake.update(now);
    for (const burst of this.bursts) burst.update(dtMs);
  }

  unlockAudio(): void {
    this.audio.unlock();
  }

  setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
  }

  attach(): void {
    this.play("tick");
  }

  land(x: number, y: number): void {
    this.fire(LAND_SPEC, [this.atlas.dot, this.atlas.ring], x, y, "#c9b39a");
    this.play("pop");
  }

  ropeBreak(x: number, y: number): void {
    this.fire(BREAK_SPEC, [this.atlas.shard, this.atlas.sparkle], x, y, "#a78bfa");
    this.shake.start({ px: 4, ms: 150 }, performance.now());
    this.play("boop");
  }

  coin(x: number, y: number): void {
    this.fire(COIN_SPEC, [this.atlas.sparkle], x, y, "#f2b632");
    this.play("tick");
  }

  floorUp(cx: number, cy: number): void {
    this.fire(CONFETTI_SPEC, [this.atlas.confetti, this.atlas.shard], cx, cy);
    this.shake.start({ px: 3, ms: 120 }, performance.now());
    this.play("arpeggio");
  }

  over(): void {
    this.shake.start({ px: 5, ms: 200 }, performance.now());
    this.play("boop");
  }

  /** Geçersiz atış geri bildirimi (K4). */
  reject(): void {
    this.shake.start({ px: 3, ms: 100 }, performance.now());
    this.play("tick");
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
