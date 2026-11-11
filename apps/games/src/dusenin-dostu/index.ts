/**
 * index — DuseninDostuModule: IGameModule uygulaması + oyun döngüsü (UC-1/UC-6).
 *
 * Mimari: modül TÜM oyun durumuna sahiptir (game7 deseni); UI, Snapshot +
 * subscribe köprüsüyle beslenir. Model saftır; pixi/react yalnız DuseninDostuStage.
 *
 * - Döngü: rAF + 60Hz sabit adım (SC-3); `yavas-zaman` ipucu zaman ölçeğini 0.5 yapar.
 * - İpucu: hintRequested → hintHost.grant (modül maliyet BİLMEZ — K17).
 * - Kampanya: kat hedefi CAMPAIGN_FLOORS; yıldız = par ip sınırı (UC-6).
 */
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { GameModuleState } from "@bulmacanya/shared";
import { ModuleLifecycle } from "../lib/module-lifecycle";
import { createGame, step } from "./model/game";
import { calculateLayout } from "./model/layout";
import { attachRejection } from "./model/preview";
import { starsFor } from "./model/scoring";
import type {
  Difficulty,
  GameEvent,
  GameMode,
  GameState,
  LayoutMetrics,
} from "./model/types";
import { FIXED_DT } from "./model/types";
import { DuseninDostuStage } from "./ui/DuseninDostuStage";
import { loadAtlas } from "./ui/atlas";
import type { DuseninAtlas } from "./ui/atlas";
import { isHintValid, hintTarget } from "./model/hints";
import type { DuseninDostuHintType } from "./model/hints";
import {
  CAMPAIGN_FLOORS,
  CAMPAIGN_LEVELS,
  CAMPAIGN_PAR,
  TIME_MODE_SECONDS,
  campaignSeed,
  dailySeed,
  dateKey,
} from "./model/campaign";

export type { Difficulty, GameMode } from "./model/types";
export type { DuseninDostuHintType } from "./model/hints";
export { CAMPAIGN_FLOORS, CAMPAIGN_LEVELS, CAMPAIGN_PAR, TIME_MODE_SECONDS, dateKey };

export interface DuseninDostuHintHost {
  grant(hintType: DuseninDostuHintType): Promise<boolean>;
}

export interface DuseninDostuOptions {
  mode?: GameMode;
  difficulty?: Difficulty;
  seed?: number;
  levelNo?: number;
  hintHost?: DuseninDostuHintHost;
  tutorial?: boolean;
  onTutorialDone?: () => void;
}

/** Kampanya: kademe başına bölüm ve bölüm başına kat hedefi (K14). */

export type ModulePhase = "playing" | "victory" | "gameover";

export interface DuseninDostuSnapshot {
  state: GameState;
  layout: LayoutMetrics | null;
  viewport: { width: number; height: number };
  mode: GameMode;
  difficulty: Difficulty;
  levelNo: number;
  phase: ModulePhase;
  stars: number | null;
  par: number;
  campaignFloors: number;
  muted: boolean;
  rejection: { reason: string; until: number } | null;
  hintBrickId: number | null;
  hintUntil: number;
}

export interface DuseninDostuApi {
  getSnapshot(): DuseninDostuSnapshot;
  subscribe(fn: () => void): () => void;
  tap(brickId: number | null): "attached" | "rejected" | "ignored";
  requestHint(hintType: DuseninDostuHintType): Promise<boolean>;
  takeEvents(): GameEvent[];
  restart(): void;
  nextLevel(): void;
  quit(): void;
  setMuted(muted: boolean): void;
}

export class DuseninDostuModule extends ModuleLifecycle implements DuseninDostuApi {
  private readonly mode: GameMode;
  private readonly difficulty: Difficulty;
  private readonly hintHost?: DuseninDostuHintHost;
  private readonly tutorial: boolean;
  private readonly onTutorialDone?: () => void;
  private levelNo: number;
  private seed: number;

  private game!: GameState;
  private metrics: LayoutMetrics | null = null;
  private viewport = { width: 0, height: 0 };
  private phase: ModulePhase = "playing";
  private stars: number | null = null;
  private muted = false;
  private rejection: { reason: string; until: number } | null = null;
  private hintBrickId: number | null = null;
  private hintUntil = 0;
  private slowUntil = 0;
  private eventQueue: GameEvent[] = [];

  private root: Root | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private raf = 0;
  private lastTs = 0;
  private accumulator = 0;
  private readonly uiListeners = new Set<() => void>();

