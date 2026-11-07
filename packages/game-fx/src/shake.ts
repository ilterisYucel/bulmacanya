/**
 * shake — ekran sarsıntısı (FAZ-GAME-FX-SPEC UC-4, K7).
 *
 * Sözleşme:
 * - Jenerik: `{x, y}` sahibi HERHANGİ bir nesne (pixi Container, DOM wrapper…).
 * - Taban konum oluşturma anında yakalanır; sarsıntı bitince ORİJİNAL konuma dönülür.
 * - `start` çakışırsa SON GELEN kazanır (önceki ezilir, birikim YOK — AK-4.3).
 * - Ofset, geçen sürenin SAF fonksiyonudur (deterministik — AK-4.2); büyüklük ≤ px.
 * - Zaman oyuncu tarafından enjekte edilir (ms; genelde performance.now()).
 */
export interface ShakeTarget {
  x: number;
  y: number;
}

export interface ShakeOptions {
  /** maksimum ofset, px */
  px: number;
  /** süre, ms */
  ms: number;
}

// normalize sabitleri: sinüs toplamının genliğine bölerek |offset| ≤ 1 garantilenir
const AX_AMP = 13.7 + 7.3;
const AY_AMP = 11.3 + 8.9;

export class Shake {
  private readonly baseX: number;
  private readonly baseY: number;
  private opts: ShakeOptions | null = null;
  private startAt: number | null = null;

  constructor(private readonly target: ShakeTarget) {
    this.baseX = target.x;
    this.baseY = target.y;
  }

  /** Aktif sarsıntıyı ezer, yenisi başlar (son gelen kazanır). */
  start(opts: ShakeOptions, now: number): void {
    this.opts = opts;
    this.startAt = now;
  }

  /** true dönerse sarsıntı sürüyor; bitince hedef orijinal konumuna döner. */
  update(now: number): boolean {
    if (this.startAt === null || this.opts === null) return false;
    const t = now - this.startAt;
    if (t >= this.opts.ms) {
      this.stop();
      return false;
    }
    const decay = 1 - t / this.opts.ms;
    const jx = Math.sin(t * 0.047) * 13.7 + Math.sin(t * 0.093) * 7.3;
    const jy = Math.sin(t * 0.061) * 11.3 + Math.sin(t * 0.081) * 8.9;
    this.target.x = this.baseX + (jx / AX_AMP) * this.opts.px * decay;
    this.target.y = this.baseY + (jy / AY_AMP) * this.opts.px * decay;
    return true;
  }

  /** Anında bitirir; hedef orijinal konumuna döner. */
  stop(): void {
    this.target.x = this.baseX;
    this.target.y = this.baseY;
    this.startAt = null;
  }
}
