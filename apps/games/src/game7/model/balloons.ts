/**
 * balloons — balon alanı: durum makinesi + spawn/respawn + kapasite (UC-2, K20/K21/K25/K26). SAF.
 *
 * Sözleşme:
 * - Ekranda SABİT 14 balon (K20); aynı harften 2+ balon eşzamanlı olabilir (havuz multiset).
 * - FREE balon düz dikey yukarı süzülür (K26); tepeden çıkınca havuz dağılımından
 *   yeniden doğar (harfi DEĞİŞEBİLİR — FR-1.3).
 * - TEK aktif sürükleme: bir balon DRAG'dayken diğerlerinin drag'ı reddedilir (K25).
 * - SET balon yuvadan çıkınca FREE döner; HARFİ KORUNUR (K21 — yalnız tepeden çıkış yeniler).
 * - Hız parametresi oyun tarafından geçilir (K18 — Klasik'te tier çarpanı, diğer modlarda sabit).
 */
import { pickLetter } from "./letter-pool";
import type { LetterPool } from "./letter-pool";

export type BalloonStateName = "FREE" | "DRAG" | "SET";

export interface Balloon {
  readonly id: number;
  letter: string;
  state: BalloonStateName;
  x: number;
  y: number;
  slotIndex: number | null;
}

export interface BalloonBounds {
  width: number;
  height: number;
}

/** Ekran kapasitesi — başlangıç değeri (K20, tune edilir). */
export const BALLOON_CAPACITY = 14;

export class BalloonField {
  private nextId = 1;
  private readonly balloons: Balloon[] = [];
  private draggingId: number | null = null;

  constructor(
    private readonly pool: LetterPool,
    private readonly rng: () => number,
    private readonly bounds: BalloonBounds,
  ) {
    for (let i = 0; i < BALLOON_CAPACITY; i++) {
      this.balloons.push(this.spawn());
    }
  }

  all(): readonly Balloon[] {
    return this.balloons;
  }

  find(id: number): Balloon | undefined {
    return this.balloons.find((b) => b.id === id);
  }

  get dragging(): Balloon | null {
    return this.draggingId === null ? null : this.find(this.draggingId) ?? null;
  }

  /** Tek aktif sürükleme (K25): biri DRAG'dayken false döner. */
  beginDrag(id: number): boolean {
    if (this.draggingId !== null) return false;
    const b = this.find(id);
    if (b === undefined || b.state !== "FREE") return false;
    b.state = "DRAG";
    this.draggingId = id;
    return true;
  }

  moveDrag(id: number, x: number, y: number): void {
    if (this.draggingId !== id) return;
    const b = this.find(id);
    if (b !== undefined) {
      b.x = x;
      b.y = y;
    }
  }

  endDrag(): void {
    if (this.draggingId === null) return;
    const b = this.find(this.draggingId);
    if (b !== undefined && b.state === "DRAG") b.state = "FREE";
    this.draggingId = null;
  }

  setToSlot(id: number, slotIndex: number): void {
    const b = this.find(id);
    if (b === undefined) return;
    b.state = "SET";
    b.slotIndex = slotIndex;
    if (this.draggingId === id) this.draggingId = null;
  }

  /** Yuvadan çıkarma: FREE döner, harf KORUNUR (K21). */
  freeFromSlot(id: number): void {
    const b = this.find(id);
    if (b === undefined) return;
    b.state = "FREE";
    b.slotIndex = null;
  }

  /** FREE balonlar yukarı süzülür; tepeyi geçen havuzdan yeniden doğar (FR-2.3). */
  tick(dtMs: number, speedPxPerS: number, topMargin: number): void {
    if (dtMs <= 0) return;
    const dy = (speedPxPerS * dtMs) / 1000;
    for (const b of this.balloons) {
      if (b.state !== "FREE") continue;
      b.y -= dy;
      if (b.y < -topMargin) this.respawn(b, topMargin);
    }
  }

  private spawn(): Balloon {
    return {
      id: this.nextId++,
      letter: pickLetter(this.pool, this.rng),
      state: "FREE",
      x: this.rng() * this.bounds.width,
      y: this.rng() * this.bounds.height,
      slotIndex: null,
    };
  }

  private respawn(b: Balloon, topMargin: number): void {
    b.letter = pickLetter(this.pool, this.rng);
    b.x = this.rng() * this.bounds.width;
    b.y = this.bounds.height + topMargin + this.rng() * this.bounds.height * 0.3;
    b.slotIndex = null;
  }
}
