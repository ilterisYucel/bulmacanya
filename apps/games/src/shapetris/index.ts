/**
 * ShapetrisModule — IGameModule uygulaması + oyun motoru (UC-1 … UC-8).
 *
 * - Shell ile yalnız kontrat (packages/shared#IGameModule) üzerinden konuşur.
 * - UI, modülün parçasıdır: init React root'u DOM'a bağlar, exit söker.
 * - İpucu onayı opsiyonel `hintHost` ile (A3 kararı: kontrat GENİŞLEMEZ —
 *   host, modül yükleyicisi tarafından constructor'a enjekte edilir).
 *
 * Yan etkiler: init DOM overlay + React root ayırır; exit bunları serbest bırakır (ZORUNLU).
 * Limitler: tek modül örneği; aynı anda tek shell.
 */

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { GameModuleState } from "@bulmacanya/shared";
import { ModuleLifecycle } from "./model/module-state";
import {
  applyPiece,
  checkVictory,
  cleanRowsCols,
  clearBorder,
  clearCell,
  createBoard,
  type Board,
} from "./model/board";
import { PIECES, rotateCW, type PieceMatrix } from "./model/pieces";
import { generateLevel, mulberry32, seedFromString } from "./model/level";
import { addScore, levelScore } from "./model/scoring";
import type { ShapetrisApi, ShapetrisSnapshot, ShapetrisPhase, TrayPiece } from "./model/api-types";
import { loadAtlas, type AtlasFrames } from "./ui/atlas";
import { CAMPAIGN_LEVEL_COUNT, loadCampaignLevel, type CampaignDifficulty } from "./lib/levels";
import { ShapetrisRoot } from "./ui/ShapetrisRoot";

/** İpucu türleri (GameEventMap#hintRequested.hintType) — K8. */
export type ShapetrisHintType = "shapetris.kenar-temizle" | "shapetris.hucre-sil";

/** İpucu onayı host'u — shell tarafı modül yükleyicisinde enjekte eder (A3). */
export interface ShapetrisHintHost {
  grant(hintType: ShapetrisHintType): Promise<boolean>;
}

/**
 * Oyun modu (K16/K20):
 * - campaign: hazır JSON bölümleri (kolay/orta/zor klasörleri)
 * - endless:  sayaç tohumlu sonsuz puzzle (Zor bitince açılır)
 * - daily:    tarih tohumlu günlük puzzle (herkes aynı, ilerleme yok)
 */
export type ShapetrisMode = "campaign" | "endless" | "daily";

export interface ShapetrisOptions {
  /** 0: deterministik dizi, 1: tepsi-0 rastgele, 2: ikisi de rastgele (K6/K22). */
  difficulty?: 0 | 1 | 2;
  hintHost?: ShapetrisHintHost;
  /** Tepsi RNG determinizmi (test/debug). */
  seed?: number;
  /** Oyun modu — varsayılan "endless" (eski challange davranışı). */
  mode?: ShapetrisMode;
  /** Kampanya zorluğu (K19) — varsayılan "kolay". */
  campaignDifficulty?: CampaignDifficulty;
  /** Başlangıç: kampanyada bölüm no, sonsuzda sayaç. */
  startLevel?: number;
  /** İlk oyun dersi overlay'i (UC-13, K18). */
  tutorial?: boolean;
  /** Ders bitince/atlanınca (bayrak app tarafında yazılır). */
  onTutorialDone?: () => void;
}

/** Bölüm başına başlangıç süresi (sn) — başlangıç değeri, tune edilir. */
const BASE_LEVEL_SECONDS = 120;
/** Her 10 bölümde düşen süre adımı (sn). */
const LEVEL_STEP_SECONDS = 10;
/** Süre alt sınırı (sn). */
const MIN_LEVEL_SECONDS = 30;
const TICK_MS = 100;

export class ShapetrisModule extends ModuleLifecycle implements ShapetrisApi {
  private readonly difficulty: 0 | 1 | 2;
  private readonly hintHost?: ShapetrisHintHost;
  private readonly rng: () => number;
  private readonly mode: ShapetrisMode;
  private readonly campaignDifficulty: CampaignDifficulty;
  private readonly tutorial: boolean;
  private readonly onTutorialDone?: () => void;

