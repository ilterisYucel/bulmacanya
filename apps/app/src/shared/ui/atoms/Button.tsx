import type { ReactNode } from "react";
import { IonButton } from "@ionic/react";

/** Atomic Design: atoms katmanı — en küçük yeniden kullanılabilir bileşen. */
export function AppButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <IonButton onClick={onClick} disabled={disabled}>
      {children}
    </IonButton>
  );
}
