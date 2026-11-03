import type { IDatabasePort } from "./domain/ports/database";
import { InMemoryDatabase } from "./infra/in-memory-database";
import { App } from "./application/app";

/**
 * Composition root — DI kablolamasının TEK yeri.
 * Faz 1'de PostgreSQL adaptörü burada takılır; App ve adaptörler DEĞİŞMEZ.
 */
export function bootstrap(db: IDatabasePort = new InMemoryDatabase()): App {
  return new App(db);
}
