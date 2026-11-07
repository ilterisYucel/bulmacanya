/**
 * module-lifecycle — IGameModule yaşam döngüsü makinesi + event yayını (ORTAK).
 *
 * packages/shared#IGameModule kontratındaki state machine ile BİREBİR:
 * idle → initialized → running ⇄ paused → stopped (dönüş yok).
 * MockGame deseninden türetildi; shapetris ve game7 tarafından ORTAK kullanılır
 * (duplikasyon YOK — oyun modülleri re-export eder).
 *
 * Edge cases (kontrat):
 * - init öncesi start/pause/resume/exit → GameModuleError (WRONG_STATE / NOT_INITIALIZED).
 * - init iki kez → WRONG_STATE.
 * - exit sonrası emit İLETİLMEZ (sessiz).
 */

import {
  GameModuleError,
  GameModuleErrorCategory,
  GameModuleState,
  type GameEvent,
  type GameEventMap,
  type IGameModule,
  type Unsubscribe,
} from "@bulmacanya/shared";

export class ModuleLifecycle implements IGameModule {
  private state: GameModuleState = GameModuleState.Idle;
  private readonly handlers = new Map<GameEvent, Set<(payload: unknown) => void>>();

  constructor(readonly id: string) {}

  async init(): Promise<void> {
    if (this.state !== GameModuleState.Idle) {
      throw new GameModuleError(GameModuleErrorCategory.WrongState, `init geçersiz durumda: ${this.state}`);
    }
    this.state = GameModuleState.Initialized;
  }

  async start(): Promise<void> {
    if (this.state === GameModuleState.Idle) {
      throw new GameModuleError(GameModuleErrorCategory.NotInitialized, "start init'ten önce çağrıldı");
    }
    if (this.state !== GameModuleState.Initialized) {
      throw new GameModuleError(GameModuleErrorCategory.WrongState, `start geçersiz durumda: ${this.state}`);
    }
    this.state = GameModuleState.Running;
  }

  pause(): void {
    if (this.state !== GameModuleState.Running) {
      throw new GameModuleError(GameModuleErrorCategory.WrongState, `pause geçersiz durumda: ${this.state}`);
    }
    this.state = GameModuleState.Paused;
  }

  resume(): void {
    if (this.state !== GameModuleState.Paused) {
      throw new GameModuleError(GameModuleErrorCategory.WrongState, `resume geçersiz durumda: ${this.state}`);
    }
    this.state = GameModuleState.Running;
  }

  exit(): void {
    this.state = GameModuleState.Stopped;
    this.handlers.clear();
  }

  on<K extends GameEvent>(event: K, handler: (payload: GameEventMap[K]) => void): Unsubscribe {
    const set = this.handlers.get(event) ?? new Set();
    this.handlers.set(event, set);
    set.add(handler as (payload: unknown) => void);
    return () => set.delete(handler as (payload: unknown) => void);
  }

  /** Kabuğa event yayını — exit sonrası İLETİLMEZ (kontrat edge case). */
  emit<K extends GameEvent>(event: K, payload: GameEventMap[K]): void {
    if (this.state === GameModuleState.Stopped) return;
    for (const handler of this.handlers.get(event) ?? []) {
      (handler as (p: GameEventMap[K]) => void)(payload);
    }
  }

  get currentState(): GameModuleState {
    return this.state;
  }
}
