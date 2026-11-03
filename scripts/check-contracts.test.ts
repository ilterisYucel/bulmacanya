import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHECKER = join(import.meta.dir, "check-contracts.ts");

function run(args: string[]): { status: number | null; output: string } {
  const r = spawnSync("bun", ["run", CHECKER, ...args], { encoding: "utf8" });
  return { status: r.status, output: `${r.stdout}${r.stderr}` };
}

function fixtureDir(): string {
  return mkdtempSync(join(tmpdir(), "contracts-"));
}

describe("check-contracts (K10)", () => {
  test("A: I-sız metotlu kontrat interface'i → kırmızı", () => {
    const dir = fixtureDir();
    const contracts = join(dir, "contracts");
    const scope = join(dir, "scope");
    mkdirSync(contracts, { recursive: true });
    mkdirSync(scope, { recursive: true });
    writeFileSync(join(contracts, "bad.ts"), "export interface FooBar { do(): void }\n");
    writeFileSync(join(scope, "svc.ts"), "export interface IRepo {}\nexport class Svc { constructor(private repo: IRepo) {} }\n");
    const { status } = run(["--contracts", contracts, "--scopes", scope]);
    expect(status).toBe(1);
  });

  test("A: data şekli interface'leri I gerektirmez → yeşil", () => {
    const dir = fixtureDir();
    const contracts = join(dir, "contracts");
    const scope = join(dir, "scope");
    mkdirSync(contracts, { recursive: true });
    mkdirSync(scope, { recursive: true });
    writeFileSync(join(contracts, "shape.ts"), "export interface RegisterRequest { email: string }\n");
    writeFileSync(join(scope, "svc.ts"), "export interface IRepo {}\nexport class Svc { constructor(private repo: IRepo) {} }\n");
    const { status } = run(["--contracts", contracts, "--scopes", scope]);
    expect(status).toBe(0);
  });

  test("B: somut sınıf enjeksiyonu → kırmızı", () => {
    const dir = fixtureDir();
    const scope = join(dir, "scope");
    mkdirSync(scope, { recursive: true });
    writeFileSync(
      join(scope, "svc.ts"),
      "export class Repo {}\nexport class Svc { constructor(private repo: Repo) {} }\n",
    );
    const { status } = run(["--contracts", join(dir, "contracts-none"), "--scopes", scope]);
    expect(status).toBe(1);
  });

  test("B: I-kontrat enjeksiyonu → yeşil", () => {
    const dir = fixtureDir();
    const scope = join(dir, "scope");
    mkdirSync(scope, { recursive: true });
    writeFileSync(
      join(scope, "svc.ts"),
      "export interface IRepo {}\nexport class Svc { constructor(private repo: IRepo) {} }\n",
    );
    const { status } = run(["--contracts", join(dir, "contracts-none"), "--scopes", scope]);
    expect(status).toBe(0);
  });

  test("B: builtin tip (Date) parametre → yeşil (DIP kapsamı dışı)", () => {
    const dir = fixtureDir();
    const scope = join(dir, "scope");
    mkdirSync(scope, { recursive: true });
    writeFileSync(join(scope, "svc.ts"), "export class Svc { constructor(private at: Date) {} }\n");
    const { status } = run(["--contracts", join(dir, "contracts-none"), "--scopes", scope]);
    expect(status).toBe(0);
  });

  test("B: boş scope → hata (vakum geçiş yasağı)", () => {
    const dir = fixtureDir();
    const { status } = run(["--contracts", join(dir, "contracts-none"), "--scopes", join(dir, "scope-yok")]);
    expect(status).toBe(2);
  });

  test("gerçek repo temiz", () => {
    const { status, output } = run([]);
    expect(status).toBe(0);
    expect(output).toContain("temiz");
  });
});
