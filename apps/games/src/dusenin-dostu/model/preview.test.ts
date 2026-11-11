/**
 * preview testleri — UC-3/SC-4: iniş önizlemesi, atış reddi nedenleri.
 */
import { describe, expect, test } from "bun:test";
import { attachRejection, previewLanding } from "./preview";
import { createGame } from "./game";
import type { GameState } from "./types";

const OPTS = {
  mode: "endless" as const,
  difficulty: "orta" as const,
  seed: 42,
  worldWidth: 80,
  worldHeight: 160,
};

function manual(over: Partial<GameState>): GameState {
  return { ...createGame(OPTS), ...over };
}

describe("previewLanding", () => {
  test("düşen oyuncu için yay + iniş noktası üretir", () => {
    const s = manual({
      player: { x: 20, y: 20 },
      velocity: { x: 0, y: 5 },
      bricks: [{ id: 1, kind: "stone", x: 20, y: 30, used: false }],
    });
    const p = previewLanding(s);
    expect(p.points.length).toBeGreaterThan(3);
    expect(p.landing).not.toBeNull();
    expect(p.landingBrickId).toBe(1);
    expect(p.landing!.y).toBeLessThan(30);
  });

  test("kutu yoksa iniş null, yay yine çizilir", () => {
    const s = manual({
      player: { x: 20, y: 20 },
      velocity: { x: 0, y: 5 },
      bricks: [],
    });
    const p = previewLanding(s);
    expect(p.points.length).toBeGreaterThan(0);
    expect(p.landing).toBeNull();
  });
});

describe("attachRejection", () => {
  test("menzil dışı → range", () => {
    const s = manual({
      player: { x: 0, y: 0 },
      bricks: [{ id: 1, kind: "stone", x: 40, y: -20, used: false }],
    });
    expect(attachRejection(s, 1)).toBe("range");
  });

  test("ip yoksa → no-rope", () => {
    const s = manual({
      player: { x: 20, y: 20 },
      ropesLeft: 0,
      bricks: [{ id: 1, kind: "stone", x: 20, y: 26, used: false }],
    });
    expect(attachRejection(s, 1)).toBe("no-rope");
  });

  test("kırıcı/coin/sandık hedef → invalid-target", () => {
    const s = manual({
      player: { x: 20, y: 20 },
      bricks: [
        { id: 1, kind: "breaker", x: 20, y: 26, used: false },
        { id: 2, kind: "coin", x: 22, y: 24, used: false },
        { id: 3, kind: "chest", x: 18, y: 24, used: false },
      ],
    });
    expect(attachRejection(s, 1)).toBe("invalid-target");
    expect(attachRejection(s, 2)).toBe("invalid-target");
    expect(attachRejection(s, 3)).toBe("invalid-target");
  });

  test("yol üzerinde taş varsa → immediate-break (ip her katıya değer)", () => {
    const s = manual({
      player: { x: 20, y: 20 },
      bricks: [
        { id: 1, kind: "stone", x: 20, y: 25, used: false },
        { id: 2, kind: "stone", x: 20, y: 22.5, used: false },
      ],
    });
    expect(attachRejection(s, 1)).toBe("immediate-break");
  });

  test("yol üzerinde kırıcı varsa → immediate-break", () => {
    const s = manual({
      player: { x: 20, y: 20 },
      bricks: [
        { id: 1, kind: "stone", x: 20, y: 25, used: false },
        { id: 2, kind: "breaker", x: 20, y: 22.5, used: false },
      ],
    });
    expect(attachRejection(s, 1)).toBe("immediate-break");
  });

  test("geçerli atış → null", () => {
    const s = manual({
      player: { x: 20, y: 20 },
      bricks: [{ id: 1, kind: "stone", x: 22, y: 25, used: false }],
    });
    expect(attachRejection(s, 1)).toBeNull();
  });
});
