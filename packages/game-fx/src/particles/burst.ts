/**
 * burst — ParticleBurst (FAZ-GAME-FX-SPEC UC-1).
 *
 * Sözleşme:
 * - Ticker sahibi DEĞİLDİR: oyun her frame `update(dtMs)` çağırır (K3).
 * - Havuz: sprite'lar lazily ayrılır, tavan `maxParticles` (varsayılan 150) aşılmaz;
 *   aşımda EN ESKİ aktif parçacık geri dönüşür.
 * - `fire` → N parçacık; hepsi bitince `onComplete` BİR KEZ çağrılır (aktif sayısı 0).
 * - `destroy` sonrası `fire`/`update` sessiz no-op'tur; sprite + katman serbest bırakılır.
 */
import type { ILayer, IRenderAdapter, ISprite, ITexture } from "../contracts/render-adapter";
import {
  particleAlpha,
  simulateParticle,
  spawnParticle,
  type BurstSpec,
  type ParticleState,
} from "./particle-sim";

export interface BurstOptions {
  x: number;
  y: number;
  spec: BurstSpec;
  /** dokular sırayla dağıtılır (boşsa fire no-op) */
  textures: readonly ITexture[];
  /** passthrough: renk (örn. tint) */
  color?: string;
  /** passthrough: blend modu */
  blendMode?: string;
  rng?: () => number;
  maxParticles?: number;
  onComplete?: () => void;
}

interface PoolEntry {
  sprite: ISprite;
  state: ParticleState;
}

export class ParticleBurst {
  private readonly layer: ILayer;
  private readonly rng: () => number;
  private readonly max: number;
  private readonly entries: PoolEntry[] = [];
  private readonly free: PoolEntry[] = [];
  private readonly active: PoolEntry[] = [];
  private destroyed = false;
  private fired = false;
  private completed = false;

  constructor(
    private readonly adapter: IRenderAdapter,
    private readonly opts: BurstOptions,
  ) {
    this.layer = adapter.createLayer();
    this.rng = opts.rng ?? Math.random;
    this.max = opts.maxParticles ?? 150;
  }

  get activeCount(): number {
    return this.active.length;
  }

  fire(): void {
    if (this.destroyed || this.opts.textures.length === 0) return;
    this.completed = false;
    this.fired = true;
    const { x, y, spec } = this.opts;
    for (let i = 0; i < spec.count; i++) {
      const entry = this.obtain();
      entry.state = spawnParticle(spec, x, y, this.rng);
      entry.sprite.visible = true;
      this.applyToSprite(entry);
      this.active.push(entry);
    }
  }

  update(dtMs: number): void {
    if (this.destroyed || dtMs <= 0) return;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const entry = this.active[i]!;
      simulateParticle(entry.state, dtMs);
      if (!entry.state.active) {
        entry.sprite.visible = false;
        this.active.splice(i, 1);
        this.free.push(entry);
      } else {
        this.applyToSprite(entry);
      }
    }
    if (this.fired && !this.completed && this.active.length === 0) {
      this.completed = true;
      this.opts.onComplete?.();
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const entry of this.entries) entry.sprite.destroy();
    this.entries.length = 0;
    this.active.length = 0;
    this.free.length = 0;
    this.layer.destroy();
  }

  private obtain(): PoolEntry {
    const fromFree = this.free.pop();
    if (fromFree) return fromFree;
    if (this.entries.length >= this.max) {
      // tavan: en eski aktif geri dönüşür
      const oldest = this.active.shift();
      if (oldest) return oldest;
    }
    const sprite = this.adapter.createSprite(this.pickTexture());
    const entry: PoolEntry = {
      sprite,
      state: spawnParticle(this.opts.spec, 0, 0, this.rng),
    };
    this.layer.add(sprite);
    this.entries.push(entry);
    return entry;
  }

  private pickTexture(): ITexture {
    const textures = this.opts.textures;
    return textures[this.entries.length % textures.length] ?? textures[0]!;
  }

  private applyToSprite(entry: PoolEntry): void {
    const s = entry.sprite;
    const p = entry.state;
    s.x = p.x;
    s.y = p.y;
    s.scale = p.scale;
    s.alpha = particleAlpha(p);
    if (this.opts.color !== undefined) s.color = this.opts.color;
    if (this.opts.blendMode !== undefined) s.blendMode = this.opts.blendMode;
  }
}
