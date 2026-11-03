/**
 * check-contracts — kontrat sözleşmesi denetimi (K10, 2026-11-03).
 *
 * Kural A (prefix): packages/shared/src/contracts altındaki interface'ler "I" ile başlar.
 * Kural B (DIP):     scope dizinlerindeki (backend domain/application) sınıf constructor
 *                    parametreleri yalnızca I- prefixed interface olabilir.
 *                    Somut sınıf veya 3. parti tip enjeksiyonu REDDEDİLİR.
 *
 * Kullanım: bun run scripts/check-contracts.ts [--contracts <dir>] [--scopes <dir>...]
 */
import ts from "typescript";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

function parseArgs(): { contractsDir: string; scopeDirs: string[] } {
  const args = process.argv.slice(2);
  const contractsIdx = args.indexOf("--contracts");
  const scopesIdx = args.indexOf("--scopes");
  const contractsDir = resolve(
    contractsIdx >= 0 ? args[contractsIdx + 1]! : join(root, "packages/shared/src/contracts"),
  );
  const scopeDirs =
    scopesIdx >= 0
      ? args.slice(scopesIdx + 1).map((p) => resolve(p))
      : [join(root, "apps/backend/src/domain"), join(root, "apps/backend/src/application")];
  return { contractsDir, scopeDirs };
}

const violations: string[] = [];
const { contractsDir, scopeDirs } = parseArgs();

// --- Kural A: metot taşıyan kontrat interface'leri "I" ile başlar (data şekilleri muaf) ---
for (const file of tsFiles(contractsDir)) {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const hasMethods = (iface: ts.InterfaceDeclaration): boolean =>
    iface.members.some((m) => ts.isMethodSignature(m));
  const visit = (node: ts.Node): void => {
    if (ts.isInterfaceDeclaration(node) && hasMethods(node) && !node.name.text.startsWith("I")) {
      violations.push(`[A] kontrat interface'i "I" ile başlamalı: ${relative(root, file)} → ${node.name.text}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

// --- Kural B: domain/application bağımlılıkları yalnız I-kontratları üzerinden ---
const rootNames = scopeDirs.flatMap((d) => tsFiles(d));
if (rootNames.length === 0) {
  console.error("[B] scope dizinlerinde .ts bulunamadı — kontrol boş geçti");
  process.exit(2);
}

const program = ts.createProgram({
  rootNames,
  options: {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
  },
});
const checker = program.getTypeChecker();

function unionParts(type: ts.Type): ts.Type[] {
  return type.isUnion() ? type.types : [type];
}

function checkParam(
  typeNode: ts.TypeNode,
  where: string,
  sourceFile: ts.SourceFile,
): void {
  const type = checker.getTypeAtLocation(typeNode);
  for (const part of unionParts(type)) {
    const symbol = part.getSymbol() ?? part.aliasSymbol;
    if (!symbol) continue; // primitive/literal — sorun değil
    for (const decl of symbol.getDeclarations() ?? []) {
      if (decl.getSourceFile().isDeclarationFile) continue; // builtin (Date, string) / lib — DIP kapsamı dışı
      if (ts.isInterfaceDeclaration(decl)) {
        if (!decl.name.text.startsWith("I")) {
          violations.push(`[B] ${relative(root, sourceFile.fileName)} ${where} → interface "I" ile başlamalı: ${decl.name.text}`);
        }
      } else if (ts.isClassDeclaration(decl)) {
        violations.push(
          `[B] ${relative(root, sourceFile.fileName)} ${where} → somut sınıf enjekte edilemez: ${decl.name?.text ?? "(anonim)"} (yalnız I- kontratları)`,
        );
      }
    }
  }
}

for (const sourceFile of program.getSourceFiles()) {
  if (sourceFile.isDeclarationFile) continue;
  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) && node.name) {
      for (const member of node.members) {
        if (ts.isConstructorDeclaration(member)) {
          for (const param of member.parameters) {
            if (!param.type) continue; // tiplenmemiş parametre — kontrol dışı
            checkParam(param.type, `${node.name.text}.constructor(${param.name.getText()})`, sourceFile);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

if (violations.length > 0) {
  for (const v of violations) console.error(`contract violation: ${v}`);
  console.error(`check-contracts: ${violations.length} ihlal`);
  process.exit(1);
}
console.log(`check-contracts: temiz (contracts: ${tsFiles(contractsDir).length} dosya, scope: ${rootNames.length} dosya)`);
