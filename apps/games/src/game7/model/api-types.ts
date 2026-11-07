/**
 * api-types — Game7Module ↔ UI köprüsü (UC-7, §4). SAF (yalnız model tipleri).
 */
import type { Game7Mode, Tier } from "./words";
import type { Signal } from "./word-check";
import type { Pattern } from "./patterns";
import type { BalloonStateName } from "./balloons";
import type { LayoutMetrics } from "./layout";

export type Game7Phase = "playing" | "victory" | "gameover";

export type Game7HintType =
  | "game7.harf-vurgula"
  | "game7.sure-ekle"
  | "game7.harf-ac"
  | "game7.hak-iade";

export interface Game7BalloonView {
  id: number;
  letter: string;
  state: BalloonStateName;
  x: number;
  y: number;
  slotIndex: number | null;
}

export interface Game7Snapshot {
  mode: Game7Mode;
  tier: Tier;
  levelNo: number;
  phase: Game7Phase;
  /** klasik: hedef kelime (AÇIK — K12); diğerleri null */
  targetWord: string | null;
  /** dedektif: kategori */
  category: string | null;
  /** sabit: desen (kilitli harfler görünür) */
  pattern: Pattern | null;
  /** ipucu ile açılan pozisyonlar (harf-ac — dedektif/sabit) */
  revealed: (string | null)[];
  slots: (string | null)[];
  balloons: Game7BalloonView[];
  totalScore: number;
  hintsUsed: number;
  sureLeft: number | null;
  hakLeft: number | null;
  canLeft: number | null;
  /** klasik: seviyede tamamlanan / hedef kelime sayısı */
  wordsDone: number;
  wordsTarget: number;
  /** dedektif: son yanlış kelimenin sinyali */
  signal: (Signal | null)[] | null;
  lastWord: string | null;
  muted: boolean;
  layout: LayoutMetrics | null;
  /** Gerçek görsel kutu boyutu (container ölçümü — window DEĞİL, 2026-11-07) */
  viewport: { width: number; height: number };
}

export type DropKind = "snapped" | "wrong-letter" | "locked" | "released" | "none";

export interface DropOutcome {
  kind: DropKind;
  /** kelime tamamlandı (balonlar patladı) */
  popped?: boolean;
}

export type SubmitKind = "matched" | "wrong" | "none";

export interface SubmitOutcome {
  kind: SubmitKind;
  word?: string;
  signal?: (Signal | null)[];
}

export interface Game7Api {
  getSnapshot(): Game7Snapshot;
  subscribe(fn: () => void): () => void;
  dragStart(id: number): boolean;
  /**
   * Balonu slota bırakır — `slotIndex: null` = aday kutu yok, serbest bırak.
   * Kutu seçimi UI'da dikdörtgen-kesişim testiyle yapılır (2026-11-07).
   */
  dropIntoSlot(id: number, slotIndex: number | null): DropOutcome;
  pullFromSlot(id: number): void;
  submit(): SubmitOutcome;
  requestHint(hintType: Game7HintType): Promise<boolean>;
  restart(): void;
  nextLevel(): void;
  setMuted(muted: boolean): void;
  exit(): void;
}
