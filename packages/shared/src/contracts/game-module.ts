/**
 * IGameModule — oyun kabuğu (game shell) ile her oyun modülü arasındaki TEK bağlantı sözleşmesi.
 *
 * Bu kontrat framework-free'dir; shell oyun-spesifik hiçbir tip import edemez (arch test ile sabitlenir).
 * README §3.3: skor, bölüm geçme, ipucu, kayıt, reklam tetikleme tek merkezden (shell) yönetilir.
 *
 * ## Durumlar (state machine)
 *
 * ```
 * idle → initialized → running ⇄ paused
 *                     ↘ stopped → idle (yeniden başlatılamaz; yeni örnek gerekir)
 * ```
 *
 * - `idle`: modül yüklenmiş ama `init` çağrılmamış.
 * - `initialized`: `init` tamamlandı; `start` beklenir.
 * - `running`: oynanabilir.
 * - `paused`: `pause` ile duraklatıldı; yalnızca `resume` ile `running`'e döner.
 * - `stopped`: `exit` çağrıldı — geri dönüş YOKTUR (bu örnek öldü).
 *
 * ## Edge case'ler
 *
 * - `init` öncesi `start/pause/resume/exit` → `GameModuleError` (WRONG_STATE).
 * - `init` iki kez çağrılırsa → `GameModuleError` (WRONG_STATE).
 * - `exit` sonrası herhangi bir event tetiklenirse → event İLETİLMEZ (sessiz, hata yok).
 * - Event'e abone olunmamışsa event sessizce düşer (isteğe bağlı event).
 *
 * ## Hata kategorileri
 *
 * | Kategori | Anlam |
 * | :------- | :---- |
 * | `WRONG_STATE` | Yaşam döngüsü sırası ihlali |
 * | `NOT_INITIALIZED` | Modül kabuğa bağlanmadan işlem denendi |
 * | `UNKNOWN_MODULE` | Shell'de kayıtsız modül ID'si talep edildi |
 *
 * ## Yan etkiler
 *
 * - `init` modülün kaynaklarını ayırır (canvas/audio); `exit` bunları serbest bırakmalıdır (ZORUNLU).
 * - Event handler'ları eşzamanlı çağrılır; içlerinde uzun iş YASAKTIR.
 *
 * ## Limitler
 *
 * - Shell aynı anda TEK aktif modül çalıştırır; ikinci `start` öncekinin `exit`'ini gerektirir.
 * - Bir modül aynı anda birden fazla shell'e bağlanamaz.
 */

/** Oyun modülü yaşam döngüsü durumları. */
export enum GameModuleState {
  Idle = "idle",
  Initialized = "initialized",
  Running = "running",
  Paused = "paused",
  Stopped = "stopped",
}

/** Oyun modülünün kabuğa bildirebileceği hata kategorileri. */
export enum GameModuleErrorCategory {
  WrongState = "WRONG_STATE",
  NotInitialized = "NOT_INITIALIZED",
  UnknownModule = "UNKNOWN_MODULE",
}

/** Oyun modülü hataları. */
export class GameModuleError extends Error {
  constructor(
    readonly category: GameModuleErrorCategory,
    message: string,
  ) {
    super(message);
    this.name = "GameModuleError";
  }
}

/** Oyun modülünün kabuğa yaydığı event'ler (README §3.3). */
export interface GameEventMap {
  /** Skor bildirimi — bölüm içi ve bölüm sonu toplamı. */
  score: { score: number };
  /** Bölüm tamamlandı. */
  levelCompleted: { levelId: string };
  /** İpucu talebi — tüketim kuralları README §7.3'te; shell'e iletilir, modül karar VERMEZ. */
  hintRequested: { hintType: string };
  /** Ödüllü reklam talebi — yalnızca kullanıcı isteği üzerine (README §7.5). */
  adRequested: { placement: string };
  /** Kayıt talebi — payload'ı shell yorumlar. */
  saveRequested: { payload: unknown };
}

export type GameEvent = keyof GameEventMap;

/** Event aboneliğini iptal eder; çağrılmazsa abonelik modül yaşamı boyunca sürer. */
export type Unsubscribe = () => void;

/**
 * Oyun modülü sözleşmesi — her oyun bu arayüzü uygular ve shell'e yalnız bununla bağlanır.
 * Shell oyun-spesifik tip BİLMEZ; `loadGame()` dinamik import ile modülü lazy yükler.
 */
export interface IGameModule {
  /** Kararlı, benzersiz modül ID'si (ör. "tetris", "refleks"). */
  readonly id: string;

  /**
   * Kaynakları ayırır ve modülü `initialized` durumuna geçirir.
   * İki kez çağrılırsa `WRONG_STATE` hatası fırlatır.
   */
  init(): Promise<void>;

  /** Modülü `running` durumuna geçirir. `init` öncesi çağrılırsa `NOT_INITIALIZED` fırlatır. */
  start(): Promise<void>;

  /** `running` → `paused`. `running` dışında çağrılırsa `WRONG_STATE` fırlatır. */
  pause(): void;

  /** `paused` → `running`. `paused` dışında çağrılırsa `WRONG_STATE` fırlatır. */
  resume(): void;

  /** Kaynakları serbest bırakır, `stopped`'a geçer. Geri dönüş YOKTUR. */
  exit(): void;

  /** Event dinleyicisi ekler; iptal için dönen `Unsubscribe` çağrılır. */
  on<K extends GameEvent>(event: K, handler: (payload: GameEventMap[K]) => void): Unsubscribe;
}
