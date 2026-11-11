/**
 * preview — yörünge önizleme + atış geçerliliği (UC-3, K4/FR-3.4/FR-3.5).
 *
 * - `previewLanding`: mevcut hızdan (salınıyorsa teğet) balistik ileri sarma;
 *   kesikli yay noktaları + iniş işaretçisi (SC-4).
 * - `attachRejection`: atış reddi nedenleri — menzil (K21), ip yok (K6),
 *   geçersiz hedef (kırıcı/coin), anında kopma (K4).
 * - `sweepBreaks`: mevcut ipin önümüzdeki `horizonSec` içinde kopacağı kırıcılar.
 *
 * Yan etkiler: YOK.
 */
import type { Brick, GameState, Vec2 } from "./types";
import { BRICK_SIZE, FIXED_DT, PLAYER_SIZE, ROPE_RANGE, isSolidKind } from "./types";
import { initialSwingOmega, releaseVelocity, ropePosition, segIntersectsAabb, stepSwing } from "./physics";

export type AttachRejection = "range" | "no-rope" | "invalid-target" | "immediate-break";

export interface LandingPreview {
  points: Vec2[];
  landing: Vec2 | null;
  landingBrickId: number | null;
}

/** İniş hedefi olabilir mi? (kırıcıya inilmez; coin/sandık toplanır) */
function isLandable(b: Brick): boolean {
  return b.kind === "stone" || b.kind === "rotor-cw" || b.kind === "rotor-ccw";
}

/** Kutuya atış reddedilecek mi? null = atış geçerli. */
export function attachRejection(
  state: GameState,
  brickId: number,
): AttachRejection | null {
  if (state.phase === "over") return "invalid-target";
  const brick = state.bricks.find((b) => b.id === brickId);
  if (!brick || !isSolidKind(brick.kind) || brick.kind === "breaker") {
    return "invalid-target";
  }
  const dist = Math.hypot(brick.x - state.player.x, brick.y - state.player.y);
  if (dist > ROPE_RANGE) return "range";
  if (state.ropesLeft <= 0) return "no-rope";

  // K4: atış anında kopacak ip atılmaz — ilk 0.4 sn süpürme simülasyonu.
  // İp HERHANGİ katı kutuya değince koptuğu için tüm katılar taranır.
  const angle = Math.atan2(state.player.y - brick.y, state.player.x - brick.x);
  let rope = {
    brickId,
    length: dist,
    angle,
    omega: initialSwingOmega(state.params, brick.kind, angle, dist, state.velocity),
  };
  for (let i = 0; i < 24; i++) {
    rope = stepSwing(rope, brick.kind, state.params, FIXED_DT);
    const p = ropePosition(brick, rope);
    for (const b of state.bricks) {
      if (!isSolidKind(b.kind) || b.id === brickId) continue;
      // Bedenle temas eden kutu ipi koparmaz (iniş/sekme kuralı) — atla.
      const half = (BRICK_SIZE + PLAYER_SIZE) / 2;
      if (Math.abs(p.x - b.x) < half && Math.abs(p.y - b.y) < half) continue;
      if (segIntersectsAabb(p, brick, b.x, b.y, BRICK_SIZE / 2)) return "immediate-break";
    }
  }
  return null;
}

/** Balistik iniş önizlemesi — kesikli yay + iniş noktası. */
export function previewLanding(state: GameState): LandingPreview {
  const points: Vec2[] = [];
  if (state.phase === "over") return { points, landing: null, landingBrickId: null };

  let pos: Vec2 = { ...state.player };
  let vel: Vec2 =
    state.phase === "swing" && state.rope !== null
      ? releaseVelocity(state.rope)
      : { ...state.velocity };
  const half = (BRICK_SIZE + PLAYER_SIZE) / 2;

  for (let i = 0; i < 180; i++) {
    vel = { x: vel.x, y: vel.y + state.params.gravity * FIXED_DT };
    pos = { x: pos.x + vel.x * FIXED_DT, y: pos.y + vel.y * FIXED_DT };
    if (i % 4 === 0) points.push({ ...pos });
    if (pos.y > state.worldHeight + 2 || pos.x < -5 || pos.x > state.worldWidth + 5) break;
    if (vel.y <= 0) continue; // yalnız düşerken iniş aranır
    for (const b of state.bricks) {
      if (!isLandable(b)) continue;
      if (Math.abs(pos.x - b.x) < half && Math.abs(pos.y - b.y) < half && pos.y <= b.y) {
        return {
          points,
          landing: { x: pos.x, y: b.y - BRICK_SIZE / 2 - PLAYER_SIZE / 2 },
          landingBrickId: b.id,
        };
      }
    }
  }
  return { points, landing: null, landingBrickId: null };
}

/** Mevcut ipin önümüzdeki sürede kopacağı kırıcı id'leri (K4 görseli). */
export function sweepBreaks(state: GameState, horizonSec = 1): number[] {
  if (state.rope === null) return [];
  const brick = state.bricks.find((b) => b.id === state.rope!.brickId);
  if (!brick) return [];
  let rope = { ...state.rope };
  const hits = new Set<number>();
  const steps = Math.round(horizonSec / FIXED_DT);
  for (let i = 0; i < steps; i++) {
    rope = stepSwing(rope, brick.kind, state.params, FIXED_DT);
    const p = ropePosition(brick, rope);
    for (const b of state.bricks) {
      if (!isSolidKind(b.kind) || b.id === brick.id) continue;
      if (segIntersectsAabb(p, brick, b.x, b.y, BRICK_SIZE / 2)) hits.add(b.id);
    }
  }
  return [...hits];
}
