/**
 * index — Game7Module: IGameModule uygulaması + oyun motoru (UC-1..UC-7).
 *
 * Mimari: modül TÜM oyun durumuna sahiptir (shapetris deseni); UI, Snapshot +
 * subscribe köprüsüyle beslenir. Model katmanı saf; pixi/ui yalnız Game7Stage'de.
 *
 * - Timer: tek setInterval — balon hareketi (tüm modlar) + Klasik süre sayacı.
 * - İpucu akışı: hintRequested → hintHost.grant (modül maliyet BİLMEZ — K10).
 * - Kurtarma (sure-ekle/hak-iade) yalnız fail anında teklif edilir (K10/UC-4).
 */
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { GameModuleState } from "@bulmacanya/shared";
import { ModuleLifecycle } from "../lib/module-lifecycle";
import { Game7Stage } from "./ui/Game7Stage";
import { loadAtlas } from "./ui/atlas";
import type { Game7Atlas } from "./ui/atlas";
import { buildLetterPool } from "./model/letter-pool";
import type { LetterPool } from "./model/letter-pool";
import { buildPattern } from "./model/patterns";
import type { Pattern } from "./model/patterns";
import { checkSlotWord, dedektifSinyal } from "./model/word-check";
import type { Signal } from "./model/word-check";
import {
  LevelDataError,
  WORD_LIST,
  candidatesFor,
  pickWord,
  wordsMatching,
} from "./model/words";
import type { Game7Mode, Tier } from "./model/words";
import { SlotBoard } from "./model/slots";
import { BalloonField } from "./model/balloons";
import { balloonSize, calculateLayout } from "./model/layout";
import type { LayoutMetrics } from "./model/layout";
import { addScore, applyHintPenalty, completionBonus, wordScore } from "./model/scoring";
import { TIER_LEVELS, tierParams } from "./model/progression";
import type { TierParams } from "./model/progression";
import type {
  DropOutcome,
  Game7Api,
  Game7HintType,
  Game7Phase,
  Game7Snapshot,
  SubmitOutcome,
} from "./model/api-types";

export type { Game7HintType } from "./model/api-types";
export type { Game7Mode, Tier } from "./model/words";
export type { CheckpointPayload } from "./model/progression";
export { TIER_LEVELS, isTierCompleted, isTierUnlocked } from "./model/progression";
export type { TierProgressEntry } from "./model/progression";

export interface Game7HintHost {
  grant(hintType: Game7HintType): Promise<boolean>;
}

export interface Game7Options {
  mode?: Game7Mode;
  tier?: Tier;
  levelNo?: number;
  hintHost?: Game7HintHost;
  seed?: number;
  tutorial?: boolean;
  onTutorialDone?: () => void;
}

