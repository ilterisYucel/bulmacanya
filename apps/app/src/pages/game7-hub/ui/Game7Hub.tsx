/**
 * Game7Hub — HarfGüder giriş ekranı (UC-7, K35/K36): 3 mod kartı (HEPSİ AÇIK) +
 * tier seçimi + checkpoint + Uzman kilidi + ortak ders. TÜRKÇE.
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
import type { Game7HintHost, Game7Mode, Tier } from "@bulmacanya/games/game7";
import { TIER_LEVELS, isTierUnlocked } from "@bulmacanya/games/game7/progression";
import {
  readCheckpoint,
  readProgress,
  resumePoint,
  setTutorialDone,
  tutorialDone,
  writeCheckpoint,
} from "../lib/checkpoint";

// shortcut: shell ipucu ekonomisi (coin/reklam kararı) FAZ-1'de geliyor;
//           şimdilik ipucu onayı her zaman verilir (shapetris S6 emsali).
const hintHost: Game7HintHost = { grant: async () => true };

const MODES: Array<{ id: Game7Mode; name: string; desc: string }> = [
  { id: "klasik", name: "Klasik", desc: "Kelime açık — süreye karşı harfleri yakala" },
  { id: "dedektif", name: "Dedektif", desc: "Kategori + uzunluk verilir, kelimeyi sen bul" },
  { id: "sabit", name: "Sabit Harf", desc: "Desendeki kilitli harflerle kelimeyi tamamla" },
];

const TIERS: Array<{ id: Tier; name: string }> = [
  { id: "kolay", name: "Kolay" },
  { id: "orta", name: "Orta" },
  { id: "zor", name: "Zor" },
  { id: "uzman", name: "Uzman" },
];

const TIER_NAME: Record<Tier, string> = {
  kolay: "Kolay",
  orta: "Orta",
  zor: "Zor",
  uzman: "Uzman",
};

/** Ionic scroll içeriğinin transform'u fixed konumlandırmayı bozuyor (2026-11-07):
 *  oyun başlatılmadan önce scroll en üste sıfırlanır. */
function scrollToTop(): void {
  window.scrollTo(0, 0);
  const content = document.querySelector("ion-content") as unknown as {
    scrollToTop?: (duration?: number) => Promise<void>;
  } | null;
  content?.scrollToTop?.(0);
}

async function launch(mode: Game7Mode, tier: Tier, levelNo: number, tutorial: boolean): Promise<void> {
  const { Game7Module } = await import("@bulmacanya/games/game7");
  const module = new Game7Module({
    hintHost,
    mode,
    tier,
    levelNo,
    tutorial,
    onTutorialDone: () => setTutorialDone(),
  });
  module.on("saveRequested", (payload) => writeCheckpoint(payload.payload));
  await module.init();
  await module.start();
}

export function Game7Hub({ onBack }: { onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const checkpoint = readCheckpoint();
  const progress = readProgress();

  const run = async (mode: Game7Mode, tier: Tier, levelNo: number, tutorial: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      scrollToTop();
      await launch(mode, tier, levelNo, tutorial);
    } finally {
      setBusy(false);
    }
  };

  const tierLocked = (mode: Game7Mode, tier: Tier): boolean =>
    !isTierUnlocked(mode, tier, progress);

  const levelsDone = (mode: Game7Mode, tier: Tier): number =>
    progress.find((p) => p.mode === mode && p.tier === tier)?.levelsDone ?? 0;

  const startLevel = (mode: Game7Mode, tier: Tier): number =>
    checkpoint && checkpoint.mode === mode && checkpoint.tier === tier
      ? checkpoint.levelNo
      : 0;

  return (
    <IonPage>
      <IonContent className="game7-hub">
        <IonTitle>HarfGüder 🎈</IonTitle>
        <p style={{ padding: "0 16px" }}>
          Süzülen harf balonlarını tut, sağdaki yuvalara doğru sırayla diz, kelimeyi tamamla.
        </p>

        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {MODES.map((m) => {
            const rp = resumePoint(m.id);
            const fresh = rp.tier === "kolay" && rp.levelNo === 0;
            return (
              <IonCard key={m.id}>
                <IonCardTitle style={{ padding: "8px 12px" }}>{m.name}</IonCardTitle>
                <IonCardContent>
                  <p>{m.desc}</p>
                  <IonButton
                    expand="block"
                    disabled={busy}
                    onClick={() => void run(m.id, rp.tier, rp.levelNo, !tutorialDone())}
                  >
                    {fresh
                      ? "Başla"
                      : `Devam Et (${TIER_NAME[rp.tier]} ${Math.min(rp.levelNo, TIER_LEVELS)})`}
                  </IonButton>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {TIERS.map((t) => {
                      const locked = tierLocked(m.id, t.id);
                      return (
                        <IonButton
                          key={t.id}
                          size="small"
                          disabled={busy || locked}
                          onClick={() =>
                            void run(m.id, t.id, startLevel(m.id, t.id), !tutorialDone())
                          }
                        >
                          {t.name}
                          {locked ? " 🔒" : ""}
                        </IonButton>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 12, color: "#999999", marginTop: 6 }}>
                    {TIERS.filter((t) => !tierLocked(m.id, t.id) && t.id !== "uzman").map(
                      (t) => `${t.name} ${Math.min(levelsDone(m.id, t.id), TIER_LEVELS)}/${TIER_LEVELS}`,
                    ).join(" · ")}
                  </p>
                </IonCardContent>
              </IonCard>
            );
          })}

          <IonButton
            expand="block"
            fill="clear"
            disabled={busy}
            onClick={() => void run("klasik", "kolay", 0, true)}
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
