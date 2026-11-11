import { IonApp, IonContent, IonPage } from "@ionic/react";
import { useState } from "react";
import { registerGame } from "../features/game-shell";
import { HomePage } from "../pages/home";
import { ShapetrisHub } from "../pages/shapetris-hub";
import { Game7Hub } from "../pages/game7-hub";
import { DuseninDostuHub } from "../pages/dusenin-dostu-hub";
import type { ShapetrisHintHost } from "@bulmacanya/games/shapetris";
import type { Game7HintHost } from "@bulmacanya/games/game7";
import type { DuseninDostuHintHost } from "@bulmacanya/games/dusenin-dostu";

// Faz 0: mock modül lazy kaydı — gerçek oyunlar Faz 1'de apps/games'ten gelir.
registerGame("mock", async () => {
  const { MockGame } = await import("../features/mock-game");
  return { default: new MockGame() };
});

// shortcut: shell ipucu ekonomisi (coin/reklam kararı) FAZ-1'de geliyor;
//           şimdilik ipucu onayı her zaman verilir.
const shapetrisHintHost: ShapetrisHintHost = {
  grant: async () => true,
};
const game7HintHost: Game7HintHost = {
  grant: async () => true,
};
const duseninDostuHintHost: DuseninDostuHintHost = {
  grant: async () => true,
};

// Faz 1: Shapetris — apps/games paketinden lazy yüklenir (FR-4.2).
registerGame("shapetris", async () => {
  const { ShapetrisModule } = await import("@bulmacanya/games/shapetris");
  return { default: new ShapetrisModule({ difficulty: 0, hintHost: shapetrisHintHost }) };
});

// Faz 1: HarfGüder (game7) — apps/games paketinden lazy yüklenir.
registerGame("game7", async () => {
  const { Game7Module } = await import("@bulmacanya/games/game7");
  return { default: new Game7Module({ hintHost: game7HintHost }) };
});

// Düşenin Dostu — apps/games paketinden lazy yüklenir (K11).
registerGame("dusenin-dostu", async () => {
  const { DuseninDostuModule } = await import("@bulmacanya/games/dusenin-dostu");
  return { default: new DuseninDostuModule({ hintHost: duseninDostuHintHost }) };
});

export function App() {
  const [view, setView] = useState<
    "home" | "shapetris-hub" | "game7-hub" | "dusenin-dostu-hub"
  >("home");
  return (
    <IonApp>
      <IonPage>
        <IonContent>
          {view === "home" ? (
            <HomePage
              onPlayShapetris={() => setView("shapetris-hub")}
              onPlayGame7={() => setView("game7-hub")}
              onPlayDuseninDostu={() => setView("dusenin-dostu-hub")}
            />
          ) : view === "shapetris-hub" ? (
            <ShapetrisHub onBack={() => setView("home")} />
          ) : view === "game7-hub" ? (
            <Game7Hub onBack={() => setView("home")} />
          ) : (
            <DuseninDostuHub onBack={() => setView("home")} />
          )}
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
