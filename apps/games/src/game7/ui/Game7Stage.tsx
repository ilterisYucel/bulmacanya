/**
 * Game7Stage — oyun sahnesi + DOM kontrol katmanı (UC-2/UC-5/UC-6, K32).
 *
 * - PIXI: @pixi/react@8 Application + pixiContainer/pixiSprite intrinsic'leri (S7 deseni).
 * - Balonlar snapshot'tan çizilir; sürükleme sahne-lokal (drop'ta api.dropAt).
 * - Fx: game-fx tüketimi — FxController rAF döngüsüyle beslenir (burst/shake/ses).
 * - DOM: başlık (skor/süre/hak-can), hedef göstergesi, Kontrol Et, ipucu, mute,
 *   modallar (zafer/fail + kurtarma), ders overlay — TÜRKÇE (AK-6.5).
 */
import { useEffect, useRef, useState } from "react";
import { Application, extend, useApplication } from "@pixi/react";
import { Container, Rectangle, Sprite, type FederatedPointerEvent } from "pixi.js";
import { PixiRenderAdapter, createFxAtlas } from "@bulmacanya/game-fx-pixi";
import { FxController, signalColor } from "./fx";
import { hudConfig, submitEnabled } from "./hud-select";
import { STR } from "./strings";
import { balloonSize } from "../model/layout";
import type { Game7Api, Game7BalloonView, Game7Snapshot } from "../model/api-types";
import type { Game7HintType } from "../model/api-types";
import type { Game7Atlas } from "./atlas";

// @pixi/react@8: JSX intrinsic'leri (pixiContainer/pixiSprite) extend ile kaydedilir — S7
extend({ Container, Sprite });

interface StageProps {
  api: Game7Api;
  atlas: Game7Atlas;
  tutorial?: boolean;
  onTutorialDone?: () => void;
}

interface DragState {
  id: number;
  x: number;
  y: number;
}

const TUTORIAL_STEPS = [STR.tutorial1, STR.tutorial2, STR.tutorial3] as const;

