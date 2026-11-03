import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

describe("UC-3 — PWA + Capacitor", () => {
  test(
    "AK-3.1: web build manifest + service worker üretir",
    () => {
      const r = spawnSync("bun", ["run", "build"], { cwd: ROOT, encoding: "utf8" });
      expect(r.stderr).not.toContain("error");
      expect(r.status).toBe(0);
      expect(existsSync(join(DIST, "manifest.webmanifest"))).toBe(true);
      expect(existsSync(join(DIST, "sw.js"))).toBe(true);
    },
    120000,
  );

  test(
    "AK-3.2: cap sync çalışır ve android platformu mevcut",
    () => {
      const r = spawnSync("bunx", ["cap", "sync"], { cwd: ROOT, encoding: "utf8" });
      expect(r.status).toBe(0);
      expect(existsSync(join(ROOT, "android"))).toBe(true);
    },
    120000,
  );
});
