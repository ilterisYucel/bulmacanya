// Sprite üretim teması: SHAPETRIS / TetroVizyon.
//
// Eski game3-cordova formatı BİREBİR korunur (dosya adları + boyutlar):
//   assets/tiles/{red,green,blue}_{on,off}.png — 243×244 tam kare karo
//   assets/tiles/tile_0..6.png — 500×500 tetromino token'ı (4×4 hücre grid'i)
//
// `cell` tek hücre dokusudur; token'lar `tools/compose-tetromino.mjs` ile
// eski grid yerleşimine programatik dizilir (AI şekil kaydırması imkânsız).
//
// Kullanım:
//   FAL_KEY=... bun run sprites shapetris red_on red_off green_on green_off blue_on blue_off cell
//   bun tools/compose-tetromino.mjs apps/games/src/shapetris/assets/tiles/cell.png apps/games/src/shapetris/assets/tiles

export const OUT_DIR = "apps/games/src/shapetris/assets/tiles";

export const BASE_PROMPT =
  "Game sprite for a cozy 2D puzzle game: flat front view, thick smooth dark outlines, soft cel shading, " +
  "centered, filling the whole frame edge-to-edge. No text, no watermark, no logo, no border decoration, " +
  "no scenery, no shadow. Clean vector-like edges suitable for a sprite atlas.";

export const BG_BASE_PROMPT =
  "Fully painted 2D mobile game background: edge-to-edge illustration, no border, no frame, no text.";

// full: true → kırpma/şeffaflık yok; görsel karo boyutuna cover-resize edilir.
export const ELEMENTS = {
  red_on: {
    full: true,
    out: "red_on.png",
    describe:
      "a PERFECTLY SQUARE game board tile with sharp 90-degree corners, absolutely NO rounded corners, filling the whole frame edge-to-edge: bright saturated candy-red enamel, " +
      "thin dark outline near the edges, subtle glossy highlight on top, flat 2D",
  },
  red_off: {
    full: true,
    out: "red_off.png",
    describe:
      "a PERFECTLY SQUARE game board tile with sharp 90-degree corners, absolutely NO rounded corners, filling the whole frame edge-to-edge: deep muted dark-red (off state), " +
      "thin dark outline near the edges, flat 2D, same shape as the on state",
  },
  green_on: {
    full: true,
    out: "green_on.png",
    describe:
      "a PERFECTLY SQUARE game board tile with sharp 90-degree corners, absolutely NO rounded corners, filling the whole frame edge-to-edge: bright saturated leaf-green enamel, " +
      "thin dark outline near the edges, subtle glossy highlight on top, flat 2D",
  },
  green_off: {
    full: true,
    out: "green_off.png",
    describe:
      "a PERFECTLY SQUARE game board tile with sharp 90-degree corners, absolutely NO rounded corners, filling the whole frame edge-to-edge: deep muted dark-green (off state), " +
      "thin dark outline near the edges, flat 2D, same shape as the on state",
  },
  blue_on: {
    full: true,
    out: "blue_on.png",
    describe:
      "a PERFECTLY SQUARE game board tile with sharp 90-degree corners, absolutely NO rounded corners, filling the whole frame edge-to-edge: bright saturated royal-blue enamel, " +
      "thin dark outline near the edges, subtle glossy highlight on top, flat 2D",
  },
  blue_off: {
    full: true,
    out: "blue_off.png",
    describe:
      "a PERFECTLY SQUARE game board tile with sharp 90-degree corners, absolutely NO rounded corners, filling the whole frame edge-to-edge: deep muted dark-blue (off state), " +
      "thin dark outline near the edges, flat 2D, same shape as the on state",
  },
  cell: {
    out: "cell.png",
    describe:
      "a single small square glass token tile used inside a tetromino piece: pale ice-blue translucent " +
      "glass with a diagonal shiny streak and a thin light-gray border, flat 2D",
  },
  background: {
    bg: true,
    out: "bg.png",
    describe:
      "a calm vertical mobile puzzle game background: deep navy-indigo gradient, soft glowing bokeh dust " +
      "particles, faint geometric pattern in the corners, subtle vignette, empty uncluttered center area " +
      "for gameplay, NO text, NO characters, NO objects",
  },
  pedestal: {
    out: "pedestal.png",
    brightness: 0.35,
    tint: "#33436b",
    describe:
      "a wide display shelf made of TRANSPARENT GLASS like a clean aquarium ledge: frosted translucent " +
      "pale-blue glass slab with bright edge highlights and subtle reflections, mostly see-through, " +
      "flat 2D cartoon, thin dark outline only at the edges, centered, empty top, no objects on it",
  },
};
