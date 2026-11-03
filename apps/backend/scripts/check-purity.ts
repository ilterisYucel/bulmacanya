/**
 * Purity lint (T-6 / FR-2.1 / FR-5.4):
 * domain/ ve application/ katmanları yalnızca relative import + node:* + @bulmacanya/shared kullanabilir.
 * Drizzle dahil hiçbir 3. parti paket bu katmanlara SIZAMAZ (K4, K5).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = [
  join(process.cwd(), "src", "domain"),
  join(process.cwd(), "src", "application"),
];
const ALLOWED_PREFIXES = ["node:", "@bulmacanya/shared"];

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = ROOTS.flatMap((root) => walk(root));
if (files.length === 0) {
  console.error("purity: domain/application altında .ts dosyası bulunamadı — kontrol boş geçti");
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
    `purity: ${violations} ihlal — domain/application yalnız relative, node:*, ${ALLOWED_PREFIXES.join(", ")} import edebilir`,
  );
  process.exit(1);
}
console.log(`purity: ${files.length} dosya temiz`);
