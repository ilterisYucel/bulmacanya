/**
 * burst testleri — FAZ-GAME-FX-SPEC AK-1.1/1.2/1.4/1.5 (mock IRenderAdapter).
 */
import { describe, expect, test } from "bun:test";
import type { ILayer, IRenderAdapter, ISprite, ITexture } from "../contracts/render-adapter";
import { ParticleBurst } from "./burst";
import type { BurstSpec } from "./particle-sim";

const SPEC: BurstSpec = {
  count: 10,
  speed: [0, 0],
  angle: [0, 0],
  gravity: 0,
  drag: 1,
  lifeMs: [500, 500],
  fadeOutMs: 100,
  scale: [1, 1],
};

interface RecordedSprite extends ISprite {
  ops: string[];
  destroyed: boolean;
}

function mockAdapter(): { adapter: IRenderAdapter; sprites: RecordedSprite[]; layers: ILayer[] } {
  const sprites: RecordedSprite[] = [];
  const layers: ILayer[] = [];
  const texture: ITexture = { id: "mock.tex" };
  const adapter: IRenderAdapter = {
    createLayer: () => {
      const layer: ILayer = {
        add: () => {},
        remove: () => {},
        destroy: () => {},
      };
      layers.push(layer);
      return layer;
    },
    createSprite: (t: ITexture) => {
      const s: RecordedSprite = {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        alpha: 1,
        visible: false,
        texture: t,
        ops: [],
        destroyed: false,
        destroy: () => {
          s.destroyed = true;
        },
      };
      sprites.push(s);
      return s;
    },
  };
  return { adapter, sprites, layers };
}

function burst(count: number, rng?: () => number) {
  const { adapter, sprites } = mockAdapter();
  const b = new ParticleBurst(adapter, {
    x: 100,
    y: 200,
    spec: { ...SPEC, count },
    textures: [{ id: "t1" }],
    rng,
  });
  return { b, sprites };
}

test("AK-1.1: burst bitince onComplete bir kez çağrılır ve aktif 0'a döner", () => {
  let calls = 0;
  const { adapter } = mockAdapter();
  const b = new ParticleBurst(adapter, {
    x: 0,
    y: 0,
    spec: SPEC,
    textures: [{ id: "t1" }],
    onComplete: () => calls++,
  });
  b.fire();
  expect(b.activeCount).toBe(10);
  for (let i = 0; i < 10; i++) b.update(100); // 1000ms > ömür 500
  expect(b.activeCount).toBe(0);
  expect(calls).toBe(1);
  b.update(100); // tekrar tetiklenmez
  expect(calls).toBe(1);
});

test("AK-1.2: tavan aşılmaz — 200 istek, max 150: en eski geri dönüşür", () => {
  const { b } = burst(200);
  b.fire();
  // max default 150: havuz 150'de doyar, kalan 50 en eskiyi ezer
  expect(b.activeCount).toBe(150);
  const { b: b2, sprites } = burst(10);
  b2.fire();
  expect(sprites.length).toBe(10);
});

test("AK-1.4: destroy sonrası fire/update no-op, sprite'lar destroy edilir", () => {
  const { b, sprites } = burst(5);
  b.fire();
  b.destroy();
  b.fire();
  b.update(16);
  expect(sprites.every((s) => s.destroyed)).toBe(true);
});

test("AK-1.5: sprite alanları sim durumuna birebir yansır", () => {
  const { adapter, sprites } = mockAdapter();
  const b = new ParticleBurst(adapter, {
    x: 50,
    y: 60,
    spec: { ...SPEC, count: 2, speed: [10, 10], angle: [0, 0] },
    textures: [{ id: "t1" }],
    rng: () => 0.5,
  });
  b.fire();
  const s = sprites[0]!;
  expect(s.x).toBe(50);
  expect(s.y).toBe(60);
  expect(s.visible).toBe(true);
  b.update(100);
  expect(s.x).toBeCloseTo(51); // 10 px/s * 0.1s
  b.update(600);
  expect(s.visible).toBe(false); // ömür bitti → havuza döndü
});

test("textures boşsa fire no-op", () => {
  const { adapter } = mockAdapter();
  const b = new ParticleBurst(adapter, { x: 0, y: 0, spec: SPEC, textures: [] });
  b.fire();
  expect(b.activeCount).toBe(0);
});
