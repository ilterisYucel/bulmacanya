import { describe, expect, test } from "bun:test";
import {
  BOARD_PAD,
  BOARD_SIZE,
  applyPiece,
  canPlace,
  checkVictory,
  cleanRowsCols,
  clearBorder,
  clearCell,
  createBoard,
} from "./board";

const GOAL = [
  [1, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

function freshBoard() {
  return createBoard(GOAL.map((r) => r.map((v) => v === 1)));
}

describe("shapetris board (UC-2/UC-4)", () => {
  test("AK-2.1: 12×12 tahta, 2 hücre mavi kenar, iç bölge hedef/engel", () => {
    const board = freshBoard();
    expect(board.length).toBe(BOARD_SIZE);
    expect(board.every((row) => row.length === BOARD_SIZE)).toBe(true);
    for (let j = 0; j < BOARD_SIZE; j++) {
      for (let i = 0; i < BOARD_SIZE; i++) {
        const border =
          i < BOARD_PAD || i >= BOARD_SIZE - BOARD_PAD || j < BOARD_PAD || j >= BOARD_SIZE - BOARD_PAD;
        if (border) {
          expect(board[j]?.[i]?.kind).toBe("blue");
        } else {
          const goal = GOAL[j - BOARD_PAD]?.[i - BOARD_PAD] === 1;
          expect(board[j]?.[i]?.kind).toBe(goal ? "green" : "red");
        }
        expect(board[j]?.[i]?.filled).toBe(false);
      }
    }
  });

  test("AK-4.4: mavi (serbest) hücreye yerleştirme kabul edilir", () => {
    const board = freshBoard();
    const ok = applyPiece(board, 0, 0, [[1]]);
    expect(ok).toBe(true);
    expect(board[0]?.[0]?.filled).toBe(true);
  });

  test("S11: kırmızı hücreye yerleştirme KABUL (eski davranış)", () => {
    const board = freshBoard();
    // (4,2) iç bölge — GOAL[0][2]=0 → kırmızı
    const ok = applyPiece(board, 4, 2, [[1]]);
    expect(ok).toBe(true);
    expect(board[2]?.[4]?.filled).toBe(true);
  });

  test("S11: zafer için kırmızılar BOŞ olmalı — doldur + satır temizle + zafer", () => {
    const board = freshBoard();
    // yeşilleri doldur (GOAL: 2×2'lik sol üst blok)
    for (let j = BOARD_PAD; j < BOARD_SIZE - BOARD_PAD; j++) {
      for (let i = BOARD_PAD; i < BOARD_SIZE - BOARD_PAD; i++) {
        if (board[j]?.[i]?.kind === "green") applyPiece(board, i, j, [[1]]);
      }
    }
    expect(checkVictory(board)).toBe(true);
    // kırmızıya taşır → zafer bozulur (4. satır yalnız kırmızı içerir — yeşil yok)
    applyPiece(board, 4, 4, [[1]]);
    expect(checkVictory(board)).toBe(false);
    // 4. satırı tamamla → silinir → kırmızı boşalır → zafer geri gelir
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (!(board[4]?.[i]?.filled)) applyPiece(board, i, 4, [[1]]);
    }
    cleanRowsCols(board);
    expect(board[4]?.[4]?.filled).toBe(false);
    expect(checkVictory(board)).toBe(true);
  });

  test("canPlace: kontrol tahtayı DEĞİŞTİRMEZ (ghost önizleme sözleşmesi)", () => {
    const board = freshBoard();
    expect(canPlace(board, 4, 2, [[1]])).toBe(true); // kırmızı — S11 serbest
    expect(canPlace(board, 0, 0, [[1]])).toBe(true); // mavi
    expect(canPlace(board, 0, 0, [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]])).toBe(false); // taşma
    expect(board.flat().every((c) => !c.filled)).toBe(true);
  });

  test("AK-4.1: dolu hücre ile çakışma RED", () => {
    const board = freshBoard();
    expect(applyPiece(board, 0, 0, [[1]])).toBe(true);
    expect(applyPiece(board, 0, 0, [[1]])).toBe(false);
  });

  test("AK-4.1: sınır dışı yerleştirme RED", () => {
    const board = freshBoard();
    expect(applyPiece(board, 11, 0, [[1, 1]])).toBe(false);
    expect(applyPiece(board, -1, 0, [[1]])).toBe(false);
    expect(applyPiece(board, 0, 11, [[1], [1]])).toBe(false);
  });

  test("AK-4.3: tam dolu satır silinir", () => {
    const board = freshBoard();
    // 0. satırı (mavi) doldur
    for (let i = 0; i < BOARD_SIZE; i++) applyPiece(board, i, 0, [[1]]);
    const result = cleanRowsCols(board);
    expect(result.rows).toEqual([0]);
    expect(result.cols).toEqual([]);
    expect(board[0]?.every((c) => !c.filled)).toBe(true);
  });

  test("AK-4.3: tam dolu sütun silinir", () => {
    const board = freshBoard();
    for (let j = 0; j < BOARD_SIZE; j++) applyPiece(board, 0, j, [[1]]);
    const result = cleanRowsCols(board);
    expect(result.cols).toEqual([0]);
    expect(result.rows).toEqual([]);
    expect(board.every((row) => !(row[0]?.filled))).toBe(true);
  });

  test("AK-4.3: satır+sütun kesişimi bir kez boşalır", () => {
    const board = freshBoard();
    // 0. satır ve 0. sütun (mavi — doldurulabilir); kesişim (0,0)
    for (let i = 0; i < BOARD_SIZE; i++) {
      applyPiece(board, i, 0, [[1]]);
      applyPiece(board, 0, i, [[1]]);
    }
    const result = cleanRowsCols(board);
    expect(result.rows).toEqual([0]);
    expect(result.cols).toEqual([0]);
    expect(board[0]?.[0]?.filled).toBe(false);
    expect(board.flat().filter((c) => c.filled).length).toBe(0);
  });

  test("AK-5.1: tüm yeşiller dolunca zafer", () => {
    const board = freshBoard();
    expect(checkVictory(board)).toBe(false);
    for (let j = BOARD_PAD; j < BOARD_SIZE - BOARD_PAD; j++) {
      for (let i = BOARD_PAD; i < BOARD_SIZE - BOARD_PAD; i++) {
        if (board[j]?.[i]?.kind === "green") applyPiece(board, i, j, [[1]]);
      }
    }
    expect(checkVictory(board)).toBe(true);
  });

  test("AK-6.1: kenar-temizle yalnız mavi halkayı boşaltır", () => {
    const board = freshBoard();
    applyPiece(board, 0, 0, [[1]]); // mavi
    applyPiece(board, BOARD_PAD, BOARD_PAD, [[1]]); // iç (yeşil)
    const changed = clearBorder(board);
    expect(changed).toBe(true);
    expect(board[0]?.[0]?.filled).toBe(false);
    expect(board[BOARD_PAD]?.[BOARD_PAD]?.filled).toBe(true);
    expect(clearBorder(board)).toBe(false);
  });

  test("AK-6.2: hücre-sil dolu hücreyi boşaltır, boşta no-op", () => {
    const board = freshBoard();
    expect(clearCell(board, 0, 0)).toBe(false);
    applyPiece(board, 0, 0, [[1]]);
    expect(clearCell(board, 0, 0)).toBe(true);
    expect(board[0]?.[0]?.filled).toBe(false);
  });
});
