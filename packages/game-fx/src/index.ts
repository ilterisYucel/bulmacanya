/**
 * @bulmacanya/game-fx — ortak oyun efekt çekirdeği (FAZ-GAME-FX-SPEC).
 * ZERO-DEP: renderer-bağımsız kontratlar + saf sim/geometri/ses-durumu/shake.
 */
export type { ILayer, IRenderAdapter, ISprite, ITexture } from "./contracts/render-adapter";
export type { BurstOptions, BurstSpec, ParticleState } from "./particles";
export {
  ParticleBurst,
  particleAlpha,
  simulateParticle,
  spawnParticle,
} from "./particles";
export { FX_PRIMITIVES, shardPoints, starPoints } from "./fx/geometry";
export type { FxPrimitiveName, Point } from "./fx/geometry";
export type {
  AudioContextFactory,
  AudioFlags,
  FxSound,
  IAudioContextLike,
  IGainLike,
  IOscillatorLike,
  Note,
  SoundDef,
} from "./audio";
export { FxAudio, SOUND_MAP, canPlay } from "./audio";
export type { ShakeOptions, ShakeTarget } from "./shake";
export { Shake } from "./shake";
