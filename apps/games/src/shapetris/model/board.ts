/**
 * board — Shapetris tahta modeli (UC-2, UC-4, UC-6). SAF — Pixi/DOM yasağı (SC-1).
 *
 * Tahta 12×12; dış 2 hücrelik halka mavi (serbest bölge, K4), iç 8×8 hedef alanı:
 * yeşil = doldurulacak hedef hücre (K5), kırmızı = YASAKLI hücre (K3).
 *
 * Hata/edge durumları:
 * - `applyPiece` sınır dışı, dolu çakışması veya KIRMIZI temasında false döner; tahta DEĞİŞMEZ.
 * - `cleanRowsCols` tam dolu satır VE sütunları boşaltır; kesişim hücresi bir kez işlenir.
 * - `checkVictory` yalnız yeşil hücrelerin tamamının dolu olmasına bakar (kırmızı zaten boş).
 * - `clearBorder`/`clearCell` yalnız dolu hücreyi boşaltır; değişiklik olduysa true döner.
 */

import type { PieceMatrix } from "./pieces";

export const BOARD_SIZE = 12;
export const BOARD_PAD = 2;
export const GOAL_SIZE = BOARD_SIZE - 2 * BOARD_PAD; // 8

/** Hücre türü: mavi serbest, kırmızı yasaklı, yeşil hedef. */
export type CellKind = "blue" | "red" | "green";

export interface Cell {
  kind: CellKind;
  filled: boolean;
}

/** 12×12 satır-majör hücre matrisi. */
export type Board = Cell[][];

/** 8×8 hedef bitmap'inden tahta üretir: kenar mavi, hedef yeşil, kalan kırmızı. */
export function createBoard(goal: boolean[][]): Board {
  const board: Board = [];
  for (let j = 0; j < BOARD_SIZE; j++) {
    board.push([]);
    for (let i = 0; i < BOARD_SIZE; i++) {
      const border =
        i < BOARD_PAD || i >= BOARD_SIZE - BOARD_PAD || j < BOARD_PAD || j >= BOARD_SIZE - BOARD_PAD;
      const kind: CellKind = border
        ? "blue"
        : (goal[j - BOARD_PAD]?.[i - BOARD_PAD] ? "green" : "red");
      board[j]!.push({ kind, filled: false });
    }
  }
  return board;
}

/**
 * Parçanın (x, y) sol-üst köşesine yerleşip yerleşemeyeceğini kontrol eder:
 * sınır dışı / dolu çakışması → false. Tahtayı DEĞİŞTİRMEZ.
 * S11 (2026-11-05): kırmızı hücreye yerleştirme SERBESTTİR (eski davranış);
 * kırmızının boşaltılması zafer koşulunun işidir (checkVictory).
 */
export function canPlace(board: Board, x: number, y: number, piece: PieceMatrix): boolean {
  const h = piece.length;
  const w = piece[0]?.length ?? 0;
  if (w === 0 || x < 0 || y < 0 || x + w > BOARD_SIZE || y + h > BOARD_SIZE) return false;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (!piece[j]![i]) continue;
      const cell = board[y + j]?.[x + i];
      if (!cell || cell.filled) return false;
    }
  }
  return true;
}

/**
 * Parçayı (x, y) sol-üst köşesine yerleştirmeyi dener.
 * Başarısızsa (canPlace false) tahta DEĞİŞMEZ.
 */
export function applyPiece(board: Board, x: number, y: number, piece: PieceMatrix): boolean {
  if (!canPlace(board, x, y, piece)) return false;
  const h = piece.length;
  const w = piece[0]?.length ?? 0;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (piece[j]![i]) board[y + j]![x + i]!.filled = true;
    }
  }
  return true;
}

/** Tam dolu satır ve sütunları boşaltır; silinen indeksleri döner. */
export function cleanRowsCols(board: Board): { rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let j = 0; j < BOARD_SIZE; j++) {
    if (board[j]!.every((c) => c.filled)) rows.push(j);
  }
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (board.every((row) => row[i]!.filled)) cols.push(i);
  }
  for (const j of rows) {
    for (let i = 0; i < BOARD_SIZE; i++) board[j]![i]!.filled = false;
  }
  for (const i of cols) {
    for (let j = 0; j < BOARD_SIZE; j++) board[j]![i]!.filled = false;
  }
  return { rows, cols };
}

/**
 * Zafer: tüm yeşil hücreler dolu VE tüm kırmızı hücreler boş (eski birebir).
 * Kırmızıya yerleştirilen parçalar satır/sütun temizlemeyle boşaltılır (S11).
 */
export function checkVictory(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (cell.kind === "green" && !cell.filled) return false;
      if (cell.kind === "red" && cell.filled) return false;
    }
  }
  return true;
}

/** İpucu: mavi halkadaki tüm dolu hücreleri boşaltır; değişiklik olduysa true. */
export function clearBorder(board: Board): boolean {
  let changed = false;
  for (let j = 0; j < BOARD_SIZE; j++) {
    for (let i = 0; i < BOARD_SIZE; i++) {
      const border =
        i < BOARD_PAD || i >= BOARD_SIZE - BOARD_PAD || j < BOARD_PAD || j >= BOARD_SIZE - BOARD_PAD;
      const cell = board[j]![i]!;
      if (border && cell.filled) {
        cell.filled = false;
        changed = true;
      }
    }
  }
  return changed;
}

/** İpucu: tek dolu hücreyi boşaltır; değişiklik olduysa true. */
export function clearCell(board: Board, x: number, y: number): boolean {
  const cell = board[y]?.[x];
  if (!cell || !cell.filled) return false;
  cell.filled = false;
  return true;
}
