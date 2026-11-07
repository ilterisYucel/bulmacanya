/**
 * levels-index.gen.ts ÜRETİCİSİ — elle düzenleme.
 * Çalıştır: bun run scripts/gen-levels.mjs (assets/levels değişince).
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "shapetris");
const LEVELS_DIR = join(ROOT, "assets", "levels");
const OUT = join(ROOT, "lib", "levels-index.gen.ts");

const imports = [];
const entries = [];
let count = 0;

for (const difficulty of ["kolay", "orta", "zor"]) {
  const dir = join(LEVELS_DIR, difficulty);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir)
    .filter((f) => /^level\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));
  for (const file of files) {
    const n = parseInt(file.slice(5));
    const name = `l_${difficulty}_${n}`;
    imports.push(`import ${name} from "../assets/levels/${difficulty}/${file}";`);
    entries.push(`  "${difficulty}/${n}": ${name},`);
    count++;
  }
}

const content = `/**
 * ÜRETİLMİŞ dosya — elle düzenleme. Kaynak: bun run scripts/gen-levels.mjs
 * Kampanya bölüm haritası: "{zorluk}/{bölümNo}" → 8×8 matris.
 */
${imports.join("\n")}

export const LEVEL_FILES: Record<string, number[][]> = {
${entries.join("\n")}
};

export const LEVEL_COUNT = ${count};
`;

mkdirSync(join(ROOT, "lib"), { recursive: true });
writeFileSync(OUT, content);
console.log(`gen-levels: ${count} bölüm → ${OUT}`);
