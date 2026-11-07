/**
 * ShapetrisHub — oyun giriş ekranı (UC-12, K17): tanıtım + zorluk seçimi +
 * checkpoint + günlük/sonsuz kartları + ders başlatma. TÜRKÇE (FR-3.4).
 */
import { IonButton, IonCard, IonCardContent, IonCardTitle, IonContent, IonPage, IonTitle } from "@ionic/react";
import { useState } from "react";
import type { ShapetrisHintHost } from "@bulmacanya/games/shapetris";
import {
  readCheckpoint,
  readCompleted,
  readDailyDone,
  setTutorialDone,
  today,
  tutorialDone,
  writeCheckpoint,
  type CampaignDifficulty,
} from "../lib/checkpoint";

// shortcut: shell ipucu ekonomisi (coin/reklam kararı) FAZ-1'de geliyor;
//           şimdilik ipucu onayı her zaman verilir.
const hintHost: ShapetrisHintHost = { grant: async () => true };

const DIFFICULTIES: Array<{ id: CampaignDifficulty; name: string }> = [
  { id: "kolay", name: "Kolay" },
  { id: "orta", name: "Orta" },
  { id: "zor", name: "Zor" },
];

interface LaunchOptions {
  mode: "campaign" | "endless" | "daily";
  campaignDifficulty?: CampaignDifficulty;
  startLevel?: number;
  tutorial?: boolean;
}

async function launch(opts: LaunchOptions): Promise<void> {
  const { ShapetrisModule } = await import("@bulmacanya/games/shapetris");
  const module = new ShapetrisModule({
    hintHost,
    mode: opts.mode,
    campaignDifficulty: opts.campaignDifficulty ?? "kolay",
    startLevel: opts.startLevel ?? 0,
    tutorial: opts.tutorial ?? false,
    onTutorialDone: () => setTutorialDone(),
  });
  module.on("saveRequested", (payload) => writeCheckpoint(payload.payload));
  await module.init();
  await module.start();
}

export function ShapetrisHub({ onBack }: { onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const checkpoint = readCheckpoint();
  const completed = readCompleted();
  const daily = readDailyDone();

  const run = async (opts: LaunchOptions) => {
    if (busy) return;
    setBusy(true);
    try {
      await launch(opts);
    } finally {
      setBusy(false);
    }
  };

  const difficultyProgress = (difficulty: CampaignDifficulty): number => {
    if (checkpoint?.mode === "campaign" && checkpoint.difficulty === difficulty) {
      return Math.min(checkpoint.levelNo, 100);
    }
    return completed[difficulty] ? 100 : 0;
  };

  const locked = (difficulty: CampaignDifficulty): boolean => {
    if (difficulty === "orta") return !completed.kolay;
    if (difficulty === "zor") return !completed.orta;
    return false;
  };

  const todayDone = daily?.date === today();

  return (
    <IonPage>
      <IonContent className="shapetris-hub">
        <IonTitle>TetroVizyon</IonTitle>
        <p style={{ padding: "0 16px" }}>
          Tetrominoları sürükle, yeşil şekli tamamla. Dolu satır ve sütunlar silinir.
        </p>

        <div style={{ padding: "8px 16px", display: "flex", gap: 8, flexDirection: "column" }}>
          <IonButton
            expand="block"
            disabled={busy}
            onClick={() =>
              void run({
                mode: "campaign",
                campaignDifficulty: checkpoint?.difficulty ?? "kolay",
                startLevel: checkpoint?.levelNo ?? 0,
                tutorial: !tutorialDone(),
              })
            }
          >
            Devam Et {checkpoint ? `(Bölüm ${Math.min(checkpoint.levelNo + 1, 100)})` : "(Kolay 1)"}
          </IonButton>
          <IonButton expand="block" fill="outline" disabled={busy} onClick={onBack}>
            Geri
          </IonButton>
        </div>

        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {DIFFICULTIES.map((d) => (
            <IonCard key={d.id} disabled={locked(d.id)} onClick={() => void run({ mode: "campaign", campaignDifficulty: d.id })}>
              <IonCardTitle style={{ padding: "8px 12px" }}>
                {d.name} {locked(d.id) ? "🔒" : completed[d.id] ? "✅" : ""}
              </IonCardTitle>
              <IonCardContent>Bölüm {difficultyProgress(d.id)}/100</IonCardContent>
            </IonCard>
          ))}

          <IonCard onClick={() => void run({ mode: "daily" })}>
            <IonCardTitle style={{ padding: "8px 12px" }}>
              Günlük Puzzle {todayDone ? "✅" : ""}
            </IonCardTitle>
            <IonCardContent>{todayDone ? "Bugünkü tamamlandı" : "Herkes aynı puzzle'ı çözer"}</IonCardContent>
          </IonCard>

          <IonCard disabled={!completed.zor} onClick={() => void run({ mode: "endless" })}>
            <IonCardTitle style={{ padding: "8px 12px" }}>Sonsuz Mod {completed.zor ? "" : "🔒"}</IonCardTitle>
            <IonCardContent>
              {completed.zor ? "Sayaç tohumlu sonsuz puzzle" : "Zor kampanyayı bitirince açılır"}
            </IonCardContent>
          </IonCard>

          <IonButton
            expand="block"
            fill="clear"
            disabled={busy}
            onClick={() => void run({ mode: "campaign", campaignDifficulty: "kolay", tutorial: true })}
          >
            Nasıl Oynanır?
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
