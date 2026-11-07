import { describe, expect, test } from "bun:test";
import { PIECES, PIECE_ORIGINS, rotateCCW, rotateCW } from "./pieces";

// AK-3.1: parça seti eski possiblePieces ile birebir
describe("shapetris pieces (AK-3.1)", () => {
  test("7 parça eski matrislerle birebir (S, Z, O, I, T, J, L sırası)", () => {
    expect(PIECES).toEqual([
      [[1, 1, 0], [0, 1, 1]], // S
      [[0, 1, 1], [1, 1, 0]], // Z
      [[1, 1], [1, 1]], // O
      [[1, 1, 1, 1]], // I
      [[0, 1, 0], [1, 1, 1]], // T
      [[1, 0, 0], [1, 1, 1]], // J
      [[0, 0, 1], [1, 1, 1]], // L
    ]);
  });

  test("çapalar eski pieceOrigins ile birebir", () => {
    expect(PIECE_ORIGINS).toEqual([
      { x: 0.625, y: 0.5 },
      { x: 0.625, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.375 },
      { x: 0.625, y: 0.5 },
      { x: 0.625, y: 0.5 },
      { x: 0.625, y: 0.5 },
    ]);
  });

  test("rotateCW: S parçası saat yönünde döner", () => {
    expect(rotateCW([[1, 1, 0], [0, 1, 1]])).toEqual([
      [0, 1],
      [1, 1],
      [1, 0],
    ]);
  });

  test("rotateCCW, rotateCW'nin tersidir (4 döngü = kendisi)", () => {
    const s = [[1, 1, 0], [0, 1, 1]];
    let p = s;
    for (let i = 0; i < 4; i++) p = rotateCW(p);
    expect(p).toEqual(s);
    let q = s;
    for (let i = 0; i < 4; i++) q = rotateCCW(q);
    expect(q).toEqual(s);
  });
});
