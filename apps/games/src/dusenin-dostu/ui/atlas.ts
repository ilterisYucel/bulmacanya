/**
 * atlas — PNG asset yükleme; asset yollarının TEK kaynağı (K15, Purity 4).
 *
 * Tüm sprite'lar `assets/` altında ayrı PNG (game7 deseni). Runtime'da sanat
 * amaçlı vektör çizim YOK; ip bile doku sprite'ıdır (önizleme overlay istisnası).
 */
import { Assets, Texture } from "pixi.js";

export interface DuseninAtlas {
  playerIdle: Texture;
  playerSwing: Texture;
  brick: Texture;
  rotorCw: Texture;
  rotorCcw: Texture;
  breaker: Texture;
  chest: Texture;
  coin: Texture;
  hook: Texture;
  rope: Texture;
  bgCave: Texture;
  bgMid: Texture;
  bgSky: Texture;
  hudIp: Texture;
  hudCoin: Texture;
  hudChain: Texture;
}

const FILES: Record<keyof DuseninAtlas, string> = {
  playerIdle: "player-idle.png",
  playerSwing: "player-swing.png",
  brick: "brick.png",
  rotorCw: "rotor-cw.png",
  rotorCcw: "rotor-ccw.png",
  breaker: "breaker.png",
  chest: "chest.png",
  coin: "coin.png",
  hook: "hook.png",
  rope: "rope.png",
  bgCave: "bg-cave.png",
  bgMid: "bg-mid.png",
  bgSky: "bg-sky.png",
  hudIp: "hud-ip.png",
  hudCoin: "hud-coin.png",
  hudChain: "hud-chain.png",
};

/** DOM HUD için tekil asset URL'i (aynı yol haritası). */
export function assetUrl(name: keyof DuseninAtlas): string {
  return new URL(`../assets/${FILES[name]}`, import.meta.url).href;
}

export async function loadAtlas(): Promise<DuseninAtlas> {
  const keys = Object.keys(FILES) as Array<keyof DuseninAtlas>;
  const textures = await Promise.all(
    keys.map((key) => Assets.load<Texture>(assetUrl(key))),
  );
  const atlas = {} as DuseninAtlas;
  keys.forEach((key, i) => {
    atlas[key] = textures[i]!;
  });
  return atlas;
}
