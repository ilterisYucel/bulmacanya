/**
 * atlas — game7 grafik kaynakları (UC-6, K33). PIXI katmanı.
 *
 * - 29 TR harf balonu + 3 arka plan (mod başına — bg-0/1/2, 2026-11-07
 *   K33 sapması: tek arka plan + tint yerine 3 ayrı görsel).
 * - Yollar TEK kaynak (Purity 4); kullanıcı yeni grafik çizerse yalnız
 *   assets/ klasöründeki dosyalar değişir, kod aynı kalır (shapetris S10 ruhu).
 */
import { Assets, Texture } from "pixi.js";
import type { Game7Mode } from "../model/words";
import { TR_ALPHABET } from "../model/words";

export interface Game7Atlas {
  balloons: Map<string, Texture>;
  backgrounds: Record<Game7Mode, Texture>;
  /** boş slot göstergesi — soru işareti balonu (2026-11-07) */
  question: Texture;
}

const url = (name: string): string =>
  new URL(`../assets/${name}`, import.meta.url).href;

const BG_BY_MODE: Record<Game7Mode, string> = {
  klasik: "bg-0.jpeg",
  dedektif: "bg-1.jpeg",
  sabit: "bg-2.jpeg",
};

export async function loadAtlas(): Promise<Game7Atlas> {
  const letters = [...TR_ALPHABET].map((l) => `${l}.png`);
  const textures = await Promise.all(
    [...letters, "bg-0.jpeg", "bg-1.jpeg", "bg-2.jpeg", "question.png"].map((name) =>
      Assets.load<Texture>(url(name)),
    ),
  );
  const balloons = new Map<string, Texture>();
  letters.forEach((name, i) => {
    balloons.set(name.slice(0, -4), textures[i]!);
  });
  const [bg0, bg1, bg2, question] = textures.slice(letters.length);
  return {
    balloons,
    backgrounds: {
      klasik: bg0!,
      dedektif: bg1!,
      sabit: bg2!,
    },
    question: question!,
  };
}

export { BG_BY_MODE };