const btnStyle: React.CSSProperties = {
  background: "#4f46e5",
  color: "#ffffff",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

export function Game7Stage({ api, atlas, tutorial = false, onTutorialDone }: StageProps) {
  const [snapshot, setSnapshot] = useState<Game7Snapshot>(() => api.getSnapshot());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [candidate, setCandidate] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [hintGlow, setHintGlow] = useState<{ letter: string; until: number } | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => api.subscribe(() => setSnapshot(api.getSnapshot())), [api]);

  const layout = snapshot.layout;
  const cfg = hudConfig(snapshot.mode);

  const closeTutorial = () => {
    setTutorialStep(-1);
    onTutorialDone?.();
  };

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
  };

  // Balon görsel konumu (render ile birebir — hit-test bu fonksiyonu kullanır)
  const balloonPos = (b: Game7BalloonView): { x: number; y: number } => {
    if (b.state === "SET" && b.slotIndex !== null) {
      return { x: layout?.slotX ?? 0, y: (layout?.slotTop ?? 0) + b.slotIndex * (layout?.slotStep ?? 0) };
    }
    if (drag && drag.id === b.id) return { x: drag.x, y: drag.y };
    return { x: b.x, y: (layout?.balloonArea.y ?? 0) + b.y };
  };

  // Pointer yakalama düzeltmesi (2026-11-07): pixi v8'de sprite üzerindeki
  // pointerdown, up/move olaylarını o sprite'a yakalar → drop hiç tetiklenmiyordu.
  // Tüm pointer olayları CONTAINER seviyesinde; balonlar elle hit-test edilir.
  const hitBalloon = (x: number, y: number): Game7BalloonView | null => {
    const r = bSize.width / 2 + 8;
    const inBox = (b: Game7BalloonView): boolean => {
      const p = balloonPos(b);
      const rr = drag?.id === b.id ? r * 1.25 : r;
      return Math.hypot(x - p.x, y - p.y) <= rr;
    };
    // SET balonlar öncelikli (yuvadan çıkarma)
    for (const b of snapshot.balloons) {
      if (b.state === "SET" && inBox(b)) return b;
    }
    for (const b of snapshot.balloons) {
      if (b.state !== "SET" && inBox(b)) return b;
    }
    return null;
  };

  /**
   * Sürüklenen balonun dikdörtgeni ile slot kutusu dikdörtgenlerinin KESİŞİM
   * testi (2026-11-07 — koordinat bant testi yerine): kesişen kutu aday olur.
   */
  const slotOverlap = (x: number, y: number): number | null => {
    if (!layout) return null;
    const bw = bSize.width * 1.25;
    const bh = bSize.height * 1.25;
    for (let i = 0; i < layout.slotCount; i++) {
      const cy = layout.slotTop + i * layout.slotStep;
      const overlapX = Math.abs(x - layout.slotX) <= (bw + layout.slotBox.width) / 2;
      const overlapY = Math.abs(y - cy) <= (bh + layout.slotBox.height) / 2;
      if (overlapX && overlapY) return i;
    }
    return null;
  };

  const onStageDown = (e: FederatedPointerEvent) => {
    fxRef.current?.unlockAudio();
    if (snapshot.phase !== "playing") return;
    const b = hitBalloon(e.global.x, e.global.y);
    if (!b) return;
    if (b.state === "SET") {
      api.pullFromSlot(b.id);
      return;
    }
    if (api.dragStart(b.id)) {
      setDrag({ id: b.id, x: e.global.x, y: e.global.y });
    }
  };

  const onStageMove = (e: FederatedPointerEvent) => {
    if (!drag) return;
    const { x, y } = e.global;
    setDrag({ id: drag.id, x, y });
    setCandidate(slotOverlap(x, y));
  };

  const onStageUp = (e: FederatedPointerEvent) => {
    if (!drag) return;
    const id = drag.id;
    const slot = candidate;
    setDrag(null);
    setCandidate(null);
    const outcome = api.dropIntoSlot(id, slot);
    fxRef.current?.unlockAudio();
    void outcomeFx(outcome);
  };

  const fxRef = useRef<FxController | null>(null);

  /** Drop sonucu → efekt (E2/E3/E4/E1) + kırmızı flash (E7). */
  const outcomeFx = (outcome: ReturnType<Game7Api["dropIntoSlot"]>) => {
    const fx = fxRef.current;
    if (!fx || !layout) return;
    const slotCenter = (i: number) => ({
      x: layout.slotX,
      y: layout.slotTop + i * layout.slotStep,
    });
    switch (outcome.kind) {
      case "snapped": {
        if (snapshot.mode === "klasik") {
          const idx = nearestFilledSlot();
          if (idx >= 0) fx.sparkle(slotCenter(idx).x, slotCenter(idx).y);
        } else {
          fx.snapPuff(layout.slotX, layout.slotTop);
        }
        if (outcome.popped) {
          for (let i = 0; i < layout.slotCount; i++) {
            fx.pop(slotCenter(i).x, slotCenter(i).y, "#f59e0b");
          }
        }
        break;
      }
      case "wrong-letter":
      case "locked":
        fx.wrongDust(layout.slotX, layout.slotTop);
        triggerFlash();
        break;
      default:
        break;
    }
  };

  /** snapshot'tan son dolan slot (E4 konumu) — yaklaşık: son dolu slot indeksi. */
  const nearestFilledSlot = (): number => {
    for (let i = snapshot.slots.length - 1; i >= 0; i--) {
      if (snapshot.slots[i] !== null) return i;
    }
    return -1;
  };

  // Faz değişim efektleri (E5/E7) — victory → burst+sarsıntı, gameover → boop+sarsıntı
  const prevPhase = useRef(snapshot.phase);
  useEffect(() => {
    if (prevPhase.current === snapshot.phase) return;
    prevPhase.current = snapshot.phase;
    const fx = fxRef.current;
    if (!fx || !layout) return;
    if (snapshot.phase === "victory") {
      fx.victory(layout.slotX, layout.slotTop + (layout.slotStep * layout.slotCount) / 2);
    } else if (snapshot.phase === "gameover") {
      fx.lifeLost();
    }
  }, [snapshot.phase, layout]);

  // Mute aynalama
  useEffect(() => {
    fxRef.current?.setMuted(snapshot.muted);
  }, [snapshot.muted]);

  // Harf-vurgula ipucu: hedefin ilk boş slot harfini parlat (3 sn)
  const runGlowHint = async () => {
    const ok = await api.requestHint("game7.harf-vurgula");
    if (!ok) return;
    const idx = snapshot.slots.findIndex((s) => s === null);
    const letter = idx >= 0 && snapshot.targetWord ? snapshot.targetWord[idx] : null;
    if (letter !== null && letter !== undefined) {
      setHintGlow({ letter, until: Date.now() + 3000 });
      setTimeout(() => setHintGlow(null), 3000);
    }
  };

  const runRevealHint = async () => {
    await api.requestHint("game7.harf-ac");
  };

  const rescueType: Game7HintType | null =
    snapshot.phase === "gameover"
      ? snapshot.mode === "klasik"
        ? "game7.sure-ekle"
        : "game7.hak-iade"
      : null;

  if (!layout) return null;

  const area = { width: layout.areaWidth, height: snapshot.viewport.height || window.innerHeight };
  const bSize = balloonSize(layout);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: area.width,
        }}
      >
        <Application
          width={area.width}
          height={area.height}
          background="#2E3436"
          antialias
          autoDensity
          resolution={1}
        >
          <StageInner
            atlas={atlas}
            snapshot={snapshot}
            drag={drag}
            candidate={candidate}
            hintGlow={hintGlow}
            bSize={bSize}
            onStageDown={onStageDown}
            onStageMove={onStageMove}
            onStageUp={onStageUp}
            fxRef={fxRef}
          />
        </Application>
      </div>

      {/* HUD (DOM — K32) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 52,
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          boxSizing: "border-box",
          color: "#eeeeec",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <span>
          {STR.level} {snapshot.levelNo + 1} · {STR.score} {snapshot.totalScore}
        </span>
        <span>
          {cfg.showSure && `${STR.time}: ${Math.ceil(snapshot.sureLeft ?? 0)}s`}
          {cfg.showHak && `${STR.hak}: ${snapshot.hakLeft ?? 0}`}
          {cfg.showCan && `${STR.can}: ${snapshot.canLeft ?? 0}`}
          {cfg.showWordsProgress &&
            ` · ${STR.wordsProgress} ${snapshot.wordsDone}/${snapshot.wordsTarget}`}
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          {cfg.showSubmit && (
            <button
              style={btnStyle}
              disabled={!submitEnabled(snapshot.mode, snapshot.slots.every((s) => s !== null), snapshot.phase)}
              onClick={() => {
                fxRef.current?.unlockAudio();
                const outcome = api.submit();
                if (outcome.kind === "wrong") triggerFlash();
                if (outcome.kind === "matched" && layout) {
                  fxRef.current?.victory(
                    layout.slotX,
                    layout.slotTop + (layout.slotStep * layout.slotCount) / 2,
                  );
                }
              }}
            >
              {STR.submit}
            </button>
          )}
          {snapshot.mode === "klasik" ? (
            <button style={btnStyle} disabled={snapshot.phase !== "playing"} onClick={() => void runGlowHint()}>
              {STR.hintGlow}
            </button>
          ) : (
            <button style={btnStyle} disabled={snapshot.phase !== "playing"} onClick={() => void runRevealHint()}>
              {STR.hintReveal}
            </button>
          )}
          <button style={btnStyle} onClick={() => api.setMuted(!snapshot.muted)}>
            {STR.mute}: {snapshot.muted ? "🔇" : "🔊"}
          </button>
          <button style={btnStyle} onClick={() => api.restart()}>
            {STR.restart}
          </button>
          <button style={btnStyle} onClick={() => api.exit()}>
            {STR.back}
          </button>
        </span>
      </div>

      {/* Hedef göstergesi (DOM) */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#eeeeec",
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: 4,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        {cfg.showTargetWord && snapshot.targetWord ? (
          [...snapshot.targetWord].join(" ")
        ) : cfg.showCategory && snapshot.category ? (
          <span>
            {STR.category}: {snapshot.category.toUpperCase()} ·{" "}
            {Array.from({ length: snapshot.slots.length }, (_, i) =>
              snapshot.revealed[i] ?? "_",
            ).join(" ")}
          </span>
        ) : cfg.showPattern && snapshot.pattern ? (
          [...snapshot.pattern.map((p, i) => p ?? snapshot.revealed[i] ?? "_")].join(" ")
        ) : null}
      </div>

      {/* E7 kırmızı kenar flash (hak/can kaybı) */}
      {flash && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "6px solid #ef4444",
            pointerEvents: "none",
            animation: "none",
          }}
        />
      )}

      {/* Modallar */}
      {snapshot.phase === "victory" && (
        <Modal>
          <h2>{STR.levelDone}</h2>
          <p>
            {STR.score}: {snapshot.totalScore}
          </p>
          <button style={btnStyle} onClick={() => api.nextLevel()}>
            {STR.next}
          </button>
        </Modal>
      )}

      {snapshot.phase === "gameover" && (
        <Modal>
          <h2>{STR.gameOver}</h2>
          <p>
            {STR.score}: {snapshot.totalScore}
          </p>
          {snapshot.lastWord && <p>«{snapshot.lastWord}»</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {rescueType && (
              <button
                style={{ ...btnStyle, background: "#b45309" }}
                onClick={() => void api.requestHint(rescueType)}
              >
                {snapshot.mode === "klasik" ? STR.rescueTime : snapshot.mode === "dedektif" ? STR.rescueRight : STR.rescueLife}
              </button>
            )}
            <button style={btnStyle} onClick={() => api.restart()}>
              {STR.restart}
            </button>
          </div>
        </Modal>
      )}

      {tutorial && tutorialStep >= 0 && snapshot.phase === "playing" && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={() => setTutorialStep((s) => Math.min(s + 1, TUTORIAL_STEPS.length - 1))}
          onDone={closeTutorial}
        />
      )}
    </div>
  );
}

