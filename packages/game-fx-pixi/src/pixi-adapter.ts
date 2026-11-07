/**
 * pixi-adapter — game-fx kontratlarının pixi v8 sarmalayıcısı (FAZ-GAME-FX-SPEC UC-5).
 *
 * Sözleşme:
 * - `PixiTexture` bu paketin atlas/kullanıcı kodunun ürettiği somut dokudur;
 *   `createSprite` yalnız `PixiTexture` kabul eder (kontrat: aynı paket ailesi).
 * - `color` → `sprite.tint` (yalnız "#rrggbb" / "#rgb" desteklenir; parse edilemezse yoksayılır).
 * - `blendMode` → pixi `BlendMode` string passthrough (bilinmeyen değer pixi'nin kendi hatasıdır).
 * - Görsel katman: unit test YOK (AK-5.1/5.3 gözle/kod inceleme — FAZ-GAME-FX-SPEC).
 */
import { BLEND_MODES, Container, Sprite, type Texture } from "pixi.js";
import type { ILayer, IRenderAdapter, ISprite, ITexture } from "@bulmacanya/game-fx";

export class PixiTexture implements ITexture {
  constructor(
    readonly id: string,
    readonly texture: Texture,
  ) {}
}

function parseHexTint(color: string): number | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!m) return null;
  let hex = m[1]!;
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return Number.parseInt(hex, 16);
}

class PixiSpriteWrapper implements ISprite {
  private readonly handle: ITexture;
  private tintOverride: string | undefined;

  constructor(private readonly sprite: Sprite, texture: ITexture) {
    this.handle = texture;
    this.sprite.anchor.set(0.5);
  }

  get x() {
    return this.sprite.x;
  }
  set x(v: number) {
    this.sprite.x = v;
  }
  get y() {
    return this.sprite.y;
  }
  set y(v: number) {
    this.sprite.y = v;
  }
  get rotation() {
    return this.sprite.rotation;
  }
  set rotation(v: number) {
    this.sprite.rotation = v;
  }
  get scale() {
    return this.sprite.scale.x;
  }
  set scale(v: number) {
    this.sprite.scale.set(v);
  }
  get alpha() {
    return this.sprite.alpha;
  }
  set alpha(v: number) {
    this.sprite.alpha = v;
  }
  get visible() {
    return this.sprite.visible;
  }
  set visible(v: boolean) {
    this.sprite.visible = v;
  }
  get texture() {
    return this.handle;
  }
  set color(v: string | undefined) {
    this.tintOverride = v;
    if (v === undefined) {
      this.sprite.tint = 0xffffff;
      return;
    }
    const tint = parseHexTint(v);
    if (tint !== null) this.sprite.tint = tint;
  }
  get color() {
    return this.tintOverride;
  }
  set blendMode(v: string | undefined) {
    if (v !== undefined) this.sprite.blendMode = v as unknown as BLEND_MODES;
  }
  destroy(): void {
    this.sprite.destroy();
  }

  /** Adapter ailesi içi: alttaki pixi sprite'ına erişim. */
  unwrap(): Sprite {
    return this.sprite;
  }
}

class PixiLayer implements ILayer {
  constructor(private readonly container: Container) {}

  add(sprite: ISprite): void {
    this.container.addChild((sprite as PixiSpriteWrapper).unwrap());
  }
  remove(sprite: ISprite): void {
    this.container.removeChild((sprite as PixiSpriteWrapper).unwrap());
  }
  destroy(): void {
    this.container.destroy({ children: true });
  }
}

export class PixiRenderAdapter implements IRenderAdapter {
  constructor(private readonly root?: Container) {}

  createLayer(): ILayer {
    const container = new Container();
    this.root?.addChild(container);
    return new PixiLayer(container);
  }

  createSprite(texture: ITexture): ISprite {
    const pt = texture as PixiTexture;
    return new PixiSpriteWrapper(new Sprite(pt.texture), texture);
  }
}
