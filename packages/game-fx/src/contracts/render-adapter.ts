/**
 * render-adapter — renderer-bağımsız kontratlar (FAZ-GAME-FX-SPEC K4/UC-1).
 *
 * Çekirdek bu arayüzler dışında HİÇBİR renderer API'sine dokunmaz; adapter'lar
 * (örn. @bulmacanya/game-fx-pixi) bu kontratları host motorun nesnelerine sarar.
 *
 * Sözleşme:
 * - `ITexture` opak bir tanıtıcıdır — dokuyu YALNIZ adapter/atlas üretir.
 * - `color`/`blendMode` passthrough'dur: desteklemeyen adapter yoksayar.
 * - `destroy` sonrası hiçbir metot çağrılmaz (çağrılırsa sessiz no-op adapter'in işi).
 */
export interface ITexture {
  readonly id: string;
}

export interface ISprite {
  x: number;
  y: number;
  rotation: number;
  /** tekdüze (uniform) ölçek — x/y ayrımı v1'de YOK (K4 minimal yüzey) */
  scale: number;
  alpha: number;
  visible: boolean;
  readonly texture: ITexture;
  /** passthrough: host motor bilmiyorsa yoksayılır (örn. tint) */
  color?: string;
  /** passthrough: host motor bilmiyorsa yoksayılır (örn. add/glow blend) */
  blendMode?: string;
  destroy(): void;
}

export interface ILayer {
  add(sprite: ISprite): void;
  remove(sprite: ISprite): void;
  destroy(): void;
}

export interface IRenderAdapter {
  createLayer(): ILayer;
  createSprite(texture: ITexture): ISprite;
}
