import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "scripts", "check-purity.ts");

function runChecker(cwd: string): { status: number | null; stderr: string } {
  const r = spawnSync("bun", ["run", SCRIPT], { cwd, encoding: "utf8" });
  return { status: r.status, stderr: r.stderr };
}

describe("T-6 — purity lint (FR-2.1, FR-5.4)", () => {
  test("AK-2.1: domain'de 3. parti import → kırmızı", () => {
    const dir = mkdtempSync(join(tmpdir(), "purity-violation-"));
    mkdirSync(join(dir, "src", "domain"), { recursive: true });
    mkdirSync(join(dir, "src", "application"), { recursive: true });
    writeFileSync(join(dir, "src", "domain", "bad.ts"), 'import { z } from "zod";\n');
    writeFileSync(
      join(dir, "src", "application", "ok.ts"),
      'import type { DatabasePort } from "@bulmacanya/shared";\n',
    );
    const { status } = runChecker(dir);
    expect(status).toBe(1);
  });

  test("AK-5.4: domain'de Drizzle import → kırmızı", () => {
    const dir = mkdtempSync(join(tmpdir(), "purity-drizzle-"));
    mkdirSync(join(dir, "src", "domain"), { recursive: true });
    writeFileSync(
      join(dir, "src", "domain", "bad.ts"),
      'import { pgTable } from "drizzle-orm/pg-core";\n',
    );
    const { status } = runChecker(dir);
    expect(status).toBe(1);
  });

  test("AK-2.1: temiz katmanlar → yeşil", () => {
    const dir = mkdtempSync(join(tmpdir(), "purity-clean-"));
    mkdirSync(join(dir, "src", "domain"), { recursive: true });
    mkdirSync(join(dir, "src", "application"), { recursive: true });
    writeFileSync(join(dir, "src", "domain", "health.ts"), "export class Health {}\n");
    const { status } = runChecker(dir);
    expect(status).toBe(0);
  });

  test("gerçek domain/application temiz ve BOŞ DEĞİL", () => {
    const { status } = runChecker(join(import.meta.dir, ".."));
    expect(status).toBe(0);
  });
});
