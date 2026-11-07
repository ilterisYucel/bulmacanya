/**
 * shapetris checkpoint — hub'ın localStorage kayıt katmanı (K21, UC-12).
 * Shell'in saveRequested payload'ı buradan okunur/yazılır; backend FAZ-1'de
 * aynı payload'ı alır — modül DEĞİŞMEZ.
 */

export type CampaignDifficulty = "kolay" | "orta" | "zor";

export interface ShapetrisCheckpoint {
  mode: "campaign" | "endless" | "daily";
  difficulty?: CampaignDifficulty;
  levelNo: number;
  totalScore: number;
  completed?: boolean;
}

const CHECKPOINT_KEY = "shapetris.checkpoint";
const COMPLETED_KEY = "shapetris.completed";
const TUTORIAL_KEY = "shapetris.tutorialDone";
const DAILY_KEY = "shapetris.dailyDone";

function storage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function readCheckpoint(): ShapetrisCheckpoint | null {
  const raw = storage()?.getItem(CHECKPOINT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ShapetrisCheckpoint;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** saveRequested payload'ını kaydeder; kampanya tamamlanma bayrağını ayrı tutar. */
export function writeCheckpoint(payload: unknown): void {
  const store = storage();
  if (!store) return;
  if (typeof payload !== "object" || payload === null) return;
  const p = payload as Partial<ShapetrisCheckpoint>;
  if (p.mode === "campaign" && p.difficulty && p.completed) {
    const completed = readCompleted();
    completed[p.difficulty] = true;
    store.setItem(COMPLETED_KEY, JSON.stringify(completed));
  }
  if (p.mode === "daily" && p.totalScore !== undefined) {
    store.setItem(DAILY_KEY, JSON.stringify({ date: (p as { date?: string }).date, totalScore: p.totalScore }));
    return; // günlük checkpoint'e yazılmaz (ilerleme yok)
  }
  store.setItem(CHECKPOINT_KEY, JSON.stringify(p));
}

export type CompletedMap = Record<CampaignDifficulty, boolean>;

export function readCompleted(): CompletedMap {
  const base: CompletedMap = { kolay: false, orta: false, zor: false };
  const raw = storage()?.getItem(COMPLETED_KEY);
  if (!raw) return base;
  try {
    return { ...base, ...(JSON.parse(raw) as Partial<CompletedMap>) };
  } catch {
    return base;
  }
}

export function tutorialDone(): boolean {
  return storage()?.getItem(TUTORIAL_KEY) === "1";
}

export function setTutorialDone(): void {
  storage()?.setItem(TUTORIAL_KEY, "1");
}

export function readDailyDone(): { date: string; totalScore: number } | null {
  const raw = storage()?.getItem(DAILY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { date: string; totalScore: number };
  } catch {
    return null;
  }
}

/** Bugünün tarihi (günlük puzzle tohumu) — YYYY-MM-DD yerel saatle. */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
