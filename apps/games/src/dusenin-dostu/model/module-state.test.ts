/**
 * module-state testleri — UC-1/AK-1.1-1.3: ORTAK yaşam döngüsü kontratı
 * (ModuleLifecycle re-export üzerinden).
 */
import { describe, expect, test } from "bun:test";
import { GameModuleErrorCategory, GameModuleState } from "@bulmacanya/shared";
import { ModuleLifecycle } from "./module-state";

describe("ModuleLifecycle", () => {
  test("id sabit", () => {
    expect(new ModuleLifecycle("dusenin-dostu").id).toBe("dusenin-dostu");
  });

  test("init öncesi start NOT_INITIALIZED fırlatır", async () => {
    const m = new ModuleLifecycle("dusenin-dostu");
    await expect(m.start()).rejects.toMatchObject({
      category: GameModuleErrorCategory.NotInitialized,
    });
  });

  test("çift init WRONG_STATE; exit sonrası event sessiz", async () => {
    const m = new ModuleLifecycle("dusenin-dostu");
    await m.init();
    await expect(m.init()).rejects.toMatchObject({
      category: GameModuleErrorCategory.WrongState,
    });
    await m.start();
    m.pause();
    expect(m.currentState).toBe(GameModuleState.Paused);
    m.resume();
    let received = 0;
    m.on("score", () => {
      received += 1;
    });
    m.emit("score", { score: 10 });
    expect(received).toBe(1);
    m.exit();
    m.emit("score", { score: 20 });
    expect(received).toBe(1);
  });
});
