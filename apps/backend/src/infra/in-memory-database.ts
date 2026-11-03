import type { IDatabasePort } from "../domain/ports/database";

/**
 * InMemoryDatabase — Faz 0 için IDatabasePort adaptörü.
 * Faz 1'de yerini Drizzle+PostgreSQL adaptörü alır (kontrat DEĞİŞMEZ).
 */
export class InMemoryDatabase implements IDatabasePort {
  private closed = false;

  async ping(): Promise<boolean> {
    return !this.closed;
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}
