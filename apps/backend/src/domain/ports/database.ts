/**
 * IDatabasePort — domain/application'ın DB'ye eriştiği TEK kapı (hexagonal port).
 * Somut adaptörler `infra/` içinde yaşar (Faz 0: in-memory; Faz 1: Drizzle+PostgreSQL).
 * Domain/application hiçbir ORM sürücüsü import ETMEZ (purity lint ile sabitlenir).
 *
 * NOT: Bu port TEK app'e (backend) özeldir — packages/shared'de YAŞAMAZ (2026-11-03 kararı:
 * shared yalnızca birden fazla app'in kullandığı tipleri taşır).
 *
 * ## Hata kategorileri
 *
 * - Bağlantı/erişim hataları `DatabaseError` tipinde fırlar; `ping` bu durumda `false` DÖNMEZ, fırlatır.
 * - `close` idempotenttir: kapalıyken tekrar çağrılırsa sessizce döner.
 *
 * ## Yan etkiler
 *
 * - `close` çağrıldıktan sonra hiçbir metot çağrılamaz (kullanım hatası — adaptör `DatabaseError` fırlatabilir).
 */
export interface IDatabasePort {
  /** Bağlantı sağlığını doğrular; sağlıklıysa `true` döner. */
  ping(): Promise<boolean>;
  /** Bağlantıyı kapatır; kaynakları serbest bırakır. */
  close(): Promise<void>;
}

/** DB erişim hataları. */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}
