/**
 * DuseninDostuStage — oyun sahnesi + HUD (UC-3/UC-8, K15/K16).
 *
 * - PIXI: @pixi/react Application; arka plan / kutular / oyuncu / ip sprite'ları.
 * - Önizleme + ipucu + ret reddi: Pixi Graphics overlay (Purity 6 istisnası).
 * - Girdi: TEK dokunma — kutuya tap ip atar, boşluğa tap bırakır/zıplatır (K1).
 * - DOM: HUD (kat/puan/coin/ip/zincir/süre), butonlar, modallar, ders — TÜRKÇE.
 */
import { useEffect, useRef, useState } from "react";
import { Application, extend, useApplication } from "@pixi/react";
import { Container, Graphics, Rectangle, Sprite, type FederatedPointerEvent } from "pixi.js";
import { PixiRenderAdapter, createFxAtlas } from "@bulmacanya/game-fx-pixi";
import { FxController } from "./fx";
import { STR } from "./strings";
import { assetUrl } from "./atlas";
import { previewLanding, sweepBreaks } from "../model/preview";
import type { Brick, GameEvent } from "../model/types";
import type { DuseninAtlas } from "./atlas";
import type { DuseninDostuApi, DuseninDostuSnapshot } from "..";

extend({ Container, Sprite, Graphics });

const TUTORIAL_STEPS = [STR.tutorial1, STR.tutorial2, STR.tutorial3] as const;

