/**
 * module-lifecycle testleri — ortak yaşam döngüsü makinesi (tüm oyun modülleri).
 * Shapetris module-state.test.ts'ten taşındı (2026-11-07); kapsam aynı.
 */
import { describe, expect, test } from "bun:test";
import {
  GameModuleError,
  GameModuleErrorCategory,
  GameModuleState,
} from "@bulmacanya/shared";
import { ModuleLifecycle } from "./module-lifecycle";

describe("module-lifecycle (ortak)", () => {
  test("id taşınır", () => {
    expect(new ModuleLifecycle("game7").id).toBe("game7");
  });

  test("init öncesi start → NOT_INITIALIZED", async () => {
    const m = new ModuleLifecycle("game7");
    try {
      await m.start();
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GameModuleError);
      expect((error as GameModuleError).category).toBe(GameModuleErrorCategory.NotInitialized);
    }
  });

  test("çift init → WRONG_STATE", async () => {
    const m = new ModuleLifecycle("game7");
    await m.init();
    try {
      await m.init();
      expect.unreachable();
    } catch (error) {
      expect((error as GameModuleError).category).toBe(GameModuleErrorCategory.WrongState);
    }
  });

  test("durum makinesi: idle→initialized→running⇄paused→stopped", async () => {
    const m = new ModuleLifecycle("game7");
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
    const m = new ModuleLifecycle("game7");
    await m.init();
    expect(() => m.pause()).toThrow(GameModuleError);
    await m.start();
    expect(() => m.resume()).toThrow(GameModuleError);
  });

  test("exit sonrası event İLETİLMEZ", async () => {
    const m = new ModuleLifecycle("game7");
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
