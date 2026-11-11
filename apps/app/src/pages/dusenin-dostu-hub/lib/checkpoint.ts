/**
 * dusenin-dostu checkpoint — hub localStorage kayıt katmanı (UC-9/FR-9.3).
 * Desen: game7-hub/lib/checkpoint. Bozuk veride varsayılan (edge).
 */
import type { Difficulty } from "@bulmacanya/games/dusenin-dostu";
import { CAMPAIGN_LEVELS } from "@bulmacanya/games/dusenin-dostu/campaign";

const CHECKPOINT_KEY = "dusenin-dostu.checkpoint";
const PROGRESS_KEY = "dusenin-dostu.progress";
const TUTORIAL_KEY = "dusenin-dostu.tutorialDone";
const DAILY_KEY = "dusenin-dostu.daily";

export interface CheckpointPayload {
  mode: string;
  difficulty: Difficulty;
  levelNo: number;
}

export interface ProgressEntry {
  difficulty: Difficulty;
  levelsDone: number;
}

const TIERS: Difficulty[] = ["kolay", "orta", "zor"];

export function readCheckpoint(): CheckpointPayload | null {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckpointPayload;
    if (
      typeof parsed.mode !== "string" ||
      !TIERS.includes(parsed.difficulty) ||
      typeof parsed.levelNo !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readProgress(): ProgressEntry[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProgressEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** saveRequested payload'ı → checkpoint + kademe ilerlemesi + günlük kilidi. */
export function writeCheckpoint(raw: unknown): void {
  const payload = raw as CheckpointPayload & { mode?: string };
  if (
    payload === null ||
    typeof payload !== "object" ||
    typeof payload.mode !== "string" ||
    typeof payload.difficulty !== "string" ||
    typeof payload.levelNo !== "number"
  ) {
    return;
  }
  try {
    if (payload.mode !== "daily") {
      localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(payload));
    }
    if (payload.mode === "campaign") {
      const progress = readProgress();
      const entry = progress.find((p) => p.difficulty === payload.difficulty);
      if (entry) {
        entry.levelsDone = Math.max(entry.levelsDone, payload.levelNo);
      } else {
        progress.push({ difficulty: payload.difficulty, levelsDone: payload.levelNo });
      }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
    if (payload.mode === "daily") {
      localStorage.setItem(DAILY_KEY, todayKey());
    }
  } catch {
    // localStorage yoksa sessiz
  }
}

export function levelsDone(difficulty: Difficulty): number {
  const entry = readProgress().find((p) => p.difficulty === difficulty);
  return Math.min(entry?.levelsDone ?? 0, CAMPAIGN_LEVELS);
}

export function isDifficultyUnlocked(difficulty: Difficulty): boolean {
  if (difficulty === "kolay") return true;
  if (difficulty === "orta") return levelsDone("kolay") >= CAMPAIGN_LEVELS;
  return levelsDone("orta") >= CAMPAIGN_LEVELS;
}

/** Devam noktası: checkpoint o kademeye aitse ondan, değilse ilerlemeden. */
export function levelNoFor(difficulty: Difficulty): number {
  const cp = readCheckpoint();
  if (cp !== null && cp.mode === "campaign" && cp.difficulty === difficulty) {
    return Math.min(cp.levelNo, CAMPAIGN_LEVELS - 1);
  }
  return Math.min(levelsDone(difficulty), CAMPAIGN_LEVELS - 1);
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dailyDone(): boolean {
  try {
    return localStorage.getItem(DAILY_KEY) === todayKey();
  } catch {
    return false;
  }
}

export function tutorialDone(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTutorialDone(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, "1");
  } catch {
    // sessiz
  }
}
