/**
 * Purity lint (SC-1): oyun model katmanları PIXI/React/DOM/game-fx API'sine dokunamaz.
 * Her oyunun model/ altında yalnız relative import + @bulmacanya/shared serbesttir.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const GAMES = ["shapetris", "game7"];
const ROOTS = GAMES.map((g) => join(process.cwd(), "src", g, "model"));
const ALLOWED_PREFIXES = ["@bulmacanya/shared", "bun:test"];

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
if (files.length === 0) {
  console.error("purity: model dizinlerinde .ts dosyası bulunamadı — kontrol boş geçti");
  process.exit(2);
}

const IMPORT_RE =
  /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(['"]([^'"]+)['"]\)/g;

let violations = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const m of source.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2];
    if (spec === undefined || spec.startsWith(".")) continue;
    const allowed = ALLOWED_PREFIXES.some(
      (p) => spec === p || spec.startsWith(`${p}/`),
    );
    if (!allowed) {
      console.error(`purity violation: ${relative(process.cwd(), file)} → "${spec}"`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(
    `purity: ${violations} ihlal — model katmanları yalnız relative + ${ALLOWED_PREFIXES.join(", ")} import edebilir`,
  );
  process.exit(1);
}
console.log(`purity: ${files.length} dosya temiz (${GAMES.join(", ")})`);
