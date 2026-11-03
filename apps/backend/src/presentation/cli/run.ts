import type { App } from "../../application/app";

/**
 * CLI adaptör — aynı App örneğine bağlanır (AK-2.2).
 * Bilinmeyen komutta hata fırlatır (sessiz davranış YOK).
 */
const COMMANDS: Record<string, (app: App, args: string[]) => Promise<string> | string> = {
  health: async (app) => {
    const h = await app.health();
    return `ok=${h.ok}`;
  },
  visits: (app) => String(app.visits()),
};

export async function runCliCommand(app: App, argv: string[]): Promise<string> {
  app.touch();
  const [command] = argv;
  const handler = command ? COMMANDS[command] : undefined;
  if (!handler) {
    throw new Error(`bilinmeyen komut: ${command ?? "(yok)"}`);
  }
  return handler(app, argv.slice(1));
}
