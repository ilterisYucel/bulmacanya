/**
 * slots — SlotBoard: N slot, kilit, yerleştirme/çıkarma (UC-2, K19/K22/K23/FR-2.x). SAF.
 *
 * Sözleşme:
 * - Slot sayısı = kelime uzunluğu N; kilitli slot (sabit desen) YERLEŞTİRME REDDEDER (FR-2.6).
 * - Klasik per-slot doğrulama: `expected` verilirse yalnız beklenen harf oturur,
 *   uymayan "wrong-letter" ile reddedilir (K23/FR-2.5).
 * - Dolu slota gelen balon eskisini serbest bırakır (harf bilgisi displaced'te
 *   KORUNUR — balon nesnesi harfini değiştirmez — K21/K22/FR-2.4).
 * - `removeByBalloon` SET balonun yuvadan çıkışıdır (FR-2.8 mekanik yanı).
 */
export interface Slot {
  letter: string | null;
  balloonId: number | null;
  locked: boolean;
}

export type PlaceError = "locked" | "wrong-letter";

export interface PlaceResult {
  ok: boolean;
  reason?: PlaceError;
  displaced?: { balloonId: number; letter: string };
}

/** Kilitli slotların balon id'si (gerçek balon değil — sabit harf). */
const LOCKED_ID = -1;

export class SlotBoard {
  private readonly slots: Slot[];

  constructor(count: number, lockedLetters?: readonly (string | null)[]) {
    this.slots = Array.from({ length: count }, (_, i) => {
      const letter = lockedLetters?.[i] ?? null;
      return {
        letter,
        balloonId: letter !== null ? LOCKED_ID : null,
        locked: letter !== null,
      };
    });
  }

  get count(): number {
    return this.slots.length;
  }

  letters(): (string | null)[] {
    return this.slots.map((s) => s.letter);
  }

  isLocked(index: number): boolean {
    return this.slots[index]?.locked ?? false;
  }

  isFull(): boolean {
    return this.slots.every((s) => s.letter !== null);
  }

  /**
   * Balonu slota yerleştirir.
   * `expected`: Klasik modda hedef kelimenin harfleri (slot bazlı doğrulama);
   * Dedektif/Sabit'te undefined (serbest oturma — K23).
   */
  place(
    balloonId: number,
    letter: string,
    index: number,
    expected?: readonly (string | null)[],
  ): PlaceResult {
    const slot = this.slots[index];
    if (slot === undefined || slot.locked) return { ok: false, reason: "locked" };
    const expect = expected?.[index];
    if (expect !== undefined && expect !== null && expect !== letter) {
      return { ok: false, reason: "wrong-letter" };
    }
    const displaced =
      slot.letter !== null && slot.balloonId !== LOCKED_ID
        ? { balloonId: slot.balloonId!, letter: slot.letter }
        : undefined;
    slot.letter = letter;
    slot.balloonId = balloonId;
    return { ok: true, displaced };
  }

  /** SET balon yuvadan çıkarılır; slot boşalır (harf balonda KORUNUR — K21). */
  removeByBalloon(balloonId: number): void {
    for (const slot of this.slots) {
      if (slot.balloonId === balloonId) {
        slot.letter = null;
        slot.balloonId = null;
        return;
      }
    }
  }
}
