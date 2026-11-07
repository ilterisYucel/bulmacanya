/**
 * game7 checkpoint — hub'ın localStorage kayıt katmanı (UC-7, FR-7.5).
 * Desen: shapetris-hub/lib/checkpoint. Bozuk veride varsayılan (AK-7.5 edge).
 */
import type { CheckpointPayload, Game7Mode, Tier } from "@bulmacanya/games/game7";

const CHECKPOINT_KEY = "game7.checkpoint";
const PROGRESS_KEY = "game7.progress";
const TUTORIAL_KEY = "game7.tutorialDone";

export interface TierProgressEntry {
  mode: Game7Mode;
  tier: Tier;
  levelsDone: number;
}

export function readCheckpoint(): CheckpointPayload | null {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckpointPayload;
    if (
      typeof parsed.mode !== "string" ||
      typeof parsed.tier !== "string" ||
      typeof parsed.levelNo !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readProgress(): TierProgressEntry[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TierProgressEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** saveRequested payload'ı → checkpoint + tier ilerleme tablosu (AK-7.5). */
export function writeCheckpoint(raw: unknown): void {
  const payload = raw as CheckpointPayload;
  if (
    payload === null ||
    typeof payload !== "object" ||
    typeof payload.mode !== "string" ||
    typeof payload.tier !== "string" ||
    typeof payload.levelNo !== "number"
  ) {
    return; // geçersiz payload — sessiz (kontrat dışı güven sınırı)
  }
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(payload));
    const progress = readProgress();
    const entry = progress.find(
      (p) => p.mode === payload.mode && p.tier === payload.tier,
    );
    if (entry) {
      entry.levelsDone = Math.max(entry.levelsDone, payload.levelNo);
    } else {
      progress.push({ mode: payload.mode, tier: payload.tier, levelsDone: payload.levelNo });
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage yoksa sessiz (AK-7.5 edge: varsayılan döner)
  }
}

export function tutorialDone(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

const TIER_ORDER: Tier[] = ["kolay", "orta", "zor", "uzman"];

/**
 * Mod başına "Devam Et" noktası (2026-11-07, UC-7):
 * checkpoint o moda aitse birebir {tier, levelNo}; değilse progress'ten o modun
 * en ileri tier'ı (max levelsDone, eşitlikte ileri tier); hiç yoksa kolay 0.
 */
export function resumePoint(mode: Game7Mode): { tier: Tier; levelNo: number } {
  const cp = readCheckpoint();
  if (cp !== null && cp.mode === mode) {
    return { tier: cp.tier, levelNo: cp.levelNo };
  }
  const progress = readProgress().filter((p) => p.mode === mode);
  if (progress.length > 0) {
    const best = progress.reduce((a, b) =>
      b.levelsDone > a.levelsDone ||
      (b.levelsDone === a.levelsDone && TIER_ORDER.indexOf(b.tier) > TIER_ORDER.indexOf(a.tier))
        ? b
        : a,
    );
    return { tier: best.tier, levelNo: best.levelsDone };
  }
  return { tier: "kolay", levelNo: 0 };
}

export function setTutorialDone(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, "1");
  } catch {
    // sessiz
  }
}
