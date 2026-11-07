/**
 * Purity lint (FAZ-GAME-FX-SPEC K2/SC-1): game-fx çekirdeği ZERO-DEP'tir.
 * src/ altında yalnız relative import + bun:test serbesttir — pixi/react/DOM dahil
 * hiçbir dış paket import edilemez.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "src");
const ALLOWED = new Set(["bun:test"]);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
if (files.length === 0) {
  console.error("purity: game-fx/src altında .ts dosyası bulunamadı — kontrol boş geçti");
  process.exit(2);
}

const IMPORT_RE =
  /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(['"]([^'"]+)['"]\)/g;

let violations = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const m of source.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2];
    if (spec === undefined || spec.startsWith(".") || ALLOWED.has(spec)) continue;
    console.error(`purity violation: ${relative(process.cwd(), file)} → "${spec}"`);
    violations++;
  }
}

if (violations > 0) {
  console.error(`purity: ${violations} ihlal — game-fx/src yalnız relative + bun:test import edebilir (zero-dep)`);
  process.exit(1);
}
console.log(`purity: ${files.length} dosya temiz (zero-dep)`);
