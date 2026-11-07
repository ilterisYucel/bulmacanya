/**
 * api-types — Shapetris modülü ↔ UI köprüsü (UC-1, UC-9). SAF.
 *
 * Modül (IGameModule) shell ile yalnız kontrat üzerinden konuşur; UI ise modülün
 * KENDİ parçasıdır ve bu köprüyle konuşur (shell'e sızmaz).
 */

import type { Board } from "./board";

export type ShapetrisPhase = "playing" | "victory" | "gameover";

export type ShapetrisMode = "campaign" | "endless" | "daily";

export interface TrayPiece {
  tileId: number;
  rotation: number;
}

export interface ShapetrisSnapshot {
  board: Board;
  /** Tahta her mutasyonunda artar (UI memo anahtarı). */
  boardVersion: number;
  tray: TrayPiece[];
  next: number[];
  /** Tepsi her mutasyonunda artar. */
  trayVersion: number;
  levelNo: number;
  mode: ShapetrisMode;
  campaignComplete: boolean;
  totalScore: number;
  hintsUsed: number;
  timeLeft: number;
  phase: ShapetrisPhase;
}

export interface ShapetrisApi {
  getSnapshot(): ShapetrisSnapshot;
  subscribe(fn: () => void): () => void;
  placePiece(slot: number, x: number, y: number): boolean;
  rotateSlot(slot: number): void;
  requestBorderClear(): Promise<boolean>;
  requestCellDelete(x: number, y: number): Promise<boolean>;
  restartLevel(): void;
  nextLevel(): void;
  exit(): void;
}
