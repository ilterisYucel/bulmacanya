// Sprite üretim spesifikasyonları — generate-sprite.mjs normalizasyonunda kullanılır.
//
// - canvas: nihai PNG boyutu (Pixi texture boyutu; tüm frame'ler aynı canvas'a oturur)
// - margin: içerik bbox'ına eklenen şeffaf boşluk (px)
// - bg: true → arka plan silme ve bbox kırpma YOK (full-bleed arka plan katmanı)
//
// Player kareleri aynı canvas'ta: idle ↔ swing geçişinde sprite kaymaz.
export const SPRITE_SPECS = {
  "player-idle": { canvas: { width: 128, height: 128 }, margin: 8 },
  "player-swing": { canvas: { width: 128, height: 128 }, margin: 8 },
  brick: { canvas: { width: 96, height: 96 }, margin: 6 },
  "rotor-cw": { canvas: { width: 96, height: 96 }, margin: 6 },
  "rotor-ccw": { canvas: { width: 96, height: 96 }, margin: 6 },
  breaker: { canvas: { width: 96, height: 96 }, margin: 6 },
  chest: { canvas: { width: 96, height: 96 }, margin: 6 },
  coin: { canvas: { width: 64, height: 64 }, margin: 4 },
  hook: { canvas: { width: 64, height: 64 }, margin: 4 },
  // 64×16 — dikey/yatay tiling için ince bant; ip sprite'ı gerilerek çizilir
  rope: { canvas: { width: 64, height: 16 }, margin: 2 },
  "bg-cave": { canvas: { width: 1024, height: 1024 }, bg: true },
  "bg-mid": { canvas: { width: 1024, height: 1024 }, bg: true },
  "bg-sky": { canvas: { width: 1024, height: 1024 }, bg: true },
  "hud-ip": { canvas: { width: 48, height: 48 }, margin: 3 },
  "hud-coin": { canvas: { width: 48, height: 48 }, margin: 3 },
  "hud-chain": { canvas: { width: 48, height: 48 }, margin: 3 },

  // --- shapetris (Tetrovizyon) — eski game3-cordova formatı BİREBİR ---
  // Karolar 243×244 (tam kare dolgu; full-bleed), token hücresi 256×256.
  red_on: { canvas: { width: 243, height: 244 } },
  red_off: { canvas: { width: 243, height: 244 } },
  green_on: { canvas: { width: 243, height: 244 } },
  green_off: { canvas: { width: 243, height: 244 } },
  blue_on: { canvas: { width: 243, height: 244 } },
  blue_off: { canvas: { width: 243, height: 244 } },
  cell: { canvas: { width: 256, height: 256 }, margin: 4 },
  // Sahne dekoru (2026-11-11): arka plan + kaide + tahta çerçevesi
  background: { canvas: { width: 1024, height: 1024 } },
  pedestal: { canvas: { width: 512, height: 160 }, margin: 6 },
};