const btnStyle: React.CSSProperties = {
  background: "#7c3aed",
  color: "#ffffff",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const iconStyle: React.CSSProperties = { width: 18, height: 18, verticalAlign: "middle" };

export function DuseninDostuStage({
  api,
  atlas,
  tutorial = false,
  onTutorialDone,
}: {
  api: DuseninDostuApi;
  atlas: DuseninAtlas;
  tutorial?: boolean;
  onTutorialDone?: () => void;
}) {
  const [snapshot, setSnapshot] = useState<DuseninDostuSnapshot>(() => api.getSnapshot());
  const [tutorialStep, setTutorialStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const fxRef = useRef<FxController | null>(null);

  useEffect(() => api.subscribe(() => setSnapshot(api.getSnapshot())), [api]);

  const layout = snapshot.layout;
  if (!layout) return null;

  const { state } = snapshot;

  /** Dokunma → kutu hit test (48px hedef alanı — K18). */
  const onDown = (e: FederatedPointerEvent) => {
    fxRef.current?.unlockAudio();
    if (snapshot.phase !== "playing") return;
    const wx = e.global.x / layout.step;
    const wy = e.global.y / layout.step;
    const radius = Math.max(1.4, 24 / layout.step);
    let best: Brick | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const b of state.bricks) {
      if (b.kind === "coin" || b.kind === "breaker" || b.kind === "chest") continue;
      const d = Math.hypot(b.x - wx, b.y - wy);
      if (d <= radius && d < bestDist) {
        best = b;
        bestDist = d;
      }
    }
    const result = api.tap(best?.id ?? null);
    if (result === "rejected") fxRef.current?.reject();
  };

  const closeTutorial = () => {
    setTutorialStep(-1);
    onTutorialDone?.();
  };

  const reasonText: Record<string, string> = {
    fall: STR.reasonFall,
    breaker: STR.reasonBreaker,
    "out-of-rope": STR.reasonRope,
    time: STR.reasonTime,
  };

  // Rev-5: atış reddi nedeni görünür olsun (K26).
  const rejectionText =
    snapshot.rejection !== null && snapshot.rejection.until > Date.now()
      ? ({
          range: STR.outOfRange,
          "no-rope": STR.noRope,
          "immediate-break": STR.immediateBreak,
          "invalid-target": STR.invalidTarget,
        } as Record<string, string>)[snapshot.rejection.reason] ?? null
      : null;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Application
        width={layout.width}
        height={layout.height}
        background="#2E2438"
        antialias
        autoDensity
        resolution={1}
      >
        <StageInner
          api={api}
          atlas={atlas}
          snapshot={snapshot}
          onDown={onDown}
          fxRef={fxRef}
          onEgg404={() => {
            setToast(STR.egg404Title);
            window.setTimeout(() => setToast(null), 3500);
          }}
        />
      </Application>

      {/* HUD */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          minHeight: 52,
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 8px",
          boxSizing: "border-box",
          color: "#eeeeec",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 14,
          background: "rgba(0,0,0,0.35)",
          flexWrap: "wrap",
        }}
      >
        <span>
          {STR.floor} {state.floor + 1} · {STR.score} {state.score}
        </span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <img src={assetUrl("hudCoin")} alt="" style={iconStyle} /> {state.coins}
          {snapshot.mode === "time" && state.timeLeft !== null && (
            <> · {STR.time} {Math.ceil(state.timeLeft)}s</>
          )}
          {state.chain > 0 && (
            <>
              {" "}
              · <img src={assetUrl("hudChain")} alt="" style={iconStyle} /> {STR.chain} {state.chain}
            </>
          )}
        </span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <img src={assetUrl("hudIp")} alt="" style={iconStyle} />
          {Array.from({ length: Math.min(5, state.ropesLeft) }, (_, i) => (
            <img key={i} src={assetUrl("hudIp")} alt="" style={iconStyle} />
          ))}
          ×{state.ropesLeft}
        </span>
        <span style={{ display: "flex", gap: 6 }}>
          <button
            style={btnStyle}
            disabled={snapshot.phase !== "playing"}
            onClick={() => void api.requestHint("dusenin-dostu.rota-goster")}
          >
            {STR.hint}
          </button>
          {snapshot.difficulty !== "kolay" && (
            <button
              style={btnStyle}
              disabled={snapshot.phase !== "playing"}
              onClick={() => void api.requestHint("dusenin-dostu.yavas-zaman")}
            >
              {STR.slow}
            </button>
          )}
          <button style={btnStyle} onClick={() => api.setMuted(!snapshot.muted)}>
            {STR.mute}: {snapshot.muted ? "🔇" : "🔊"}
          </button>
          <button style={btnStyle} onClick={() => api.restart()}>
            {STR.restart}
          </button>
          <button style={btnStyle} onClick={() => api.quit()}>
            {STR.back}
          </button>
        </span>
      </div>

      {/* Atış reddi nedeni (Rev-5) */}
      {rejectionText !== null && (
        <div
          style={{
            position: "absolute",
            top: 64,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(120,20,20,0.92)",
            border: "2px solid #ef4444",
            borderRadius: 10,
            padding: "8px 14px",
            color: "#ffffff",
            fontWeight: 700,
            pointerEvents: "none",
          }}
        >
          {rejectionText}
        </div>
      )}

      {/* 404 paskalya yumurtası */}
      {toast !== null && (
        <div
          style={{
            position: "absolute",
            top: 110,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(46,36,56,0.95)",
            border: "2px solid #f2b632",
            borderRadius: 10,
            padding: "10px 16px",
            color: "#f2b632",
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          <div>{toast}</div>
          <div style={{ fontSize: 12, color: "#eeeeec", fontWeight: 400 }}>{STR.egg404Body}</div>
        </div>
      )}

      {/* Modallar */}
      {snapshot.phase === "victory" && (
        <Modal>
          <h2>{STR.victory}</h2>
          <p style={{ fontSize: 24, color: "#f2b632" }}>
            {"★".repeat(snapshot.stars ?? 0)}
            <span style={{ color: "#555" }}>{"★".repeat(3 - (snapshot.stars ?? 0))}</span>
          </p>
          <p>
            {STR.score}: {state.score} · {STR.floor}: {state.floor}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button style={btnStyle} onClick={() => api.nextLevel()}>
              {STR.next}
            </button>
            <button style={btnStyle} onClick={() => api.quit()}>
              {STR.back}
            </button>
          </div>
        </Modal>
      )}

      {snapshot.phase === "gameover" && (
        <Modal>
          <h2>{STR.gameOver}</h2>
          <p>{reasonText[state.deathReason ?? "fall"] ?? STR.reasonFall}</p>
          <p>
            {STR.score}: {state.score} · {STR.floor}: {state.floor}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button style={btnStyle} onClick={() => api.restart()}>
              {STR.restart}
            </button>
            <button style={btnStyle} onClick={() => api.quit()}>
              {STR.back}
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

// --- PIXI iç katman ---

function StageInner({
  api,
  atlas,
  snapshot,
  onDown,
  fxRef,
  onEgg404,
}: {
  api: DuseninDostuApi;
  atlas: DuseninAtlas;
  snapshot: DuseninDostuSnapshot;
  onDown: (e: FederatedPointerEvent) => void;
  fxRef: React.MutableRefObject<FxController | null>;
  onEgg404: () => void;
}) {
  const appState = useApplication();
  const app = appState.app;
  const layout = snapshot.layout!;
  const { state } = snapshot;
  const step = layout.step;

  // FX kurulumu + olay köprüsü (game-fx tüketimi — K16)
  useEffect(() => {
    const adapter = new PixiRenderAdapter(app.stage);
    const fx = new FxController(adapter, createFxAtlas(app.renderer), { x: 0, y: 0 });
    fxRef.current = fx;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      fx.tick(dt, now);
      for (const event of api.takeEvents()) applyEventFx(fx, event);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      fx.destroy();
      fxRef.current = null;
    };
  }, [app, fxRef, api]);

  useEffect(() => {
    fxRef.current?.setMuted(snapshot.muted);
  }, [snapshot.muted, fxRef]);

  const applyEventFx = (fx: FxController, event: GameEvent): void => {
    // Kapanıştaki `state` bayat olabilir — olay anındaki snapshot kullanılır.
    const latest = api.getSnapshot().state;
    switch (event.type) {
      case "attach":
        fx.attach();
        break;
      case "land": {
        const b = latest.bricks.find((x) => x.id === event.brickId);
        if (b) fx.land(b.x * step, b.y * step);
        break;
      }
      case "ropeBreak":
        fx.ropeBreak(latest.player.x * step, latest.player.y * step);
        break;
      case "coin":
      case "chest":
        fx.coin(latest.player.x * step, latest.player.y * step);
        break;
      case "floorUp":
        fx.floorUp((layout.width / 2), layout.height / 2);
        break;
      case "egg404":
        onEgg404();
        break;
      case "over":
        fx.over();
        break;
      case "release":
        break;
    }
  };

  const bg =
    state.floor < 15 ? atlas.bgCave : state.floor < 60 ? atlas.bgMid : atlas.bgSky;

  const preview = snapshot.phase === "playing" ? previewLanding(state) : null;
  const breaking = snapshot.phase === "playing" ? sweepBreaks(state, 1) : [];
  const hintBrick =
    snapshot.hintBrickId !== null && snapshot.hintUntil > performance.now()
      ? state.bricks.find((b) => b.id === snapshot.hintBrickId) ?? null
      : null;
  const rejected =
    snapshot.rejection !== null && snapshot.rejection.until > performance.now();

  return (
    <pixiContainer
      eventMode="static"
      hitArea={new Rectangle(0, 0, layout.width, layout.height)}
      onPointerDown={onDown}
    >
      <pixiSprite texture={bg} x={0} y={0} width={layout.width} height={layout.height} />

      {/* Kutular */}
      {state.bricks.map((b) => {
        if (b.used && (b.kind === "coin" || b.kind === "chest")) return null;
        const texture =
          b.kind === "coin"
            ? atlas.coin
            : b.kind === "breaker"
              ? atlas.breaker
              : b.kind === "chest"
                ? b.used
                  ? atlas.brick
                  : atlas.chest
                : b.kind === "rotor-cw"
                  ? atlas.rotorCw
                  : b.kind === "rotor-ccw"
                    ? atlas.rotorCcw
                    : atlas.brick;
        const size = b.kind === "coin" ? layout.brickSize * 0.8 : layout.brickSize;
        // Rev-4: rotor kendi ekseninde döner — ok yönü canlı okunur.
        const spin = Date.now() / 1000;
        const rotation =
          b.kind === "rotor-cw"
            ? (spin * 1.5) % (Math.PI * 2)
            : b.kind === "rotor-ccw"
              ? (-spin * 1.5) % (Math.PI * 2)
              : 0;
        return (
          <pixiSprite
            key={b.id}
            texture={texture}
            x={b.x * step}
            y={b.y * step}
            anchor={{ x: 0.5, y: 0.5 }}
            width={size}
            height={size}
            rotation={rotation}
            alpha={b.kind === "chest" && b.used ? 0.6 : 1}
          />
        );
      })}

      {/* İp + kanca */}
      {state.rope !== null &&
        (() => {
          const brick = state.bricks.find((b) => b.id === state.rope!.brickId);
          if (!brick) return null;
          const px = state.player.x * step;
          const py = state.player.y * step;
          const bx = brick.x * step;
          const by = brick.y * step;
          const angle = Math.atan2(by - py, bx - px);
          const dist = Math.hypot(bx - px, by - py);
          return (
            <pixiContainer key="rope">
              <pixiSprite
                texture={atlas.rope}
                x={(px + bx) / 2}
                y={(py + by) / 2}
                anchor={{ x: 0.5, y: 0.5 }}
                width={dist}
                height={Math.max(5, step * 0.28)}
                rotation={angle}
              />
              <pixiSprite
                texture={atlas.hook}
                x={bx}
                y={by}
                anchor={{ x: 0.5, y: 0.5 }}
                width={step * 0.8}
                height={step * 0.8}
                rotation={angle - Math.PI / 2}
              />
            </pixiContainer>
          );
        })()}

      {/* Oyuncu */}
      <pixiSprite
        texture={state.phase === "swing" ? atlas.playerSwing : atlas.playerIdle}
        x={state.player.x * step}
        y={state.player.y * step}
        anchor={{ x: 0.5, y: 0.5 }}
        width={layout.playerSize}
        height={layout.playerSize}
      />

      {/* Önizleme + ipucu + ret overlay */}
      <pixiGraphics
        draw={(g: Graphics) => {
          g.clear();
          if (preview) {
            for (const p of preview.points) {
              g.circle(p.x * step, p.y * step, 2.2).fill({ color: 0xffffff, alpha: 0.5 });
            }
            if (preview.landing) {
              g.circle(preview.landing.x * step, preview.landing.y * step, 9).stroke({
                width: 2.5,
                color: 0x4ac07a,
                alpha: 0.95,
              });
            }
          }
          for (const id of breaking) {
            const b = state.bricks.find((x) => x.id === id);
            if (b) {
              g.circle(b.x * step, b.y * step, layout.brickSize * 0.7).stroke({
                width: 2,
                color: 0xef4444,
                alpha: 0.9,
              });
            }
          }
          if (hintBrick) {
            g.circle(hintBrick.x * step, hintBrick.y * step, layout.brickSize * 0.75).stroke({
              width: 3,
              color: 0xf2b632,
              alpha: 0.9,
            });
          }
          if (rejected) {
            g.circle(state.player.x * step, state.player.y * step, layout.playerSize * 0.8).stroke({
              width: 3,
              color: 0xef4444,
              alpha: 0.9,
            });
          }
        }}
      />
    </pixiContainer>
  );
}

// --- DOM yardımcıları ---

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
          background: "#2E2438",
          border: "2px solid #7c3aed",
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
          <button style={btnStyle} onClick={last ? onDone : onNext}>
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
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: "#2E2438",
          border: "2px solid #7c3aed",
          borderRadius: 12,
          padding: 24,
          color: "#eeeeec",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          maxWidth: 300,
        }}
      >
        {children}
      </div>
    </div>
  );
}
