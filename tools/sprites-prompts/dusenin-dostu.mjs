// Sprite üretim teması: DÜŞENİN-DOSTU (DUSENIN-DOSTU-SPEC K15/K16, T-20).
//
// tools/generate-sprite.mjs bu dosyayı yükler; çıktı doğrudan oyunun assets/
// klasörüne yazılır. Model: fal-ai/nano-banana (2026-11-10 — recraft-v3
// prop'lara sahne/çimen ve yüz ekliyordu; nano-banana kompozisyona uyuyor).
//
// Stil kiti: sevimli çizgi film, kalın sıcak kontur, soft cel shading.
// Orijinal js13k grafikleri KULLANILMAZ (renkli kare + Path2D okları).
//
// Palet (prompt'larda renk adıyla geçer):
//   kahraman sarısı #F6D24A · atkı kırmızısı #D94F4F · taş grisi #7A6A5A
//   rotor mavisi #4A7BD9 · rotor yeşili #4AC07A · kırıcı moru #8A4A9C
//   coin altını #F2B632 · mağara koyusu #2E2438 · gökyüzü #BFE3F2

export const OUT_DIR = "apps/games/src/dusenin-dostu/assets";

export const BASE_PROMPT =
  "Game sprite for a cozy 2D mobile puzzle game, thick dark-brown outlines, soft cel shading, " +
  "warm palette. Single isolated object, centered, on a plain solid WHITE background, " +
  "NO shadow, NO floor, NO grass, NO base, NO scenery. No text, no watermark, no border. " +
  "Clean edges suitable for a sprite atlas.";

export const BG_BASE_PROMPT =
  "Fully painted 2D mobile game background: edge-to-edge illustration, no border, no frame, " +
  "no text, no watermark. Soft painterly shading, cozy cartoon style, calm uncluttered center for gameplay.";

// Element → prompt açıklaması. bg: true → arka plan silme + kırpma atlanır.
// character: true → yüz/karakter özellikleri serbest (yalnız kahraman).
// NOT: nano-banana "lifeless object — no face, no eyes, no character" kalıbına uyuyor;
// nesne tanımlarında bu kalıp korunmalı (2026-11-10 testi).
export const ELEMENTS = {
  "player-idle": {
    character: true,
    describe:
      "the hero: a small cute flat yellow cube character with rounded corners, two big black dot eyes, " +
      "a cheerful smile, tiny arms and legs, wearing a short red scarf fluttering to one side, standing idle",
  },
  "player-swing": {
    character: true,
    describe:
      "the same small cute flat yellow cube hero with a red scarf, hanging pose: both tiny arms raised " +
      "gripping an invisible rope above the head, legs dangling, scarf fluttering upward. " +
      "NO rope in the image — only the character",
  },
  brick: {
    describe:
      "a single square stone block: gray-brown stone masonry with chipped rounded corners and a few cracks. " +
      "It is a lifeless rock — no face, no eyes, no character",
  },
  "rotor-cw": {
    describe:
      "a square stone block with a dark metal winch gear plate on its front face and a bold curved " +
      "CLOCKWISE rotation arrow on the gear. It is a lifeless object — no face, no eyes, no character",
  },
  "rotor-ccw": {
    describe:
      "a square stone block with a dark metal winch gear plate on its front face and a bold curved " +
      "COUNTERCLOCKWISE rotation arrow on the gear. It is a lifeless object — no face, no eyes, no character",
  },
  breaker: {
    describe:
      "a square dark basalt block covered with sharp purple crystal spikes pointing outward, a dangerous trap. " +
      "It is a lifeless object — no face, no eyes, no character",
  },
  chest: {
    describe:
      "a small closed wooden treasure chest with brass bands and a tiny lock, rewarding look. " +
      "It is a lifeless object — no face, no eyes, no character",
  },
  coin: {
    describe:
      "a single round gold coin seen face-on with a simple embossed star and a soft highlight. " +
      "It is a lifeless object — no face, no eyes, no character",
  },
  hook: {
    describe:
      "a small dark metal grappling hook with three curved prongs and a ring at the top. " +
      "It is a lifeless object — no face, no eyes, no character, no rope",
  },
  rope: {
    describe:
      "a short horizontal rope segment of braided tan fibers, uniform thickness, perfectly horizontal, " +
      "seamless left and right edges so it can be tiled. It is a lifeless object — no face, no character, " +
      "no hooks, no scenery",
  },
  "bg-cave": {
    bg: true,
    describe:
      "a dark underground cave: rough violet-gray stone walls on the left and right sides, mossy rock ledges, " +
      "faint warm lantern glow near the bottom, calm empty middle area, soft vignette, vertical composition, " +
      "NO characters, NO text",
  },
  "bg-mid": {
    bg: true,
    describe:
      "a sunset sky seen from a crumbling stone tower: warm orange-pink gradient, soft layered clouds, " +
      "distant mountain silhouettes at the bottom, calm empty middle area, NO characters, NO text",
  },
  "bg-sky": {
    bg: true,
    describe:
      "ONLY the sky: soft blue gradient from horizon to zenith, fluffy white clouds, faint sun glow in one " +
      "corner. NO ground, NO trees, NO hills, NO landscape, NO horizon line — pure sky only, " +
      "calm empty middle area, NO characters, NO text",
  },
  "hud-ip": {
    describe:
      "a small coiled rope icon, wooden-brown rope loop, simple clean game HUD icon. " +
      "It is a lifeless object — no face, no character",
  },
  "hud-coin": {
    describe:
      "a small gold coin icon with an embossed star, simple clean game HUD icon. " +
      "It is a lifeless object — no face, no character",
  },
  "hud-chain": {
    describe:
      "two interlocking metal chain links icon, simple clean game HUD icon. " +
      "It is a lifeless object — no face, no character",
  },
};
