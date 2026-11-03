import { GameModuleError, GameModuleErrorCategory, type IGameModule } from "@bulmacanya/shared";

/**
 * Oyun kabuğu (game shell) — README §3.3: skor, bölüm, ipucu, kayıt, reklam tek merkezden.
 * Shell oyun-spesifik tip BİLMEZ (FR-4.1 — arch test ile sabitlenir);
 * modüller dinamik import ile lazy yüklenir (FR-4.2).
 */
export type ModuleLoader = () => Promise<{ default: IGameModule }>;

const registry = new Map<string, ModuleLoader>();

/** Oyun modülünü kabuğa kaydeder (yalnızca loader — modül kodu yüklenmez). */
export function registerGame(id: string, loader: ModuleLoader): void {
  registry.set(id, loader);
}

/** Kayıtlı modülü dinamik import ile yükler. Kayıtsız ID → UNKNOWN_MODULE hatası (sessiz YOK). */
export async function loadGame(id: string): Promise<IGameModule> {
  const loader = registry.get(id);
  if (!loader) {
    throw new GameModuleError(GameModuleErrorCategory.UnknownModule, `kayıtsız oyun modülü: ${id}`);
  }
  const loaded = await loader();
  return loaded.default;
}

export function listGames(): string[] {
  return [...registry.keys()];
}
