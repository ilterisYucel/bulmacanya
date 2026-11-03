import type { ReactNode } from "react";
import { IonButton } from "@ionic/react";

/** Atomic Design: atoms katmanı — en küçük yeniden kullanılabilir bileşen. */
export function AppButton({ children }: { children: ReactNode }) {
  return <IonButton>{children}</IonButton>;
}
