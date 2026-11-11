/**
 * DuseninDostuHub — Düşenin Dostu giriş ekranı (UC-6/UC-9): kademe seçimi +
 * 4 mod kartı + checkpoint + kademe kilidi + ders. TÜRKÇE.
 */
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonPage,
  IonTitle,
} from "@ionic/react";
import { useState } from "react";
import type {
  DuseninDostuHintHost,
  Difficulty,
  GameMode,
} from "@bulmacanya/games/dusenin-dostu";
import { CAMPAIGN_LEVELS } from "@bulmacanya/games/dusenin-dostu";
import {
  dailyDone,
  isDifficultyUnlocked,
  levelNoFor,
  levelsDone,
  setTutorialDone,
  tutorialDone,
  writeCheckpoint,
} from "../lib/checkpoint";

// shortcut: shell ipucu ekonomisi FAZ-1'de; şimdilik ipucu onayı her zaman verilir.
const hintHost: DuseninDostuHintHost = { grant: async () => true };

const TIERS: Array<{ id: Difficulty; name: string }> = [
  { id: "kolay", name: "Kolay" },
  { id: "orta", name: "Orta" },
  { id: "zor", name: "Zor" },
];

const MODES: Array<{ id: GameMode; name: string; desc: string; icon: string }> = [
  { id: "endless", name: "Sonsuz Tırmanış", desc: "Katlar hızlanır; 404. kata ulaşan efsane olur", icon: "🧗" },
  { id: "campaign", name: "Rota Bulmacası", desc: "Her bölüm 6 kat — ip kotanla en kısa rotayı kur", icon: "🧩" },
  { id: "time", name: "Zamana Karşı", desc: "60 saniyede en çok katı tırman", icon: "⏱️" },
  { id: "daily", name: "Günlük Kule", desc: "Herkes aynı kule — günde bir deneme", icon: "📅" },
];

/** Ionic scroll transform'u fixed konumlandırmayı bozar (game7 deseni). */
function scrollToTop(): void {
  window.scrollTo(0, 0);
  const content = document.querySelector("ion-content") as unknown as {
    scrollToTop?: (duration?: number) => Promise<void>;
  } | null;
  content?.scrollToTop?.(0);
}

async function launch(
  mode: GameMode,
  difficulty: Difficulty,
  levelNo: number,
  tutorial: boolean,
): Promise<void> {
  const { DuseninDostuModule } = await import("@bulmacanya/games/dusenin-dostu");
  const module = new DuseninDostuModule({
    hintHost,
    mode,
    difficulty,
    levelNo,
    tutorial,
    onTutorialDone: () => setTutorialDone(),
  });
  module.on("saveRequested", (payload) => writeCheckpoint(payload.payload));
  await module.init();
  await module.start();
}

export function DuseninDostuHub({ onBack }: { onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("kolay");

  const run = async (
    mode: GameMode,
    tier: Difficulty,
    levelNo: number,
    tutorial: boolean,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      scrollToTop();
      await launch(mode, tier, levelNo, tutorial);
    } finally {
      setBusy(false);
    }
  };

  const startLevel = (mode: GameMode, tier: Difficulty): number =>
    mode === "campaign" ? levelNoFor(tier) : 0;

  const campaignLabel = (tier: Difficulty): string =>
    `Devam Et (${TIERS.find((t) => t.id === tier)?.name ?? tier} ${levelNoFor(tier) + 1})`;

  return (
    <IonPage>
      <IonContent>
        <IonTitle>Düşenin Dostu 🧗</IonTitle>
        <p style={{ padding: "0 16px" }}>
          Kutuya dokun — ip kancası gider ve etrafında sallanırsın. Boşluğa dokun — bırak,
          teğet hızla uç. Dikenlere ne ipin ne bedenin değmeli.
        </p>

        <div style={{ padding: "0 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TIERS.map((t) => {
            const locked = !isDifficultyUnlocked(t.id);
            return (
              <IonButton
                key={t.id}
                size="small"
                fill={difficulty === t.id ? "solid" : "outline"}
                disabled={busy || locked}
                onClick={() => setDifficulty(t.id)}
              >
                {t.name}
                {locked ? " 🔒" : ""}
              </IonButton>
            );
          })}
        </div>

        <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {MODES.map((m) => {
            const locked = !isDifficultyUnlocked(difficulty);
            const campaign = m.id === "campaign";
            const done = m.id === "daily" && dailyDone();
            return (
              <IonCard key={m.id}>
                <IonCardTitle style={{ padding: "8px 12px" }}>
                  {m.icon} {m.name}
                </IonCardTitle>
                <IonCardContent>
                  <p>{m.desc}</p>
                  <IonButton
                    expand="block"
                    disabled={busy || locked || done}
                    onClick={() =>
                      void run(
                        m.id,
                        difficulty,
                        startLevel(m.id, difficulty),
                        !tutorialDone(),
                      )
                    }
                  >
                    {done
                      ? "Bugün tamamlandı"
                      : campaign
                        ? campaignLabel(difficulty)
                        : "Başla"}
                  </IonButton>
                  {campaign && (
                    <p style={{ fontSize: 12, color: "#999999", marginTop: 6 }}>
                      {TIERS.filter((t) => isDifficultyUnlocked(t.id))
                        .map((t) => `${t.name} ${levelsDone(t.id)}/${CAMPAIGN_LEVELS}`)
                        .join(" · ")}
                    </p>
                  )}
                </IonCardContent>
              </IonCard>
            );
          })}

          <IonButton
            expand="block"
            fill="clear"
            disabled={busy}
            onClick={() => void run("endless", "kolay", 0, true)}
          >
            Nasıl Oynanır?
          </IonButton>
          <IonButton expand="block" fill="outline" disabled={busy} onClick={onBack}>
            Geri
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
