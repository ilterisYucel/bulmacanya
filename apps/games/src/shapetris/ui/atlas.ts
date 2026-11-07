/**
 * atlas — Shapetris grafik kaynakları (UC-9, K2/S10). PIXI katmanı.
 *
 * S10 (2026-11-05): Gemini sprite sheet bırakıldı; tüm grafikler eski
 * game3-cordova formatından gelir — karo a×a (243×244), tetromino token
 * 2a×2a (500×500, içinde 4 kare). Kullanıcı yeni grafikleri BU FORMATA
 * birebir elle çizecek; o zaman yalnız bu klasördeki dosyalar değişir.
 */

import { Assets, Texture } from "pixi.js";

export interface AtlasFrames {
  redOff: Texture;
  redOn: Texture;
  greenOff: Texture;
  greenOn: Texture;
  blueOff: Texture;
  blueOn: Texture;
  /** 7 parça token'ı — S, Z, O, I, T, J, L sırası (tile_0..6). */
  pieces: Texture[];
}

const url = (name: string): string =>
  new URL(`../assets/tiles/${name}`, import.meta.url).href;

export async function loadAtlas(): Promise<AtlasFrames> {
  const [redOff, redOn, greenOff, greenOn, blueOff, blueOn, ...pieces] =
    await Promise.all([
      Assets.load(url("red_off.png")),
      Assets.load(url("red_on.png")),
      Assets.load(url("green_off.png")),
      Assets.load(url("green_on.png")),
      Assets.load(url("blue_off.png")),
      Assets.load(url("blue_on.png")),
      Assets.load(url("tile_0.png")),
      Assets.load(url("tile_1.png")),
      Assets.load(url("tile_2.png")),
      Assets.load(url("tile_3.png")),
      Assets.load(url("tile_4.png")),
      Assets.load(url("tile_5.png")),
      Assets.load(url("tile_6.png")),
    ]);
  return { redOff, redOn, greenOff, greenOn, blueOff, blueOn, pieces };
}
