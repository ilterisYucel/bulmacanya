import { IDatabasePort } from "../domain/ports/database";
import { HealthCheck } from "./health-check";
import type { Health } from "../domain/health";

/**
 * App — tüm presentation adaptörlerinin (REST, CLI, gelecekte desktop) bağlandığı TEK çekirdek.
 * AK-2.2 kanıtı: `touch()`/`visits()` aynı örnek üzerinde paylaşılan durumu açığa çıkarır —
 * iki adaptörün aynı App'e bağlı olduğunu integration testi doğrular.
 */
export class App {
  private readonly healthCheck: HealthCheck;
  private visitCount = 0;

  constructor(db: IDatabasePort) {
    this.healthCheck = new HealthCheck(db);
  }

  /** Bir presentation adaptörünün bu örneğe dokunduğunu işaretler. */
  touch(): void {
    this.visitCount += 1;
  }

  /** Paylaşılan ziyaret sayacı (AK-2.2 kanıtı). */
  visits(): number {
    return this.visitCount;
  }

  health(): Promise<Health> {
    return this.healthCheck.run();
  }
}