/** Balon süzülme taban hızı (px/s) — başlangıç değeri, tune edilir (K18). */
const BASE_BALLOON_SPEED = 60;
/** Dedektif/Sabit rahat tempo (K18). */
const RELAXED_BALLOON_SPEED = 40;
/** Kurtarma: +15 saniye (K10). */
const RESCUE_SECONDS = 15;
/** Motor tick (ms) — balon hareketi + Klasik süre. Başlangıç: 50 (20fps). */
const TICK_MS = 50;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Game7Module extends ModuleLifecycle implements Game7Api {
  private readonly mode: Game7Mode;
  private readonly tier: Tier;
  private readonly hintHost?: Game7HintHost;
  private readonly rng: () => number;
  private readonly tutorial: boolean;
  private readonly onTutorialDone?: () => void;
  private levelNo: number;

  private params!: TierParams;
  private levelWords: string[] = [];
  private targetWord: string | null = null;
  private category: string | null = null;
  private candidates: string[] = [];
  private matching: string[] = [];
  private pattern: Pattern | null = null;
  private revealed: (string | null)[] = [];
  private pool!: LetterPool;
  private board!: SlotBoard;
  private field!: BalloonField;
  private metrics: LayoutMetrics | null = null;

  private phase: Game7Phase = "playing";
  private totalScore = 0;
  private hintsUsed = 0;
  private sureLeft: number | null = null;
  private hakLeft: number | null = null;
  private canLeft: number | null = null;
  private wordsDone = 0;
  private wordsTarget = 1;
  private signal: (Signal | null)[] | null = null;
  private lastWord: string | null = null;
  private muted = false;

  private root: Root | null = null;
  private container: HTMLElement | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly uiListeners = new Set<() => void>();
  private resizeObserver: ResizeObserver | null = null;
  /** Gerçek görsel kutu — container'dan ölçülür (window.innerHeight DEĞİL). */
  private viewport = { width: 0, height: 0 };

  constructor(options: Game7Options = {}) {
    super("game7");
    this.mode = options.mode ?? "klasik";
    this.tier = options.tier ?? "kolay";
    this.hintHost = options.hintHost;
    this.rng = mulberry32(options.seed ?? Math.floor(Math.random() * 2 ** 31));
    this.levelNo = options.levelNo ?? 0;
    this.tutorial = options.tutorial ?? false;
    this.onTutorialDone = options.onTutorialDone;
  }

  // --- Game7Api (UI köprüsü) ---

  getSnapshot(): Game7Snapshot {
    return {
      mode: this.mode,
      tier: this.tier,
      levelNo: this.levelNo,
      phase: this.phase,
      targetWord: this.targetWord,
      category: this.category,
      pattern: this.pattern,
      revealed: [...this.revealed],
      slots: this.board.letters(),
      balloons: this.field.all().map((b) => ({
        id: b.id,
        letter: b.letter,
        state: b.state,
        x: b.x,
        y: b.y,
        slotIndex: b.slotIndex,
      })),
      totalScore: this.totalScore,
      hintsUsed: this.hintsUsed,
      sureLeft: this.sureLeft,
      hakLeft: this.hakLeft,
      canLeft: this.canLeft,
      wordsDone: this.wordsDone,
      wordsTarget: this.wordsTarget,
      signal: this.signal,
      lastWord: this.lastWord,
      muted: this.muted,
      layout: this.metrics,
      viewport: { ...this.viewport },
    };
  }

  subscribe(fn: () => void): () => void {
    this.uiListeners.add(fn);
    return () => this.uiListeners.delete(fn);
  }

  dragStart(id: number): boolean {
    if (this.phase !== "playing") return false;
    return this.field.beginDrag(id);
  }

  /**
   * Balonu slota bırakır (kutu seçimi UI'da dikdörtgen-kesişim testiyle yapılır).
   * `slotIndex: null` = serbest bırak; kilitli/yanlış harf modülde reddedilir (K22/K23).
   */
  dropIntoSlot(id: number, slotIndex: number | null): DropOutcome {
    if (this.phase !== "playing") return { kind: "none" };
    const b = this.field.find(id);
    if (b === undefined || b.state !== "DRAG") return { kind: "none" };
    if (slotIndex === null) {
      this.field.endDrag();
      return { kind: "released" };
    }
    const expected =
      this.mode === "klasik" && this.targetWord !== null
        ? [...this.targetWord]
        : undefined;
    const res = this.board.place(b.id, b.letter, slotIndex, expected);
    if (!res.ok) {
      this.field.endDrag();
      return { kind: res.reason === "locked" ? "locked" : "wrong-letter" };
    }
    if (res.displaced !== undefined) this.field.freeFromSlot(res.displaced.balloonId);
    this.field.setToSlot(b.id, slotIndex);
    if (this.mode === "klasik") {
      const check = checkSlotWord(this.board.letters(), {
        mode: "klasik",
        targetWord: this.targetWord ?? undefined,
      });
      if (check.matched) {
        this.completeKlasikWord();
        return { kind: "snapped", popped: true };
      }
    }
    this.notify();
    return { kind: "snapped" };
  }

  pullFromSlot(id: number): void {
    if (this.phase !== "playing") return;
    const b = this.field.find(id);
    if (b === undefined || b.state !== "SET") return;
    this.board.removeByBalloon(id);
    this.field.freeFromSlot(id);
    this.notify();
  }

  submit(): SubmitOutcome {
    if (this.phase !== "playing" || this.mode === "klasik") return { kind: "none" };
    if (!this.board.isFull()) return { kind: "none" };
    const ctx =
      this.mode === "dedektif"
        ? ({ mode: "dedektif", candidates: this.candidates } as const)
        : ({
            mode: "sabit",
            pattern: this.pattern ?? undefined,
            tier: this.tier,
          } as const);
    const check = checkSlotWord(this.board.letters(), ctx);
    if (check.matched) {
      this.freeAllSlots();
      this.completeLevel();
      return { kind: "matched", word: check.word };
    }
    if (this.mode === "dedektif") {
      this.hakLeft = (this.hakLeft ?? 0) - 1;
      this.signal = dedektifSinyal(this.board.letters(), this.candidates, this.tier);
    } else {
      this.canLeft = (this.canLeft ?? 0) - 1;
    }
    this.lastWord = check.word;
    if ((this.hakLeft ?? 1) <= 0 || (this.canLeft ?? 1) <= 0) {
      this.phase = "gameover";
      this.stopTimer();
    }
    this.notify();
    return { kind: "wrong", word: check.word, signal: this.signal ?? undefined };
  }

  async requestHint(hintType: Game7HintType): Promise<boolean> {
    const valid =
      (hintType === "game7.sure-ekle" && this.mode === "klasik" && this.phase === "gameover") ||
      (hintType === "game7.hak-iade" &&
        (this.mode === "dedektif" || this.mode === "sabit") &&
        this.phase === "gameover") ||
      (hintType === "game7.harf-vurgula" && this.mode === "klasik" && this.phase === "playing") ||
      (hintType === "game7.harf-ac" && this.mode !== "klasik" && this.phase === "playing");
    if (!valid) return false;
    this.emit("hintRequested", { hintType });
    const granted = this.hintHost ? await this.hintHost.grant(hintType) : false;
    if (!granted) return false;
    this.hintsUsed += 1;
    if (hintType === "game7.sure-ekle") {
      this.sureLeft = RESCUE_SECONDS;
      this.phase = "playing";
      this.startTimer();
    } else if (hintType === "game7.hak-iade") {
      if (this.mode === "dedektif") this.hakLeft = 1;
      else this.canLeft = 1;
      this.phase = "playing";
    } else if (hintType === "game7.harf-ac") {
      this.revealPosition();
    }
    // harf-vurgula: durum yok — UI snapshot'tan hedefi hesaplar
    this.notify();
    return true;
  }

  restart(): void {
    this.newLevel();
    this.notify();
  }

  nextLevel(): void {
    this.levelNo += 1;
    this.newLevel();
    this.notify();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.notify();
  }

  // --- IGameModule yaşam döngüsü ---

  async init(): Promise<void> {
    await super.init();
    // Ionic scroll içeriğinin transform'u fixed konumlandırmayı bozabiliyor
    // (2026-11-07): oyun kurulmadan scroll en üste sıfırlanır — hub tarafının yedeği.
    window.scrollTo(0, 0);
    const content = document.querySelector("ion-content") as unknown as {
      scrollToTop?: (duration?: number) => Promise<void>;
    } | null;
    content?.scrollToTop?.(0);
    this.newLevel();
    let atlas: Game7Atlas;
    try {
      atlas = await loadAtlas();
    } catch {
      throw new Error("ASSET_LOAD_FAILED: grafikler yüklenemedi");
    }
    this.container = document.createElement("div");
    this.container.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:#2E3436;touch-action:none;user-select:none;";
    document.body.appendChild(this.container);
    // Gerçek görsel kutuyu ölç — window.innerHeight hub/safe-area farklarında
    // yanıltabiliyor (2026-11-07); değişimlerde layout yenilenir.
    this.measureViewport();
    this.resizeObserver = new ResizeObserver(() => this.measureViewport());
    this.resizeObserver.observe(this.container);
    this.root = createRoot(this.container);
    this.root.render(
      createElement(Game7Stage, {
        api: this,
        atlas,
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
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.root?.unmount();
    this.root = null;
    this.container?.remove();
    this.container = null;
    this.uiListeners.clear();
    super.exit();
  }

  // --- iç mekanik ---

  /** Bölüm kurulumu — moda göre hedef-set + havuz + slot + sayaçlar (UC-1/UC-3/UC-4). */
  private newLevel(): void {
    this.params = tierParams(this.mode, this.tier);
    const [minLen, maxLen] = this.params.uzunluk;
    this.phase = "playing";
    this.hintsUsed = 0;
    this.signal = null;
    this.lastWord = null;
    this.revealed = [];
    this.wordsDone = 0;

    if (this.mode === "klasik") {
      this.wordsTarget = this.params.kelimeSayisi ?? 2;
      this.levelWords = Array.from({ length: this.wordsTarget }, () =>
        pickWord(this.tier, minLen, maxLen, this.rng),
      );
      this.targetWord = this.levelWords[0]!;
      this.category = null;
      this.pattern = null;
      this.pool = buildLetterPool(
        { mode: this.mode, targetWords: this.levelWords, distractorRatio: this.params.celdirici },
        this.rng,
      );
      this.board = new SlotBoard(this.targetWord.length);
      this.sureLeft = this.params.sure ?? 90;
      this.hakLeft = null;
      this.canLeft = null;
    } else if (this.mode === "dedektif") {
      const len = minLen + Math.floor(this.rng() * (maxLen - minLen + 1));
      const cats = [
        ...new Set(
          WORD_LIST.filter(
            (w) =>
              w.tier === this.tier && w.word.length === len && w.category !== undefined,
          ).map((w) => w.category!),
        ),
      ];
      if (cats.length === 0) {
        throw new LevelDataError(
          `dedektif: tier=${this.tier} uzunluk=${len} için kategori yok`,
        );
      }
      const category = cats[Math.floor(this.rng() * cats.length)]!;
      this.category = category;
      this.candidates = candidatesFor(category, len, this.tier);
      this.targetWord = null;
      this.pattern = null;
      this.pool = buildLetterPool(
        { mode: this.mode, targetWords: this.candidates, distractorRatio: this.params.celdirici },
        this.rng,
      );
      this.board = new SlotBoard(len);
      this.sureLeft = null;
      this.hakLeft = this.params.hak ?? 3;
      this.canLeft = null;
    } else {
      const word = pickWord(this.tier, minLen, maxLen, this.rng);
      this.pattern = buildPattern(word, this.rng, this.params.sabitOran);
      this.matching = wordsMatching(this.pattern, this.tier);
      this.targetWord = null; // gizli — desen yalnız üretim için
      this.category = null;
      this.pool = buildLetterPool(
        {
          mode: this.mode,
          targetWords: this.matching,
          pattern: this.pattern,
          distractorRatio: this.params.celdirici,
        },
        this.rng,
      );
      this.board = new SlotBoard(word.length, this.pattern);
      this.sureLeft = null;
      this.hakLeft = null;
      this.canLeft = this.params.can ?? 3;
    }

    this.recomputeMetrics();
    const area = this.metrics!.balloonArea;
    this.field = new BalloonField(this.pool, this.rng, {
      width: area.width,
      height: area.height,
    });
    // Süre-dolumu restart düzeltmesi (2026-11-07): gameover/victory'de stopTimer
    // çağrılmıştı; bölüm yeniden kurulunca timer modül Running ise geri başlar.
    this.startTimerIfRunning();
  }

  private recomputeMetrics(): void {
    // Gerçek görsel kutu (container) boyutu — ölçülmediyse window'a düş (init öncesi).
    const w = this.viewport.width > 0 ? this.viewport.width : Math.min(window.innerWidth, 480);
    const h = this.viewport.height > 0 ? this.viewport.height : window.innerHeight;
    this.metrics = calculateLayout({ width: w, height: h }, this.board.count);
  }

  /** Container boyutunu ölçer + değişimlerde layout'u yeniler (shapetris deseni). */
  private measureViewport(): void {
    if (this.container === null) return;
    this.viewport = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.recomputeMetrics();
    this.notify();
  }

  private tick(): void {
    if (this.phase !== "playing" || this.metrics === null) return;
    const speed =
      this.mode === "klasik"
        ? (this.params.hiz ?? 1) * BASE_BALLOON_SPEED
        : RELAXED_BALLOON_SPEED;
    const topMargin = balloonSize(this.metrics).height * 2;
    this.field.tick(TICK_MS, speed, topMargin);
    if (this.mode === "klasik" && this.sureLeft !== null) {
      this.sureLeft = Math.max(0, this.sureLeft - TICK_MS / 1000);
      if (this.sureLeft <= 0) {
        this.phase = "gameover";
        this.stopTimer();
      }
    }
    this.notify();
  }

  private completeKlasikWord(): void {
    this.freeAllSlots();
    this.wordsDone += 1;
    if (this.wordsDone >= this.wordsTarget) {
      this.completeLevel();
      return;
    }
    // DEĞİŞMEZ: yeni hedef kelimenin UZUNLUĞUYLA yeni tahta + yeniden layout —
    // kelime uzunluğu değişebilir (DAĞ 3 → AYNA 4); eski slot sayısıyla kalmak
    // 4. harfi yerleştirilemez yapardı (2026-11-07 bug düzeltmesi).
    this.targetWord = this.levelWords[this.wordsDone]!;
    this.board = new SlotBoard(this.targetWord.length);
    this.recomputeMetrics();
    this.notify();
  }

  private freeAllSlots(): void {
    for (const b of this.field.all()) {
      if (b.state === "SET") this.field.freeFromSlot(b.id);
    }
  }

  private completeLevel(): void {
    this.stopTimer();
    this.phase = "victory";
    const gained = this.levelGained();
    this.totalScore = addScore(this.totalScore, gained);
    this.emit("score", { score: this.totalScore });
    this.emit("levelCompleted", {
      levelId: `game7.${this.mode}.${this.tier}.${this.levelNo}`,
    });
    this.emit("saveRequested", {
      payload: {
        mode: this.mode,
        tier: this.tier,
        levelNo: this.levelNo + 1,
        totalScore: this.totalScore,
        completed: this.levelNo + 1 >= TIER_LEVELS,
      },
    });
    this.notify();
  }

  private levelGained(): number {
    if (this.mode === "klasik") {
      let points = 0;
      for (const w of this.levelWords) points += wordScore("klasik", w.length);
      return applyHintPenalty(
        points + completionBonus("klasik", this.sureLeft ?? 0),
        this.hintsUsed,
      );
    }
    const remaining = this.mode === "dedektif" ? (this.hakLeft ?? 0) : (this.canLeft ?? 0);
    const len = this.board.count;
    return applyHintPenalty(
      wordScore(this.mode, len) + completionBonus(this.mode, remaining),
      this.hintsUsed,
    );
  }

  /** harf-ac: önce tüm adaylarda AYNI olan pozisyonu açar (kesin bilgi). */
  private revealPosition(): void {
    const list = this.mode === "dedektif" ? this.candidates : this.matching;
    const len = list[0]?.length ?? 0;
    for (let i = 0; i < len; i++) {
      if (this.revealed[i] !== null && this.revealed[i] !== undefined) continue;
      const ch = list[0]![i]!;
      if (list.every((w) => w[i] === ch)) {
        this.revealed[i] = ch;
        return;
      }
    }
    // shortcut: kesin pozisyon yoksa en sık harf açılır (kesinlik garantisi yok)
    for (let i = 0; i < len; i++) {
      if (this.revealed[i] !== null && this.revealed[i] !== undefined) continue;
      const freq = new Map<string, number>();
      for (const w of list) freq.set(w[i]!, (freq.get(w[i]!) ?? 0) + 1);
      const best = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]![0];
      this.revealed[i] = best;
      return;
    }
  }

  private startTimer(): void {
    if (this.timerId !== null) return;
    this.timerId = setInterval(() => this.tick(), TICK_MS);
  }

  /** Yalnız modül Running iken timer'ı başlatır (shapetris deseni). */
  private startTimerIfRunning(): void {
    if (this.currentState === GameModuleState.Running) this.startTimer();
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