  constructor(options: DuseninDostuOptions = {}) {
    super("dusenin-dostu");
    this.mode = options.mode ?? "endless";
    this.difficulty = options.difficulty ?? "kolay";
    this.levelNo = options.levelNo ?? 0;
    this.hintHost = options.hintHost;
    this.tutorial = options.tutorial ?? false;
    this.onTutorialDone = options.onTutorialDone;
    this.seed = options.seed ?? this.computeSeed();
  }

  // --- API (UI köprüsü) ---

  getSnapshot(): DuseninDostuSnapshot {
    return {
      state: this.game,
      layout: this.metrics,
      viewport: { ...this.viewport },
      mode: this.mode,
      difficulty: this.difficulty,
      levelNo: this.levelNo,
      phase: this.phase,
      stars: this.stars,
      par: CAMPAIGN_PAR,
      campaignFloors: CAMPAIGN_FLOORS,
      muted: this.muted,
      rejection: this.rejection,
      hintBrickId: this.hintBrickId,
      hintUntil: this.hintUntil,
    };
  }

  subscribe(fn: () => void): () => void {
    this.uiListeners.add(fn);
    return () => this.uiListeners.delete(fn);
  }

  /** Dokunma: kutu → ip at; null → bırak/zıpla (K1/K18). */
  tap(brickId: number | null): "attached" | "rejected" | "ignored" {
    if (this.phase !== "playing" || this.metrics === null) return "ignored";

    if (brickId !== null) {
      const reason = attachRejection(this.game, brickId);
      if (reason !== null) {
        this.rejection = { reason, until: performance.now() + 350 };
        this.notify();
        return "rejected";
      }
    }

    const before = this.game.ropesUsedTotal;
    const hadRope = this.game.rope !== null;
    this.applyStep({ kind: "tap", brickId }, 0);
    this.accumulator = 0;
    this.notify();
    const accepted =
      this.game.ropesUsedTotal > before || (brickId === null && hadRope) || this.game.phase === "air";
    return accepted ? "attached" : "ignored";
  }

  async requestHint(hintType: DuseninDostuHintType): Promise<boolean> {
    if (!isHintValid(hintType, this.phase, this.difficulty)) return false;
    this.emit("hintRequested", { hintType });
    const granted = this.hintHost ? await this.hintHost.grant(hintType) : false;
    if (!granted) return false;

    if (hintType === "dusenin-dostu.rota-goster") {
      const next = hintTarget(this.game);
      if (next === null) return false;
      this.hintBrickId = next.id;
      this.hintUntil = performance.now() + 5000;
    } else {
      this.slowUntil = performance.now() + 5000;
    }
    this.notify();
    return true;
  }

  takeEvents(): GameEvent[] {
    const events = this.eventQueue;
    this.eventQueue = [];
    return events;
  }

  restart(): void {
    this.newGame();
    this.phase = "playing";
    this.stars = null;
    this.startLoopIfRunning();
    this.notify();
  }

  nextLevel(): void {
    this.levelNo += 1;
    this.restart();
  }

  quit(): void {
    this.exit();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.notify();
  }

  // --- IGameModule yaşam döngüsü ---

  async init(): Promise<void> {
    await super.init();
    // Ionic scroll transform'u fixed konumlandırmayı bozar (game7 deseni).
    window.scrollTo(0, 0);
    const content = document.querySelector("ion-content") as unknown as {
      scrollToTop?: (duration?: number) => Promise<void>;
    } | null;
    content?.scrollToTop?.(0);

    let atlas: DuseninAtlas;
    try {
      atlas = await loadAtlas();
    } catch {
      throw new Error("ASSET_LOAD_FAILED: grafikler yüklenemedi");
    }

    this.container = document.createElement("div");
    this.container.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:#2E2438;touch-action:none;user-select:none;";
    document.body.appendChild(this.container);

    this.viewport = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.metrics = calculateLayout({
      width: this.viewport.width > 0 ? this.viewport.width : window.innerWidth,
      height: this.viewport.height > 0 ? this.viewport.height : window.innerHeight,
    });
    this.newGame();

    this.resizeObserver = new ResizeObserver(() => this.measureViewport());
    this.resizeObserver.observe(this.container);

    this.root = createRoot(this.container);
    this.root.render(
      createElement(DuseninDostuStage, {
        api: this,
        atlas,
        tutorial: this.tutorial,
        onTutorialDone: this.onTutorialDone,
      }),
    );
  }

