/**
 * Health — sağlık durumu değer nesnesi (saf domain, import YOK).
 */
export class Health {
  private constructor(
    readonly ok: boolean,
    readonly checkedAt: Date,
  ) {}

  static up(): Health {
    return new Health(true, new Date());
  }

  static down(): Health {
    return new Health(false, new Date());
  }
}