  private board!: Board;
  private boardVersion = 0;
  private tray: TrayPiece[] = [];
  private next: number[] = [];
  private trayVersion = 0;
  /** Kampanyada bölüm no (0..99), sonsuzda sayaç. */
  private levelIndex = 0;
  private hintsUsed = 0;
  private totalScore = 0;
  private timeLeft = BASE_LEVEL_SECONDS;
  private phase: ShapetrisPhase = "playing";
  private campaignComplete = false;
  private readonly dailyDate = new Date().toISOString().slice(0, 10);

  private root: Root | null = null;
  private container: HTMLElement | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly uiListeners = new Set<() => void>();

  constructor(options: ShapetrisOptions = {}) {
    super("shapetris");
    this.difficulty = options.difficulty ?? 0;
    this.hintHost = options.hintHost;
    this.rng = mulberry32(options.seed ?? Math.floor(Math.random() * 2 ** 31));
    this.mode = options.mode ?? "endless";
    this.campaignDifficulty = options.campaignDifficulty ?? "kolay";
    this.levelIndex = options.startLevel ?? 0;
    this.tutorial = options.tutorial ?? false;
    this.onTutorialDone = options.onTutorialDone;
  }

  // --- ShapetrisApi (UI köprüsü) ---

  getSnapshot(): ShapetrisSnapshot {
    return {
      board: this.board,
      boardVersion: this.boardVersion,
      tray: this.tray,
      next: this.next,
      trayVersion: this.trayVersion,
      levelNo: this.levelIndex,
      mode: this.mode,
      campaignComplete: this.campaignComplete,
      totalScore: this.totalScore,
      hintsUsed: this.hintsUsed,
      timeLeft: this.timeLeft,
      phase: this.phase,
    };
  }

  subscribe(fn: () => void): () => void {
    this.uiListeners.add(fn);
    return () => this.uiListeners.delete(fn);
  }

  placePiece(slot: number, x: number, y: number): boolean {
    if (this.phase !== "playing") return false;
    const piece = this.pieceOf(this.tray[slot]);
    if (!applyPiece(this.board, x, y, piece)) return false;
    this.boardVersion += 1;
    this.afterBoardChange();
    this.refillSlot(slot);
    this.trayVersion += 1;
    this.notify();
    return true;
  }

  rotateSlot(slot: number): void {
    if (this.phase !== "playing") return;
    const piece = this.tray[slot];
    if (!piece) return;
    piece.rotation = (piece.rotation + 1) % 4;
    this.trayVersion += 1;
    this.notify();
  }

  async requestBorderClear(): Promise<boolean> {
    return this.requestHint("shapetris.kenar-temizle", () => clearBorder(this.board));
  }

  async requestCellDelete(x: number, y: number): Promise<boolean> {
    return this.requestHint("shapetris.hucre-sil", () => clearCell(this.board, x, y));
  }

  restartLevel(): void {
    void this.newLevel().then(() => this.notify());
  }

  nextLevel(): void {
    if (this.mode === "daily") return; // günlükte ilerleme YOK (AK-14.3)
    if (this.mode === "campaign" && this.campaignComplete) return;
    this.levelIndex += 1;
    void this.newLevel().then(() => this.notify());
  }

  // --- IGameModule yaşam döngüsü ---

  async init(): Promise<void> {
    await super.init();
    await this.newLevel();
    let frames: AtlasFrames;
    try {
      frames = await loadAtlas();
    } catch {
      throw new Error("ASSET_LOAD_FAILED: grafikler yüklenemedi");
    }
    this.container = document.createElement("div");
    this.container.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:#2E3436;touch-action:none;user-select:none;";
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
    this.root.render(
      createElement(ShapetrisRoot, {
        api: this,
        frames,
        tutorial: this.tutorial,
        onTutorialDone: this.onTutorialDone,
      }),
    );
  }

  async start(): Promise<void> {
    await super.start();
    this.startTimer();
  }

  pause(): void {
    super.pause();
    this.stopTimer();
  }

  resume(): void {
    super.resume();
    if (this.phase === "playing") this.startTimer();
  }

  exit(): void {
    this.stopTimer();
    this.root?.unmount();
    this.root = null;
    this.container?.remove();
    this.container = null;
    this.uiListeners.clear();
    super.exit();
  }

  get currentGameState(): GameModuleState {
    return this.currentState;
  }

