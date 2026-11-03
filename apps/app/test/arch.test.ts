import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { GameModuleError, GameModuleErrorCategory } from "@bulmacanya/shared";
import { loadGame, registerGame } from "../src/features/game-shell";

const SHELL_DIR = join(import.meta.dir, "..", "src", "features", "game-shell");

function shellSources(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".ts")) out.push(full);
    }
  };
  walk(SHELL_DIR);
  return out;
}

describe("UC-4 — oyun kabuğu sözleşmesi", () => {
  test("AK-4.1: shell oyun-spesifik/yabancı import İÇERMEZ (yalnız relative + shared)", () => {
    const violations: string[] = [];
    for (const file of shellSources()) {
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1];
        if (spec === undefined) continue;
        if (spec.startsWith(".") || spec === "@bulmacanya/shared") continue;
        violations.push(`${file} → ${spec}`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("AK-4.2: kayıtlı modül dinamik import ile lazy yüklenir", async () => {
    registerGame("mock", async () => {
      const { MockGame } = await import("../src/features/mock-game");
      return { default: new MockGame() };
    });
    const module = await loadGame("mock");
    expect(module.id).toBe("mock");
  });

  test("kayıtsız modül talebi → UNKNOWN_MODULE hatası (sessiz YOK)", async () => {
    try {
      await loadGame("kayitsiz-modul");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GameModuleError);
      expect((error as GameModuleError).category).toBe(GameModuleErrorCategory.UnknownModule);
    }
  });
});
