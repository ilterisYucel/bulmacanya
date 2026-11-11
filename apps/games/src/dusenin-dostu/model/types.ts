/**
 * types — Düşenin Dostu saf model tipleri (UC-2/UC-5, K1-K24).
 *
 * Birim sistemi: model TÜM koordinatları "step" biriminde tutar (layout.step →
 * piksel). Yerçekimi step/s², mesafeler step. Böylece fizik viewport'tan bağımsız
 * ve unit test edilebilir (K19).
 *
 * Yan etkiler: YOK — yalnız tip tanımları.
 */

/** 2B vektör (step birimi; y aşağı artar). */
export interface Vec2 {
  x: number;
  y: number;
}

/** Kutu tipleri (K5, UC-5). `coin` ve `chest` çarpışmasız TOPLANIR. */
export type BrickKind = "stone" | "rotor-cw" | "rotor-ccw" | "breaker" | "chest" | "coin";

/** Katı kutu mu? (ip koparır, iniş/sektirme yapılır) — chest/coin değil. */
export function isSolidKind(kind: BrickKind): boolean {
  return kind === "stone" || kind === "rotor-cw" || kind === "rotor-ccw" || kind === "breaker";
}

/** Tek kutu. `used`: sandık açıldı / coin toplandı. */
export interface Brick {
  id: number;
  kind: BrickKind;
  x: number;
  y: number;
  used: boolean;
}

/** Oyun modları (K12). */
export type GameMode = "endless" | "campaign" | "time" | "daily";

/** Zorluk kademeleri (K13). */
export type Difficulty = "kolay" | "orta" | "zor";

/** Model fazı. `over` = oyun bitti (ölüm/süre). */
export type Phase = "air" | "swing" | "ground" | "over";

/** Ölüm nedenleri (UC-5/UC-6). */
export type DeathReason = "fall" | "breaker" | "out-of-rope" | "time";

/** Denge parametreleri — tek kaynak `difficulty.ts` (§4.4). */
export interface PhysicsParams {
  /** step/s² */
  gravity: number;
  /** rad/s tavan (motorlu rotor) */
  rotorMaxOmega: number;
  /** rad/s² motor torku */
  rotorTorque: number;
  /** 0..1 kırıcı üretim oranı */
  breakerRatio: number;
  /** 0..1 rotor üretim oranı (Rev-3) */
  rotorRatio: number;
  /** kat başına ip (K6) */
  ropeQuota: number;
  /** dikey kutu aralığı min (step) */
  gapMin: number;
  /** dikey kutu aralığı max (step) */
  gapMax: number;
  /** iniş mıknatısı (step; 0 = kapalı) */
  landingMagnet: number;
  /** pasif sarkaç sönümü (1/s) */
  passiveDamping: number;
}

/** Responsive ölçüler (K19) — piksel. */
export interface LayoutMetrics {
  width: number;
  height: number;
  step: number;
  brickSize: number;
  playerSize: number;
  ropeRange: number;
  scrollStep: number;
}

/** Aktif ip — kutu merkezine sabit uzunluk (K2). */
export interface Rope {
  brickId: number;
  length: number;
  angle: number;
  omega: number;
}

/** Saf oyun durumu — immutable; `step` yeni durum döner (SC-3). */
export interface GameState {
  player: Vec2;
  velocity: Vec2;
  phase: Phase;
  rope: Rope | null;
  bricks: Brick[];
  floor: number;
  ropesLeft: number;
  ropesUsedTotal: number;
  chain: number;
  coins: number;
  score: number;
  /** Zamana Karşı: kalan saniye; diğer modlarda null. */
  timeLeft: number | null;
  /** Kampanya: hedef kat sayısı; diğer modlarda null. */
  targetFloor: number | null;
  mode: GameMode;
  difficulty: Difficulty;
  params: PhysicsParams;
  worldWidth: number;
  worldHeight: number;
  seed: number;
  nextBrickId: number;
  egg404: boolean;
  deathReason: DeathReason | null;
}

/** Tek girdi türü: dokunma (K18). `brickId: null` = boşluğa tap. */
export interface Input {
  kind: "tap";
  brickId: number | null;
}

/** Model olayları — UI FX/ses ve modül event'leri bunlardan türetilir. */
export type GameEvent =
  | { type: "attach"; brickId: number; chain: number; ropesLeft: number }
  | { type: "release" }
  | { type: "land"; brickId: number }
  | { type: "ropeBreak"; brickId: number }
  | { type: "coin" }
  | { type: "chest" }
  | { type: "floorUp"; floor: number }
  | { type: "egg404" }
  | { type: "over"; reason: DeathReason };

/** Model sabitleri. */
export const BRICK_SIZE = 1.5;
export const PLAYER_SIZE = 1.5;
/** İp menzili (K21) — step. */
export const ROPE_RANGE = 6;
/** Zıplama itkisi — step/s (negatif = yukarı). */
export const HOP_VELOCITY = -8;
/** Sabit simülasyon adımı (s) — SC-3. */
export const FIXED_DT = 1 / 60;
/** Maksimum dt (s) — kare atlamada clamp. */
export const MAX_DT = 0.05;
