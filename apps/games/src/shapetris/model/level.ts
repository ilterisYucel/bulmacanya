/**
 * level — Shapetris bölüm üretimi (UC-2, AK-2.2). SAF.
 *
 * Eski challange.js#loadLevel formülü BİREBİR (K5):
 * - 12×12'ye rastgele parça dolgusu: `max_tiles = min(144, 10 + levelNo)` deneme
 *   (her deneme: rastgele parça, 1-4 rastgele CW rotasyon, rastgele konum; çakışırsa atlanır).
 * - Sonra `tiles_to_remove = min(32, levelNo / 5)` kadar rastgele dolu hücre eksiltilir
 *   (aynı hücre iki kez seçilebilir — gerçek eksiltme ≤ ceil(range)).
 * - Hedef: iç 8×8 bölgenin bitmap yansıması.
 *
 * Edge cases:
 * - `levelNo = 0` → eksiltme yok (hedef saf dolgu).
 * - `levelNo` büyük → formül doyar (144 deneme / 32 eksiltme).
 * - RNG enjekte edilebilir (`rng(): number`, varsayılan Math.random) — test determinizmi.
 */

import { PIECES, rotateCW, type PieceMatrix } from "./pieces";

const BOARD_SIZE = 12;
const GOAL_SIZE = 8;
const PAD = 2;

/** Deterministik basit PRNG (test/seed için). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * String'den deterministik seed (xmur3 tarzı hash) — günlük/sonsuz modlar (K20).
 * Aynı string → aynı seed; farklı string → (pratikte) farklı seed.
 */
export function seedFromString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * Kampanya bölüm JSON'unu doğrular ve 8×8 boolean matrise çevirir (UC-11, AK-11.1).
 * 8×8 olmayan veya dizi olmayan girdi → Error (sessiz DEĞİL).
 */
export function parseLevel(json: unknown): boolean[][] {
  if (!Array.isArray(json) || json.length !== GOAL_SIZE) {
    throw new Error(`geçersiz bölüm: 8 satır bekleniyor (${Array.isArray(json) ? json.length : typeof json})`);
  }
  const goal: boolean[][] = [];
  for (const row of json) {
    if (!Array.isArray(row) || row.length !== GOAL_SIZE) {
      throw new Error("geçersiz bölüm: her satır 8 hücre olmalı");
    }
    goal.push(row.map((cell) => cell === 1 || cell === true));
  }
  return goal;
}

/** [begin, end] dahil tamsayı (eski `random(begin, end)`). */
function randInt(rng: () => number, begin: number, end: number): number {
  return Math.floor(rng() * (end + 1 - begin)) + begin;
}

export interface LevelResult {
  /** 8×8 hedef bitmap (true = yeşil hedef hücresi). */
  goal: boolean[][];
  /** Eksiltme öncesi dolu hücre sayısı. */
  filledCount: number;
  /** Gerçekten eksiltilen (distinct) hücre sayısı. */
  removedCount: number;
}

export function generateLevel(levelNo: number, rng: () => number = Math.random): LevelResult {
  const maxTiles = Math.min(144, 10 + levelNo);
  const tilesToRemove = Math.min(32, levelNo / 5);

  const tmp: number[][] = [];
  for (let j = 0; j < BOARD_SIZE; j++) {
    tmp.push(new Array<number>(BOARD_SIZE).fill(0));
  }

  for (let attempt = 0; attempt < maxTiles; attempt++) {
    let piece: PieceMatrix = PIECES[randInt(rng, 0, PIECES.length - 1)]!;
    const rotations = randInt(rng, 1, 4);
    for (let r = 0; r < rotations; r++) piece = rotateCW(piece);
    const x = randInt(rng, 0, BOARD_SIZE - 1);
    const y = randInt(rng, 0, BOARD_SIZE - 1);
    const h = piece.length;
    const w = piece[0]?.length ?? 0;
    if (x + w > BOARD_SIZE || y + h > BOARD_SIZE) continue;
    let overlap = false;
    for (let j = 0; j < h && !overlap; j++) {
      for (let i = 0; i < w; i++) {
        if (piece[j]![i] && tmp[y + j]![x + i]) {
          overlap = true;
          break;
        }
      }
    }
    if (overlap) continue;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (piece[j]![i]) tmp[y + j]![x + i] = 1;
      }
    }
  }

  const filled: Array<[number, number]> = [];
  for (let j = 0; j < BOARD_SIZE; j++) {
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (tmp[j]![i]) filled.push([j, i]);
    }
  }
  const filledCount = filled.length;
  const range = Math.min(filledCount, tilesToRemove);
  const removed = new Set<string>();
  for (let i = 0; i < range; i++) {
    const idx = randInt(rng, 0, filledCount - 1);
    const [j, i2] = filled[idx]!;
    if (tmp[j]![i2]) {
      tmp[j]![i2] = 0;
      removed.add(`${j},${i2}`);
    }
  }

  const goal: boolean[][] = [];
  for (let j = 0; j < GOAL_SIZE; j++) {
    goal.push([]);
    for (let i = 0; i < GOAL_SIZE; i++) {
      goal[j]!.push(tmp[PAD + j]![PAD + i] === 1);
    }
  }
  return { goal, filledCount, removedCount: removed.size };
}
