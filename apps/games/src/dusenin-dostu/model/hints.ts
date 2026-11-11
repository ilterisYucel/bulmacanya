/**
 * hints — ipucu karar mantığı (UC-7, K17). SAF; DOM/Pixi YOK.
 *
 * - `isHintValid`: ipucunun bu mod/faz/kademede kullanılabilirliği.
 * - `hintTarget`: rota ipucusunun vurgulayacağı kutu — oyuncunun üstünde,
 *   katı ve kullanılmamış, en yakın (en büyük y) hedef.
 *
 * Karar COIN/reklam değildir — onay `HintHost.grant` ile shell'de (K17).
 */
import type { Brick, Difficulty, GameState } from "./types";

export type DuseninDostuHintType = "dusenin-dostu.rota-goster" | "dusenin-dostu.yavas-zaman";

/** İpucu bu durumda kullanılabilir mi? */
export function isHintValid(
  hintType: DuseninDostuHintType,
  phase: "playing" | "victory" | "gameover",
  difficulty: Difficulty,
): boolean {
  if (phase !== "playing") return false;
  if (hintType === "dusenin-dostu.rota-goster") return true;
  return hintType === "dusenin-dostu.yavas-zaman" && difficulty !== "kolay";
}

/** Rota ipucusunun hedefi. */
export function hintTarget(state: GameState): Brick | null {
  return (
    state.bricks
      .filter(
        (b) =>
          b.kind !== "breaker" &&
          b.kind !== "coin" &&
          b.kind !== "chest" &&
          !b.used &&
          b.y < state.player.y,
      )
      .sort((a, b) => b.y - a.y)[0] ?? null
  );
}
