/**
 * pixi-fx-atlas — programatik efekt dokuları (FAZ-GAME-FX-SPEC UC-2/UC-5, K30).
 *
 * Sözleşme:
 * - 5 primitif (dot/ring/sparkle/shard/confetti) TEK `Graphics`'e çizilir,
 *   TEK `generateTexture` çağrısıyla TEK TextureSource üretilir (v8 ParticleContainer kısıtı).
 * - Geometri `@bulmacanya/game-fx` çekirdeğinden gelir (saf nokta listeleri).
 * - Beyaz + yumuşak kenarlı primitifler: renklendirme oyuncu tarafta `color` (tint) passthrough'u ile.
 * - `destroy()` → temel doku kaynağı serbest bırakılır; sonrası kullanım tanımsız.
 */
import { Graphics, Rectangle, Texture, type Renderer } from "pixi.js";
import {
  FX_PRIMITIVES,
  shardPoints,
  starPoints,
} from "@bulmacanya/game-fx/fx-geometry";
import type { ITexture } from "@bulmacanya/game-fx";
import { PixiTexture } from "./pixi-adapter";

export interface FxAtlas {
  dot: ITexture;
  ring: ITexture;
  sparkle: ITexture;
  shard: ITexture;
  confetti: ITexture;
  /** burst config'lerine verilecek doku listesi */
  all(): ITexture[];
  destroy(): void;
}

export function createFxAtlas(renderer: Renderer): FxAtlas {
  const P = FX_PRIMITIVES;
  const W =
    P.dot.w + P.ring.w + P.sparkle.w + P.shard.w + P.confetti.w; // 352
  const H = Math.max(P.dot.h, P.ring.h, P.sparkle.h, P.shard.h, P.confetti.h); // 128

  const slots = {
    dot: { x: 0, y: 0 },
    ring: { x: P.dot.w, y: 0 },
    sparkle: { x: P.dot.w + P.ring.w, y: 0 },
    shard: { x: P.dot.w + P.ring.w + P.sparkle.w, y: 0 },
    confetti: { x: P.dot.w + P.ring.w + P.sparkle.w + P.shard.w, y: 0 },
  } as const;

  const g = new Graphics();
  const white = 0xffffff;

  // dot — iç içe dairelerle sahte radyal (merkez opak → kenar şeffaf)
  {
    const c = { x: slots.dot.x + P.dot.w / 2, y: slots.dot.y + P.dot.h / 2 };
    const r = P.dot.w / 2;
    for (let i = 2; i >= 0; i--) {
      g.circle(c.x, c.y, (r * (i + 1)) / 3).fill({ color: white, alpha: 0.28 });
    }
  }

  // ring — ince çember çizgisi
  {
    const c = { x: slots.ring.x + P.ring.w / 2, y: slots.ring.y + P.ring.h / 2 };
    g.circle(c.x, c.y, P.ring.w / 2 - 4).stroke({ color: white, width: 6, alpha: 0.9 });
  }

  // sparkle — glow + 4 köşeli yıldız
  {
    const c = { x: slots.sparkle.x + P.sparkle.w / 2, y: slots.sparkle.y + P.sparkle.h / 2 };
    const r = P.sparkle.w / 2;
    for (let i = 2; i >= 0; i--) {
      g.circle(c.x, c.y, (r * (i + 1)) / 3).fill({ color: white, alpha: 0.22 });
    }
    const star = starPoints(4, r * 0.5, r * 0.22).map((p) => ({ x: c.x + p.x, y: c.y + p.y }));
    g.poly(star).fill({ color: white, alpha: 1 });
  }

  // shard — düzensiz beşgen (index 0 sabit)
  {
    const c = { x: slots.shard.x + P.shard.w / 2, y: slots.shard.y + P.shard.h / 2 };
    const poly = shardPoints(0, P.shard.w, P.shard.h).map((p) => ({ x: c.x + p.x, y: c.y + p.y }));
    g.poly(poly).fill({ color: white, alpha: 1 });
  }

  // confetti — ince şerit
  {
    const s = slots.confetti;
    g.rect(s.x, s.y, P.confetti.w, P.confetti.h).fill({ color: white, alpha: 1 });
  }

  const baseTex = renderer.generateTexture(g);
  g.destroy();

  const frame = (s: { x: number; y: number }, w: number, h: number): Texture =>
    new Texture({ source: baseTex.source, frame: new Rectangle(s.x, s.y, w, h) });

  const atlas: FxAtlas = {
    dot: new PixiTexture("fx.dot", frame(slots.dot, P.dot.w, P.dot.h)),
    ring: new PixiTexture("fx.ring", frame(slots.ring, P.ring.w, P.ring.h)),
    sparkle: new PixiTexture("fx.sparkle", frame(slots.sparkle, P.sparkle.w, P.sparkle.h)),
    shard: new PixiTexture("fx.shard", frame(slots.shard, P.shard.w, P.shard.h)),
    confetti: new PixiTexture("fx.confetti", frame(slots.confetti, P.confetti.w, P.confetti.h)),
    all() {
      return [this.dot, this.ring, this.sparkle, this.shard, this.confetti];
    },
    destroy() {
      baseTex.destroy(true);
    },
  };
  return atlas;
}
