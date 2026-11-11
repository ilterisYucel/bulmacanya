/**
 * hints testleri — UC-7/K17: ipucu geçerlilik kuralları ve rota hedefi.
 */
import { describe, expect, test } from "bun:test";
import { hintTarget, isHintValid } from "./hints";
import { createGame } from "./game";
import type { GameState } from "./types";

describe("isHintValid", () => {
  test("rota-goster her kademede oynanırken geçerli", () => {
    expect(isHintValid("dusenin-dostu.rota-goster", "playing", "kolay")).toBe(true);
    expect(isHintValid("dusenin-dostu.rota-goster", "playing", "zor")).toBe(true);
  });

  test("yavas-zaman Kolay'da YOK; Orta/Zor'da var", () => {
    expect(isHintValid("dusenin-dostu.yavas-zaman", "playing", "kolay")).toBe(false);
    expect(isHintValid("dusenin-dostu.yavas-zaman", "playing", "orta")).toBe(true);
    expect(isHintValid("dusenin-dostu.yavas-zaman", "playing", "zor")).toBe(true);
  });

  test("oyun bitti/zaferde ipucu reddedilir", () => {
    expect(isHintValid("dusenin-dostu.rota-goster", "gameover", "orta")).toBe(false);
    expect(isHintValid("dusenin-dostu.rota-goster", "victory", "orta")).toBe(false);
  });
});

describe("hintTarget", () => {
  function manual(over: Partial<GameState>): GameState {
    return {
      ...createGame({
        mode: "endless",
        difficulty: "orta",
        seed: 42,
        worldWidth: 80,
        worldHeight: 90,
      }),
      ...over,
    };
  }

  test("oyuncunun üstündeki en yakın katı kutuyu seçer", () => {
    const s = manual({
      player: { x: 20, y: 40 },
      bricks: [
        { id: 1, kind: "stone", x: 20, y: 60, used: false }, // altımda
        { id: 2, kind: "stone", x: 21, y: 30, used: false }, // en yakın üst
        { id: 3, kind: "stone", x: 22, y: 20, used: false },
      ],
    });
    expect(hintTarget(s)?.id).toBe(2);
  });

  test("kırıcı/coin/kullanılmış sandık hedef olmaz", () => {
    const s = manual({
      player: { x: 20, y: 40 },
      bricks: [
        { id: 1, kind: "breaker", x: 20, y: 35, used: false },
        { id: 2, kind: "coin", x: 20, y: 34, used: false },
        { id: 3, kind: "chest", x: 20, y: 33, used: true },
        { id: 4, kind: "stone", x: 20, y: 32, used: false },
      ],
    });
    expect(hintTarget(s)?.id).toBe(4);
  });

  test("hedef yoksa null", () => {
    const s = manual({ player: { x: 20, y: 10 }, bricks: [] });
    expect(hintTarget(s)).toBeNull();
  });
});
