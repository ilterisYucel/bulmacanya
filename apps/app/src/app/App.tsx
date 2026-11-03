import { IonApp, IonContent, IonPage } from "@ionic/react";
import { registerGame } from "../features/game-shell";
import { HomePage } from "../pages/home";

// Faz 0: mock modül lazy kaydı — gerçek oyunlar Faz 1'de apps/games'ten gelir.
registerGame("mock", async () => {
  const { MockGame } = await import("../features/mock-game");
  return { default: new MockGame() };
});

export function App() {
  return (
    <IonApp>
      <IonPage>
        <IonContent>
          <HomePage />
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
