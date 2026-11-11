// compose-tetromino — AI'ın ürettiği tek hücre dokusundan eski formattaki
// 500×500 tetromino token'larını (tile_0..6) programatik dizer.
//
// Grid yerleşimi eski game3-cordova dosyalarından piksel analiziyle çıkarıldı
// (4×4 hücre × 125px) — şekil/çapa kayması imkânsız.
//
// Kullanım:
//   bun tools/compose-tetromino.mjs <cell.png> <outDir>
// Örnek:
//   bun tools/compose-tetromino.mjs apps/games/src/shapetris/assets/tiles/cell.png apps/games/src/shapetris/assets/tiles
import path from "node:path";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

/** S, Z, O, I, T, J, L — eski token grid dolguları (piksel analizi). */
const CELLS = [
  [[0, 0, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 0]], // 0 S
  [[0, 0, 0, 0], [0, 0, 1, 1], [0, 1, 1, 0], [0, 0, 0, 0]], // 1 Z
  [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]], // 2 O
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // 3 I
  [[0, 0, 0, 0], [0, 0, 1, 0], [0, 1, 1, 1], [0, 0, 0, 0]], // 4 T
  [[0, 0, 0, 0], [0, 1, 0, 0], [0, 1, 1, 1], [0, 0, 0, 0]], // 5 J
  [[0, 0, 0, 0], [0, 0, 0, 1], [0, 1, 1, 1], [0, 0, 0, 0]], // 6 L
];

const CELL_PX = 125;
const CANVAS = 500;

const cellPath = process.argv[2] ?? "apps/games/src/shapetris/assets/tiles/cell.png";
const outDir = process.argv[3] ?? path.dirname(cellPath);

const cell = await sharp(cellPath)
  .resize(CELL_PX, CELL_PX, { fit: "fill" })
  .png()
  .toBuffer();

for (let t = 0; t < CELLS.length; t++) {
  const composites = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (CELLS[t][r][c] === 1) {
        composites.push({ input: cell, left: c * CELL_PX, top: r * CELL_PX });
      }
    }
  }
  const out = await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
  const file = path.join(outDir, `tile_${t}.png`);
  await writeFile(file, out);
  console.log(`[compose] ${path.relative(process.cwd(), file)}`);
}
console.log("[compose] tamamlandı");