  // --- iç mekanik ---

  /** Bölüm hedefini moda göre üretir (K16/K20): kampanya JSON, günlük tarih, sonsuz sayaç. */
  private async newLevel(): Promise<void> {
    let goal: boolean[][];
    if (this.mode === "campaign") {
      goal = await loadCampaignLevel(this.campaignDifficulty, this.levelIndex);
    } else if (this.mode === "daily") {
      goal = generateLevel(0, mulberry32(seedFromString(`gunluk.${this.dailyDate}`))).goal;
    } else {
      goal = generateLevel(this.levelIndex, mulberry32(seedFromString(`sonsuz.${this.levelIndex}`))).goal;
    }
    this.board = createBoard(goal);
    this.boardVersion += 1;
    this.hintsUsed = 0;
    this.phase = "playing";
    this.timeLeft = this.levelTime();
    const rnd = () => Math.floor(this.rng() * 7);
    this.tray = [
      { tileId: rnd(), rotation: 0 },
      { tileId: rnd(), rotation: 0 },
    ];
    this.next = [rnd(), rnd()];
    this.trayVersion += 1;
    this.startTimerIfRunning();
  }

  private levelTime(): number {
    return Math.max(MIN_LEVEL_SECONDS, BASE_LEVEL_SECONDS - Math.floor(this.levelIndex / 10) * LEVEL_STEP_SECONDS);
  }

  private pieceOf(piece: TrayPiece | undefined): PieceMatrix {
    if (!piece) return [];
    let p = PIECES[piece.tileId]!;
    for (let r = 0; r < piece.rotation; r++) p = rotateCW(p);
    return p;
  }

  private afterBoardChange(): void {
    cleanRowsCols(this.board);
    if (checkVictory(this.board)) {
      const gained = levelScore(this.hintsUsed);
      this.totalScore = addScore(this.totalScore, gained);
      this.phase = "victory";
      this.stopTimer();
      this.emit("score", { score: this.totalScore });
      if (this.mode === "campaign") {
        const done = this.levelIndex + 1 >= CAMPAIGN_LEVEL_COUNT;
        this.campaignComplete = done;
        this.emit("levelCompleted", { levelId: `shapetris.${this.campaignDifficulty}.${this.levelIndex}` });
        this.emit("saveRequested", {
          payload: {
            mode: "campaign",
            difficulty: this.campaignDifficulty,
            levelNo: this.levelIndex + 1,
            totalScore: this.totalScore,
            completed: done,
          },
        });
      } else if (this.mode === "endless") {
        this.emit("levelCompleted", { levelId: `shapetris.sonsuz.${this.levelIndex}` });
        this.emit("saveRequested", {
          payload: { mode: "endless", levelNo: this.levelIndex + 1, totalScore: this.totalScore },
        });
      } else {
        this.emit("levelCompleted", { levelId: `shapetris.gunluk.${this.dailyDate}` });
        this.emit("saveRequested", {
          payload: { mode: "daily", date: this.dailyDate, totalScore: this.totalScore },
        });
      }
    }
  }

  /** Eski getNextTile: threshold = slot (0 → difficulty>0, 1 → difficulty>1). */
  private refillSlot(slot: number): void {
    const nextId = this.next[slot]!;
    this.tray[slot] = { tileId: nextId, rotation: 0 };
    const threshold = slot === 0 ? 0 : 1;
    this.next[slot] =
      this.difficulty > threshold ? Math.floor(this.rng() * 7) : (nextId + 1) % 7;
  }

  private async requestHint(hintType: ShapetrisHintType, apply: () => boolean): Promise<boolean> {
    if (this.phase !== "playing") return false;
    this.emit("hintRequested", { hintType });
    const granted = this.hintHost ? await this.hintHost.grant(hintType) : false;
    if (!granted) return false;
    const changed = apply();
    if (changed) {
      this.hintsUsed += 1;
      this.boardVersion += 1;
    }
    this.notify();
    return changed;
  }

  private startTimerIfRunning(): void {
    if (this.currentState === "running") this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (this.phase !== "playing") return;
      this.timeLeft -= TICK_MS / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.phase = "gameover";
        this.stopTimer();
      }
      this.notify();
    }, TICK_MS);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private notify(): void {
    for (const fn of this.uiListeners) fn();
  }
}
