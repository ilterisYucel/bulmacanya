/**
 * difficulty — zorluk parametreleri + sonsuz mod ölçekleme (UC-4, K12/K13, §4.4).
 *
 * Tek kaynak: `DIFFICULTY_PARAMS`. Sonsuz modda her 20 katta bir üst kademeye
 * doğru lerp edilir; tavan Zor (FR-4.4). Diğer modlarda taban sabittir.
 *
 * Yan etkiler: YOK.
 */
import type { Difficulty, GameMode, PhysicsParams } from "./types";

export const DIFFICULTY_PARAMS: Record<Difficulty, PhysicsParams> = {
  kolay: {
    gravity: 6,
    rotorMaxOmega: 2.2,
    rotorTorque: 10,
    breakerRatio: 0,
    rotorRatio: 0.5,
    ropeQuota: 4,
    gapMin: 2.5,
    gapMax: 3.5,
    landingMagnet: 1.2,
    passiveDamping: 0.15,
  },
  orta: {
    gravity: 8,
    rotorMaxOmega: 3,
    rotorTorque: 14,
    breakerRatio: 0.12,
    rotorRatio: 0.33,
    ropeQuota: 2,
    gapMin: 4,
    gapMax: 5,
    landingMagnet: 0.4,
    passiveDamping: 0.12,
  },
  zor: {
    gravity: 10,
    rotorMaxOmega: 4,
    rotorTorque: 20,
    breakerRatio: 0.22,
    rotorRatio: 0.33,
    ropeQuota: 1,
    gapMin: 5,
    gapMax: 6,
    landingMagnet: 0,
    passiveDamping: 0.1,
  },
};

const TIER_ORDER: Difficulty[] = ["kolay", "orta", "zor"];

/** Sonsuz modda kaç katta bir kademe atlanır (FR-4.4). */
export const FLOORS_PER_TIER = 20;

const NUMERIC_KEYS: Array<keyof PhysicsParams> = [
  "gravity",
  "rotorMaxOmega",
  "rotorTorque",
  "breakerRatio",
  "rotorRatio",
  "ropeQuota",
  "gapMin",
  "gapMax",
  "landingMagnet",
  "passiveDamping",
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Moda + kata göre efektif parametreler.
 * Sonsuz: kademe = taban + floor(20), bant içinde bir üst kademeye lerp.
 */
export function paramsFor(
  difficulty: Difficulty,
  floor: number,
  mode: GameMode,
): PhysicsParams {
  const base = DIFFICULTY_PARAMS[difficulty];
  if (mode !== "endless") return { ...base };
  const baseIdx = TIER_ORDER.indexOf(difficulty);
  const tierIdx = Math.min(TIER_ORDER.length - 1, baseIdx + Math.floor(floor / FLOORS_PER_TIER));
  const current = DIFFICULTY_PARAMS[TIER_ORDER[tierIdx]!]!;
  if (tierIdx >= TIER_ORDER.length - 1) return { ...current };
  const next = DIFFICULTY_PARAMS[TIER_ORDER[tierIdx + 1]!]!;
  const t = (floor % FLOORS_PER_TIER) / FLOORS_PER_TIER;
  const out = { ...current } as Record<keyof PhysicsParams, number>;
  for (const key of NUMERIC_KEYS) {
    out[key] = lerp(current[key], next[key], t);
  }
  // Ayrık parametre tam sayı kalmalı (ip kotası yarım olmaz — K6).
  out.ropeQuota = Math.round(out.ropeQuota);
  return out as unknown as PhysicsParams;
}