// --- PIXI iç katman (useApplication renderer'a erişir) ---

interface InnerProps {
  atlas: Game7Atlas;
  snapshot: Game7Snapshot;
  drag: DragState | null;
  candidate: number | null;
  hintGlow: { letter: string; until: number } | null;
  bSize: { width: number; height: number };
  onStageDown: (e: FederatedPointerEvent) => void;
  onStageMove: (e: FederatedPointerEvent) => void;
  onStageUp: (e: FederatedPointerEvent) => void;
  fxRef: React.MutableRefObject<FxController | null>;
}

function StageInner({
  atlas,
  snapshot,
  drag,
  candidate,
  hintGlow,
  bSize,
  onStageDown,
  onStageMove,
  onStageUp,
  fxRef,
}: InnerProps) {
  const appState = useApplication();
  const app = appState.app;
  const layout = snapshot.layout!;

  // FxController kurulumu — app.stage kök katman (particle'lar sahneye girer)
  useEffect(() => {
    const adapter = new PixiRenderAdapter(app.stage);
    const fx = new FxController(
      adapter,
      createFxAtlas(app.renderer),
      { x: 0, y: 0 },
    );
    fxRef.current = fx;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      fx.tick(dt, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      fx.destroy();
      fxRef.current = null;
    };
  }, [app, fxRef]);

  const hit = new Rectangle(0, 0, layout.areaWidth, layout.balloonArea.y + layout.balloonArea.height);

  return (
    <pixiContainer
      eventMode="static"
      hitArea={hit}
      onPointerDown={onStageDown}
      onPointerMove={onStageMove}
      onPointerUp={onStageUp}
      onPointerUpOutside={onStageUp}
    >
      <pixiSprite
        texture={atlas.backgrounds[snapshot.mode]}
        x={layout.areaWidth / 2}
        y={hit.height / 2}
        width={layout.areaWidth}
        height={hit.height}
        anchor={{ x: 0.5, y: 0.5 }}
      />
      {snapshot.balloons.map((b) => {
        const pos =
          b.state === "SET"
            ? { x: layout.slotX, y: layout.slotTop + (b.slotIndex ?? 0) * layout.slotStep }
            : drag && drag.id === b.id
              ? { x: drag.x, y: drag.y }
              : { x: b.x, y: layout.balloonArea.y + b.y };
        const sig = b.state === "SET" && b.slotIndex !== null ? snapshot.signal?.[b.slotIndex] ?? null : null;
        const glow = hintGlow && hintGlow.until > Date.now() && b.letter === hintGlow.letter && b.state === "FREE";
        return (
          <pixiSprite
            key={b.id}
            texture={atlas.balloons.get(b.letter)}
            x={pos.x}
            y={pos.y}
            anchor={{ x: 0.5, y: 0.5 }}
            width={bSize.width * (drag?.id === b.id ? 1.25 : 1)}
            height={bSize.height * (drag?.id === b.id ? 1.25 : 1)}
            alpha={b.state === "SET" ? 1 : 0.95}
            tint={
              sig !== null && sig !== undefined
                ? signalColor(sig)
                : glow
                  ? "#fde047"
                  : "#ffffff"
            }
          />
        );
      })}
      {snapshot.slots.map((letter, i) => {
        const locked = snapshot.pattern?.[i] ?? null;
        const cx = layout.slotX;
        const cy = layout.slotTop + i * layout.slotStep;
        // Dolu slot: harf balonu yukarıdaki balloons map'inde çiziliyor
        if (letter !== null) return null;
        if (locked !== null && locked !== undefined) {
          // Kilitli slot (Sabit desen): desen harfinin balonu, kırmızımsı tint
          return (
            <pixiSprite
              key={`locked-${i}`}
              texture={atlas.balloons.get(locked)}
              x={cx}
              y={cy}
              anchor={{ x: 0.5, y: 0.5 }}
              width={bSize.width}
              height={bSize.height}
              tint="#f87171"
              alpha={0.95}
            />
          );
        }
        // Boş slot: soru işareti balonu — adayken parlar (2026-11-07)
        const highlight = candidate === i;
        return (
          <pixiSprite
            key={`question-${i}`}
            texture={atlas.question}
            x={cx}
            y={cy}
            anchor={{ x: 0.5, y: 0.5 }}
            width={bSize.width * (highlight ? 1.12 : 1)}
            height={bSize.height * (highlight ? 1.12 : 1)}
            alpha={highlight ? 0.95 : 0.45}
          />
        );
      })}
    </pixiContainer>
  );
}

function TutorialOverlay({
  step,
  onNext,
  onDone,
}: {
  step: number;
  onNext: () => void;
  onDone: () => void;
}) {
  const last = step >= TUTORIAL_STEPS.length - 1;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.65)",
        zIndex: 20,
      }}
    >
      <div
        style={{
          background: "#2E3436",
          border: "2px solid #4f46e5",
          borderRadius: 12,
          padding: 24,
          maxWidth: 300,
          color: "#eeeeec",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ marginBottom: 8, fontWeight: 700 }}>{`${step + 1}/3`}</p>
        <p style={{ marginBottom: 16 }}>{TUTORIAL_STEPS[step]}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            style={{
              background: "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={last ? onDone : onNext}
          >
            {last ? "Başla" : "İleri"}
          </button>
          <button
            style={{
              background: "transparent",
              color: "#eeeeec",
              border: "1px solid #eeeeec",
              borderRadius: 8,
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={onDone}
          >
            {STR.skip}
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.55)",
      }}
    >
      <div
        style={{
          background: "#2E3436",
          border: "2px solid #4f46e5",
          borderRadius: 12,
          padding: 24,
          color: "#eeeeec",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {children}
      </div>
    </div>
  );
}
