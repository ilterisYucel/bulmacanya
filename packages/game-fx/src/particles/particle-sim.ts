/**
 * particle-sim — SAF parçacık simülasyonu (FAZ-GAME-FX-SPEC UC-1).
 *
 * Sözleşme:
 * - `spawnParticle` deterministiktir: aynı spec + aynı rng dizisi → aynı durum.
 * - `simulateParticle` yalnız kendi durumunu mutasyonla ilerletir; dt ≤ 0'da no-op.
 * - Ömür bittiğinde `active = false` olur; alfa, ömrün son `fadeOutMs` penceresinde 1→0 iner.
 */
export interface BurstSpec {
  count: number;
  /** px/s, [min, max] */
  speed: readonly [number, number];
  /** radyan, [min, max] */
  angle: readonly [number, number];
  /** px/s² (pozitif = aşağı) */
  gravity: number;
  /** 0..1: saniyede korunan hız oranı (1 = sürtünme yok) */
  drag: number;
  /** ms, [min, max] */
  lifeMs: readonly [number, number];
  /** son N ms'de alfa 1→0 */
  fadeOutMs: number;
  /** tekdüze ölçek, [min, max] */
  scale: readonly [number, number];
}

export interface ParticleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ageMs: number;
  lifeMs: number;
  fadeOutMs: number;
  gravity: number;
  drag: number;
  scale: number;
  active: boolean;
}

function lerp(range: readonly [number, number], t: number): number {
  return range[0] + (range[1] - range[0]) * t;
}

export function spawnParticle(
  spec: BurstSpec,
  x: number,
  y: number,
  rng: () => number,
): ParticleState {
  const a = lerp(spec.angle, rng());
  const speed = lerp(spec.speed, rng());
  return {
    x,
    y,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    ageMs: 0,
    lifeMs: lerp(spec.lifeMs, rng()),
    fadeOutMs: spec.fadeOutMs,
    gravity: spec.gravity,
    drag: spec.drag,
    scale: lerp(spec.scale, rng()),
    active: true,
  };
}

export function simulateParticle(p: ParticleState, dtMs: number): void {
  if (!p.active || dtMs <= 0) return;
  p.ageMs += dtMs;
  const dt = dtMs / 1000;
  p.vy += p.gravity * dt;
  const keep = Math.pow(p.drag, dt);
  p.vx *= keep;
  p.vy *= keep;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  if (p.ageMs >= p.lifeMs) p.active = false;
}

/** Ömür sonu penceresinde 1→0; pencereden önce 1. */
export function particleAlpha(p: ParticleState): number {
  const remain = p.lifeMs - p.ageMs;
  if (p.fadeOutMs <= 0) return 1;
  return Math.max(0, Math.min(1, remain / p.fadeOutMs));
}
