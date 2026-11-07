/**
 * Vite `import.meta.glob` tip bildirimi (lazy mod) — oyun paketinde vite bağımlılığı
 * olmadan tsc'nin çözebilmesi için minimal augment.
 */
interface ImportMeta {
  glob(
    pattern: string,
  ): Record<string, () => Promise<{ default: unknown }>>;
}
