import { describe, expect, test } from "bun:test";
import { GameModuleError, GameModuleState } from "@bulmacanya/shared";
import { MockGame } from "../src/features/mock-game";

describe("kontrat sözleşmesi — yaşam döngüsü (JSDoc aşama 2)", () => {
  test("init iki kez → WRONG_STATE", async () => {
    const game = new MockGame();
    await game.init();
    await expect(game.init()).rejects.toThrow(GameModuleError);
  });

  test("init öncesi start → NOT_INITIALIZED", async () => {
    const game = new MockGame();
    await expect(game.start()).rejects.toThrow(GameModuleError);
  });

  test("init → start → pause → resume akışı geçerli", async () => {
    const game = new MockGame();
    await game.init();
    await game.start();
    game.pause();
    game.resume();
    expect(game.currentState).toBe(GameModuleState.Running);
  });

  test("exit sonrası event İLETİLMEZ", async () => {
    const game = new MockGame();
    await game.init();
    await game.start();
    let delivered = 0;
    game.on("score", () => {
      delivered += 1;
    });
    game.emit("score", { score: 10 });
    expect(delivered).toBe(1);
    game.exit();
    game.emit("score", { score: 20 });
    expect(delivered).toBe(1);
    expect(game.currentState).toBe(GameModuleState.Stopped);
  });
});
