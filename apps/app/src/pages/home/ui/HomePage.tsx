import { IonCard, IonCardContent, IonCardTitle, IonTitle } from "@ionic/react";
import { t } from "../../../shared/lib";

export function HomePage({
  onPlayShapetris,
  onPlayGame7,
}: {
  onPlayShapetris: () => void;
  onPlayGame7: () => void;
}) {
  return (
    <div className="home-page">
      <IonTitle>{t("home.title")}</IonTitle>
      <IonCard onClick={onPlayShapetris} style={{ cursor: "pointer" }}>
        <IonCardTitle style={{ padding: "8px 12px" }}>🧩 TetroVizyon</IonCardTitle>
        <IonCardContent>Şekil tamamlama · Zeka &amp; dikkat</IonCardContent>
      </IonCard>
      <IonCard onClick={onPlayGame7} style={{ cursor: "pointer" }}>
        <IonCardTitle style={{ padding: "8px 12px" }}>🎈 HarfGüder</IonCardTitle>
        <IonCardContent>Kelime balonları · Zeka &amp; hafıza</IonCardContent>
      </IonCard>
    </div>
  );
}
