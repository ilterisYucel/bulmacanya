import { IonTitle } from "@ionic/react";
import { t } from "../../../shared/lib";
import { AppButton } from "../../../shared/ui";

export function HomePage() {
  return (
    <div className="home-page">
      <IonTitle>{t("home.title")}</IonTitle>
      <AppButton>{t("home.start")}</AppButton>
    </div>
  );
}
