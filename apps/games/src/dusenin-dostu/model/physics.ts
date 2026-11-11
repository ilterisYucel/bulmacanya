/**
 * physics — saf fizik çekirdeği (UC-2, K2/K24). PIXI/DOM import'u YOK.
 *
 * - `mulberry32`: seed'li PRNG (determinizm — SC-3; Math.random YASAK).
 * - `stepSwing`: motorlu rotor (sabit tork, ω_max) / pasif kanca (sönümlü sarkaç).
 *   Denklem: pasif θ'' = (g/L)·cosθ − c·ω; rotor θ'' = ±tork. θ: +x ekseninden,
 *   y AŞAĞI olduğundan artan θ görsel olarak saat yönüdür.
 * - `ropePosition`: merkez + L·(cosθ, sinθ).
 * - `releaseVelocity`: teğet v = L·ω·(−sinθ, cosθ).
 * - `segIntersectsAabb`: Liang-Barsky; ip-kırıcı süpürme testi.
 * - `integrateAir`: yarı-örtük Euler (vy önce).
 *
 * Yan etkiler: YOK (saf fonksiyonlar).
 */
import type { BrickKind, PhysicsParams, Rope, Vec2 } from "./types";

/** Deterministik PRNG — aynı seed aynı dizi (SC-3). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Segment (a→b) eksen-hizalı kare (cx±half) ile kesişir mi? Liang-Barsky. */
export function segIntersectsAabb(
  a: Vec2,
  b: Vec2,
  cx: number,
  cy: number,
  half: number,
): boolean {
  const minX = cx - half;
  const maxX = cx + half;
  const minY = cy - half;
  const maxY = cy + half;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  return (
    clip(-dx, a.x - minX) &&
    clip(dx, maxX - a.x) &&
    clip(-dy, a.y - minY) &&
    clip(dy, maxY - a.y)
  );
}

/** Bir simülasyon adımı sarkaç güncellemesi (saf; yeni Rope döner). */
export function stepSwing(
  rope: Rope,
  kind: BrickKind,
  params: PhysicsParams,
  dt: number,
): Rope {
  const r: Rope = { ...rope };
  if (kind === "rotor-cw" || kind === "rotor-ccw") {
    const dir = kind === "rotor-cw" ? 1 : -1;
    r.omega += dir * params.rotorTorque * dt;
    const max = params.rotorMaxOmega;
    r.omega = Math.max(-max, Math.min(max, r.omega));
  } else {
    r.omega +=
      ((params.gravity / Math.max(0.01, r.length)) * Math.cos(r.angle) -
        params.passiveDamping * r.omega) *
      dt;
  }
  r.angle += r.omega * dt;
  return r;
}

/** Kutunun merkezi etrafındaki ipin oyuncu ucunun konumu. */
export function ropePosition(center: Vec2, rope: Rope): Vec2 {
  return {
    x: center.x + rope.length * Math.cos(rope.angle),
    y: center.y + rope.length * Math.sin(rope.angle),
  };
}

/** Bırakma anındaki teğet hız. */
export function releaseVelocity(rope: Rope): Vec2 {
  return {
    x: -Math.sin(rope.angle) * rope.omega * rope.length,
    y: Math.cos(rope.angle) * rope.omega * rope.length,
  };
}

/**
 * Tutunma anındaki ilk açısal hız (Rev-1, 2026-11-10):
 * - Motorlu rotor: anında ±ω_max (motor hissi; sıfırdan hızlanma beklemesi yok).
 * - Pasif taş: mevcut teğet momentum korunur — ω₀ = v_tan / L, tavan 0.8×ω_max.
 * Düşerken tutunursan savrulma devam eder; enerji sıfırlanmaz.
 */
export function initialSwingOmega(
  params: PhysicsParams,
  kind: BrickKind,
  angle: number,
  length: number,
  velocity: Vec2,
): number {
  if (kind === "rotor-cw" || kind === "rotor-ccw") {
    return (kind === "rotor-cw" ? 1 : -1) * params.rotorMaxOmega;
  }
  const vt = -Math.sin(angle) * velocity.x + Math.cos(angle) * velocity.y;
  const cap = params.rotorMaxOmega * 0.8;
  return Math.max(-cap, Math.min(cap, vt / Math.max(0.01, length)));
}

/** Havada balistik adım (yarı-örtük Euler). */
export function integrateAir(
  pos: Vec2,
  vel: Vec2,
  gravity: number,
  dt: number,
): { pos: Vec2; vel: Vec2 } {
  const vy = vel.y + gravity * dt;
  return {
    pos: { x: pos.x + vel.x * dt, y: pos.y + vy * dt },
    vel: { x: vel.x, y: vy },
  };
}
