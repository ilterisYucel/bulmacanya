/**
 * pieces — Shapetris parça seti (UC-3, AK-3.1).
 *
 * Eski game.js#possiblePieces / #pieceOrigins ile BİREBİR (K1).
 * Sıra: S, Z, O, I, T, J, L.
 *
 * Edge cases:
 * - `rotateCW`/`rotateCCW` dikdörtgen olmayan matrislerde de çalışır (boyut takası).
 * - Matrisler 0/1'dir; mutasyon YOKTUR — rotasyon yeni dizi döner.
 */

/** 0/1 doluluk matrisi (satır-majör). */
export type PieceMatrix = number[][];

/** Parça başına sprite çapa noktası (eski pieceOrigins). */
export interface PieceOrigin {
  x: number;
  y: number;
}

export const PIECES: PieceMatrix[] = [
  [[1, 1, 0], [0, 1, 1]], // 0: S
  [[0, 1, 1], [1, 1, 0]], // 1: Z
  [[1, 1], [1, 1]], // 2: O
  [[1, 1, 1, 1]], // 3: I
  [[0, 1, 0], [1, 1, 1]], // 4: T
  [[1, 0, 0], [1, 1, 1]], // 5: J
  [[0, 0, 1], [1, 1, 1]], // 6: L
];

export const PIECE_ORIGINS: PieceOrigin[] = [
  { x: 0.625, y: 0.5 },
  { x: 0.625, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 0.375 },
  { x: 0.625, y: 0.5 },
  { x: 0.625, y: 0.5 },
  { x: 0.625, y: 0.5 },
];

/** Saat yönünde 90° rotasyon (yeni matris). */
export function rotateCW(piece: PieceMatrix): PieceMatrix {
  const result: PieceMatrix = [];
  for (let i = 0; i < (piece[0]?.length ?? 0); i++) {
    result.push([]);
    for (let j = 0; j < piece.length; j++) {
      result[i]![j] = piece[piece.length - 1 - j]![i]!;
    }
  }
  return result;
}

/** Saat yönünün tersine 90° rotasyon (yeni matris). */
export function rotateCCW(piece: PieceMatrix): PieceMatrix {
  const result: PieceMatrix = [];
  for (let i = 0; i < (piece[0]?.length ?? 0); i++) {
    result.push([]);
    for (let j = 0; j < piece.length; j++) {
      result[i]![j] = piece[j]![piece[0]!.length - 1 - i]!;
    }
  }
  return result;
}