  async start(): Promise<void> {
    await super.start();
    this.startLoop();
  }

  pause(): void {
    super.pause();
    this.stopLoop();
  }

  resume(): void {
    super.resume();
    this.startLoopIfRunning();
  }

  exit(): void {
    this.stopLoop();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.root?.unmount();
    this.root = null;
    this.container?.remove();
    this.container = null;
    this.uiListeners.clear();
    super.exit();
  }

  // --- motor ---

  private computeSeed(): number {
    if (this.mode === "campaign") {
      return campaignSeed(this.difficulty, this.levelNo);
    }
    if (this.mode === "daily") {
      return dailySeed(new Date());
    }
    return Math.floor(Math.random() * 2 ** 31);
  }

  private newGame(): void {
    const layout =
      this.metrics ??
      calculateLayout({ width: window.innerWidth, height: window.innerHeight });
    this.metrics = layout;
    this.game = createGame({
      mode: this.mode,
      difficulty: this.difficulty,
      seed: this.seed + this.levelNo * 7919,
      worldWidth: layout.width / layout.step,
      worldHeight: layout.height / layout.step,
      targetFloor: this.mode === "campaign" ? CAMPAIGN_FLOORS : null,
      timeLeft: this.mode === "time" ? TIME_MODE_SECONDS : null,
    });
    this.rejection = null;
    this.hintBrickId = null;
    this.hintUntil = 0;
    this.slowUntil = 0;
    this.eventQueue = [];
  }

  private measureViewport(): void {
    if (this.container === null) return;
    this.viewport = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    if (this.viewport.width > 0 && this.viewport.height > 0) {
      this.metrics = calculateLayout(this.viewport);
    }
    this.notify();
  }

  private startLoop(): void {
    if (this.raf !== 0) return;
    this.lastTs = performance.now();
    this.accumulator = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - this.lastTs) / 1000);
      this.lastTs = now;
      this.advance(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private startLoopIfRunning(): void {
    if (this.currentState === GameModuleState.Running && this.phase === "playing") {
      this.startLoop();
    }
  }

  private stopLoop(): void {
    if (this.raf !== 0) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private advance(dt: number): void {
    if (this.phase !== "playing") return;
    if (this.game === undefined) return;
    const scale = performance.now() < this.slowUntil ? 0.5 : 1;
    this.accumulator += dt * scale;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < 5 && this.phase === "playing") {
      this.accumulator -= FIXED_DT;
      steps += 1;
      this.applyStep(null, FIXED_DT);
    }
    if (steps > 0) this.notify();
  }

  private applyStep(input: { kind: "tap"; brickId: number | null } | null, dt: number): void {
    const result = step(this.game, input, dt);
    this.game = result.state;
    for (const event of result.events) {
      this.eventQueue.push(event);
      if (event.type === "floorUp") {
        this.emit("score", { score: this.game.score });
        if (this.mode === "campaign" && event.floor >= CAMPAIGN_FLOORS) {
          this.completeLevel();
          return;
        }
      } else if (event.type === "over") {
        this.finishGame();
        return;
      }
    }
  }

  private completeLevel(): void {
    if (this.phase !== "playing") return;
    this.phase = "victory";
    this.stars = starsFor(this.game.ropesUsedTotal, CAMPAIGN_PAR);
    this.stopLoop();
    this.emit("score", { score: this.game.score });
    this.emit("levelCompleted", {
      levelId: `dusenin-dostu.campaign.${this.difficulty}.${this.levelNo}`,
    });
    this.emit("saveRequested", {
      payload: {
        mode: "campaign",
        difficulty: this.difficulty,
        levelNo: this.levelNo + 1,
        floorNo: this.game.floor,
        totalScore: this.game.score,
        stars: this.stars,
        completed: this.levelNo + 1 >= CAMPAIGN_LEVELS,
      },
    });
    this.notify();
  }

  private finishGame(): void {
    if (this.phase !== "playing") return;
    this.phase = "gameover";
    this.stopLoop();
    this.emit("score", { score: this.game.score });
    this.emit("saveRequested", {
      payload: {
        mode: this.mode,
        difficulty: this.difficulty,
        levelNo: this.levelNo,
        floorNo: this.game.floor,
        totalScore: this.game.score,
        coins: this.game.coins,
        completed: false,
      },
    });
    this.notify();
  }

  private notify(): void {
    for (const fn of this.uiListeners) fn();
  }
}
