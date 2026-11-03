import { IDatabasePort } from "../domain/ports/database";
import { Health } from "../domain/health";

/**
 * HealthCheck — DB sağlığını domain Health nesnesine çeviren tek use-case.
 * DB hataları burada yakalanır: hata durumunda Health.down() döner, dışarı SIZMAZ.
 */
export class HealthCheck {
  constructor(private readonly db: IDatabasePort) {}

  async run(): Promise<Health> {
    try {
      const ok = await this.db.ping();
      return ok ? Health.up() : Health.down();
    } catch {
      return Health.down();
    }
  }
}
