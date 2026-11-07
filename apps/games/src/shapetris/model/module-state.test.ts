import { describe, expect, test } from "bun:test";
import {
  GameModuleError,
  GameModuleErrorCategory,
  GameModuleState,
} from "@bulmacanya/shared";
import { ModuleLifecycle } from "./module-state";

describe("shapetris module-state (UC-1)", () => {
  test("AK-1.1: id taşınır", () => {
    expect(new ModuleLifecycle("shapetris").id).toBe("shapetris");
  });

  test("AK-1.2: init öncesi start → NOT_INITIALIZED", async () => {
    const m = new ModuleLifecycle("shapetris");
    try {
      await m.start();
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GameModuleError);
      expect((error as GameModuleError).category).toBe(GameModuleErrorCategory.NotInitialized);
    }
  });

  test("AK-1.2: çift init → WRONG_STATE", async () => {
    const m = new ModuleLifecycle("shapetris");
    await m.init();
    try {
      await m.init();
      expect.unreachable();
    } catch (error) {
      expect((error as GameModuleError).category).toBe(GameModuleErrorCategory.WrongState);
    }
  });

  test("durum makinesi: idle→initialized→running⇄paused→stopped", async () => {
    const m = new ModuleLifecycle("shapetris");
    expect(m.currentState).toBe(GameModuleState.Idle);
    await m.init();
    expect(m.currentState).toBe(GameModuleState.Initialized);
    await m.start();
    expect(m.currentState).toBe(GameModuleState.Running);
    m.pause();
    expect(m.currentState).toBe(GameModuleState.Paused);
    m.resume();
    expect(m.currentState).toBe(GameModuleState.Running);
    m.exit();
    expect(m.currentState).toBe(GameModuleState.Stopped);
  });

  test("pause/resume yanlış durumda WRONG_STATE", async () => {
    const m = new ModuleLifecycle("shapetris");
    await m.init();
    expect(() => m.pause()).toThrow(GameModuleError);
    await m.start();
    expect(() => m.resume()).toThrow(GameModuleError);
  });

  test("AK-1.3: exit sonrası event İLETİLMEZ", async () => {
    const m = new ModuleLifecycle("shapetris");
    await m.init();
    const seen: number[] = [];
    const unsub = m.on("score", (payload) => seen.push(payload.score));
    m.emit("score", { score: 5 });
    expect(seen).toEqual([5]);
    unsub();
    m.emit("score", { score: 6 });
    expect(seen).toEqual([5]);
    m.on("score", (payload) => seen.push(payload.score));
    m.exit();
    m.emit("score", { score: 7 });
    expect(seen).toEqual([5]);
  });
});
