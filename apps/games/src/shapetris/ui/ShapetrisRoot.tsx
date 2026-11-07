/**
 * ShapetrisRoot — oyun sahnesi + DOM kontrol katmanı (UC-9, K14).
 *
 * - PIXI katmanı: @pixi/react@8 Application + pixiSprite/pixiContainer intrinsic'leri.
 * - DOM katmanı: başlık (bölüm/skor/süre), ipucu butonları, modal'lar — TÜRKÇE.
 * - Sürükleme: tam ekran etkileşimli kök container (hitArea) üzerinde yönetilir;
 *   bırakma mesafesi ≤ step ise parça 90° CW döner (FR-3.2), aksi halde
 *   model/layout#snapPiece ile hücreye yerleştirilir (UC-4).
 * - Responsive: container boyutu → model/layout#calculateLayout (UC-7).
 */

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Application, extend } from "@pixi/react";
import {
  Container,
  Rectangle,
  Sprite,
  type FederatedPointerEvent,
} from "pixi.js";
import { canPlace } from "../model/board";
import { PIECES, PIECE_ORIGINS, rotateCW } from "../model/pieces";
import {
  calculateLayout,
  ghostAnchorPos,
  phoneArea,
  snapPiece,
  type LayoutMetrics,
} from "../model/layout";
import type {
  ShapetrisApi,
  ShapetrisSnapshot,
  TrayPiece,
} from "../model/api-types";
import type { AtlasFrames } from "./atlas";
import { STR } from "./strings";

// @pixi/react@8: JSX intrinsic'leri (pixiContainer/pixiSprite) extend ile kaydedilir — S7
extend({ Container, Sprite });

interface DragState {
  slot: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
}

interface RootProps {
  api: ShapetrisApi;
  frames: AtlasFrames;
  tutorial?: boolean;
  onTutorialDone?: () => void;
}

// S15 (2026-11-05): aktif parça dinlenme boyutu hücre cinsinden — kullanıcı kararıyla 1
// (next ile aynı boy); sürüklemede ×2 büyüme KORUNDU (scale). Eski oyun 2 idi.
const CUR_TILE_CELLS = 2;

const VICTORY_AUTO_NEXT_MS = 1500;

export function ShapetrisRoot({
  api,
  frames,
  tutorial = false,
  onTutorialDone,
}: RootProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [snapshot, setSnapshot] = useState<ShapetrisSnapshot>(() =>
    api.getSnapshot(),
  );
  const [drag, setDrag] = useState<DragState | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    return api.subscribe(() => setSnapshot(api.getSnapshot()));
  }, [api]);

  useLayoutEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Zafer modalı → otomatik sonraki bölüm (günlükte ve kampanya sonunda YOK)
  useEffect(() => {
    if (snapshot.phase !== "victory") return;
    if (snapshot.mode === "daily" || snapshot.campaignComplete) return;
    const id = setTimeout(() => api.nextLevel(), VICTORY_AUTO_NEXT_MS);
    return () => clearTimeout(id);
  }, [snapshot.phase, snapshot.mode, snapshot.campaignComplete, api]);

  const closeTutorial = () => {
    setTutorialStep(-1);
    onTutorialDone?.();
  };

  const area = phoneArea(size);
  const layout = calculateLayout(area);

  const cellAt = (gx: number, gy: number): { x: number; y: number } | null => {
    const i = Math.floor((gx - layout.xStart) / layout.step);
    const j = Math.floor((gy - layout.yStart) / layout.step);
    if (i < 0 || j < 0 || i >= 12 || j >= 12) return null;
    return { x: i, y: j };
  };

  // S13: tepsi eski panel matematiğiyle — ekran altında (alan altı)
  const traySlotPos = (slot: number): { x: number; y: number } => ({
    x: layout.indent + (4.5 + 3 * slot) * layout.step,
    y: area.height - 2 * layout.step,
  });

  const nextSlotPos = (slot: number): { x: number; y: number } => ({
    x: layout.indent + (2 + 8 * slot) * layout.step,
    y: area.height - 1.5 * layout.step,
  });

  const hitTraySlot = (gx: number, gy: number): number | null => {
    for (const slot of [0, 1]) {
      const pos = traySlotPos(slot);
      const half = (CUR_TILE_CELLS * layout.step) / 2 + 8;
      if (Math.abs(gx - pos.x) <= half && Math.abs(gy - pos.y) <= half) {
        return slot;
      }
    }
    return null;
  };

  const onStageDown = (e: FederatedPointerEvent) => {
    if (snapshot.phase !== "playing") return;
    const { x, y } = e.global;
    if (selectMode) {
      const cell = cellAt(x, y);
      if (!cell) return;
      if (!snapshot.board[cell.y]?.[cell.x]?.filled) return;
      setBusy(true);
      setSelectMode(false);
      void api.requestCellDelete(cell.x, cell.y).finally(() => setBusy(false));
      return;
    }
    const slot = hitTraySlot(x, y);
    if (slot !== null) {
      setDrag({ slot, x, y, startX: x, startY: y });
    }
  };

  const onStageMove = (e: FederatedPointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, x: e.global.x, y: e.global.y });
  };

  const onStageUp = (e: FederatedPointerEvent) => {
    if (!drag) return;
    const { x, y } = e.global;
    const moved = Math.hypot(x - drag.startX, y - drag.startY);
    setDrag(null);
    if (snapshot.phase !== "playing") return;
    const piece = snapshot.tray[drag.slot];
    if (!piece) return;
    if (moved <= layout.step) {
      // FR-3.2: bırakılan mesafe ≤ 1 hücre → 90° CW döndürme
      api.rotateSlot(drag.slot);
      return;
    }
    const cell = snapPiece(x, y, piece.tileId, piece.rotation, layout);
    api.placePiece(drag.slot, cell.x, cell.y);
  };

  const headerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    color: "#eeeeec",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 700,
    background: "rgba(0,0,0,0.35)",
  };

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

  return (
    <div ref={holderRef} style={{ position: "absolute", inset: 0 }}>
      {layout.valid && size.width > 0 ? (
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
            <pixiContainer
              eventMode="static"
              hitArea={new Rectangle(0, 0, area.width, area.height)}
              onPointerDown={onStageDown}
              onPointerMove={onStageMove}
              onPointerUp={onStageUp}
              onPointerUpOutside={onStageUp}
            >
              <BoardLayer
                board={snapshot.board}
                boardVersion={snapshot.boardVersion}
                layout={layout}
                frames={frames}
              />
              <TrayLayer
                board={snapshot.board}
                tray={snapshot.tray}
                next={snapshot.next}
                trayVersion={snapshot.trayVersion}
                layout={layout}
                frames={frames}
                drag={drag}
                slotPos={traySlotPos}
                nextPos={nextSlotPos}
              />
            </pixiContainer>
          </Application>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#eeeeec",
          }}
        >
          {STR.layoutInvalid}
        </div>
      )}

      <div style={headerStyle}>
        <span>
          {STR.level} {snapshot.levelNo + 1} · {STR.score} {snapshot.totalScore}
        </span>
        <span>
          {STR.time}: {Math.ceil(snapshot.timeLeft)}s
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          <button
            style={btnStyle}
            disabled={busy || snapshot.phase !== "playing"}
            onClick={() => void api.requestBorderClear()}
          >
            {STR.hintBorder}
          </button>
          <button
            style={{
              ...btnStyle,
              background: selectMode ? "#b91c1c" : "#4f46e5",
            }}
            disabled={busy || snapshot.phase !== "playing"}
            onClick={() => setSelectMode((s) => !s)}
          >
            {STR.hintCell}
          </button>
          <button style={btnStyle} onClick={() => api.restartLevel()}>
            {STR.restart}
          </button>
          <button style={btnStyle} onClick={() => api.exit()}>
            {STR.exit}
          </button>
        </span>
      </div>

      {selectMode && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#eeeeec",
            fontWeight: 700,
          }}
        >
          {STR.hintCellPick}
        </div>
      )}

      {snapshot.phase === "gameover" && (
        <Modal>
          <h2>{STR.gameOver}</h2>
          <p>
            {STR.score}: {snapshot.totalScore}
          </p>
          <button style={btnStyle} onClick={() => api.restartLevel()}>
            {STR.restart}
          </button>
        </Modal>
      )}

      {snapshot.phase === "victory" && (
        <Modal>
          <h2>
            {snapshot.campaignComplete
              ? STR.campaignDone
              : snapshot.mode === "daily"
                ? STR.dailyDone
                : STR.victory}
          </h2>
          <p>
            {STR.score}: {snapshot.totalScore}
          </p>
          {snapshot.campaignComplete || snapshot.mode === "daily" ? (
            <button style={btnStyle} onClick={() => api.exit()}>
              {STR.exit}
            </button>
          ) : (
            <button style={btnStyle} onClick={() => api.nextLevel()}>
              {STR.next}
            </button>
          )}
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

const TUTORIAL_STEPS = [
  "Parçayı sürüklemek için parmağını kullan",
  "Yeşil hedefin üzerine bırak — kırmızılara da taşabilirsin",
  "Satır veya sütun tam dolunca silinir; tüm yeşilleri doldur, kırmızıları boş bırak!",
] as const;

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

function rotated(piece: TrayPiece): number[][] {
  let p = PIECES[piece.tileId]!;
  for (let r = 0; r < piece.rotation; r++) p = rotateCW(p);
  return p;
}

interface BoardLayerProps {
  board: ShapetrisSnapshot["board"];
  boardVersion: number;
  layout: LayoutMetrics;
  frames: AtlasFrames;
}

const BoardLayer = memo(function BoardLayer({
  board,
  layout,
  frames,
}: BoardLayerProps) {
  const { step } = layout;
  const sprites = [];
  for (let j = 0; j < 12; j++) {
    for (let i = 0; i < 12; i++) {
      const cell = board[j]?.[i];
      if (!cell) continue;
      const texture =
        cell.kind === "blue"
          ? cell.filled
            ? frames.blueOn
            : frames.blueOff
          : cell.kind === "green"
            ? cell.filled
              ? frames.greenOn
              : frames.greenOff
            : cell.filled
              ? frames.redOn
              : frames.redOff;
      sprites.push(
        <pixiSprite
          key={`${j}-${i}`}
          texture={texture}
          x={layout.xStart + step * i + 0.5}
          y={layout.yStart + step * j + 0.5}
          width={step - 1}
          height={step - 1}
        />,
      );
    }
  }
  return <>{sprites}</>;
});

interface TrayLayerProps {
  board: ShapetrisSnapshot["board"];
  tray: TrayPiece[];
  next: number[];
  trayVersion: number;
  layout: LayoutMetrics;
  frames: AtlasFrames;
  drag: DragState | null;
  slotPos: (slot: number) => { x: number; y: number };
  nextPos: (slot: number) => { x: number; y: number };
}

const TrayLayer = memo(function TrayLayer({
  board,
  tray,
  next,
  layout,
  frames,
  drag,
  slotPos,
  nextPos,
}: TrayLayerProps) {
  const { step } = layout;
  const sprites = [];
  for (let slot = 0; slot < 2; slot++) {
    const piece = tray[slot];
    if (!piece) continue;
    const isDragging = drag?.slot === slot;
    // S10: kare token — sürüklerken parmağın 1 hücre üstünde (eski davranış)
    const pos = isDragging ? { x: drag.x, y: drag.y - step } : slotPos(slot);
    // S16: boyut YALNIZ width/height üzerinden — scale prop'u kullanma:
    // pixi v8'de width = scale.x · texture.orig.width; scale ataması boyutu doğal değere bozar.
    const tokenSize = CUR_TILE_CELLS * step * (isDragging ? 2 : 1);
    sprites.push(
      <pixiSprite
        key={`cur-${slot}-${piece.tileId}`}
        texture={frames.pieces[piece.tileId]!}
        x={pos.x}
        y={pos.y}
        width={tokenSize}
        height={tokenSize}
        anchor={PIECE_ORIGINS[piece.tileId]}
        rotation={(piece.rotation * Math.PI) / 2}
        alpha={isDragging ? 0.5 : 1}
      />,
    );
    const nid = next[slot];
    if (nid === undefined) continue;
    const npos = nextPos(slot);
    sprites.push(
      <pixiSprite
        key={`next-${slot}`}
        texture={frames.pieces[nid]!}
        x={npos.x}
        y={npos.y}
        width={step}
        height={step}
        anchor={PIECE_ORIGINS[nid]}
        alpha={0.5}
      />,
    );
  }
  // S10: ghost — token'ın oturacağı çapa konumu (round-trip garantili); yeşil/geçerli, kırmızı/geçersiz
  if (drag) {
    const piece = tray[drag.slot];
    if (piece) {
      const dist = Math.hypot(drag.x - drag.startX, drag.y - drag.startY);
      if (dist > step) {
        const mat = rotated(piece);
        const cell = snapPiece(
          drag.x,
          drag.y,
          piece.tileId,
          piece.rotation,
          layout,
        );
        const ok = canPlace(board, cell.x, cell.y, mat);
        const anchor = ghostAnchorPos(
          cell,
          piece.tileId,
          piece.rotation,
          layout,
        );
        const ghostSize = CUR_TILE_CELLS * 2 * step; // sürükleme boyutuyla aynı (×2)
        sprites.push(
          <pixiSprite
            key="ghost"
            texture={frames.pieces[piece.tileId]!}
            x={anchor.x}
            y={anchor.y}
            width={ghostSize}
            height={ghostSize}
            anchor={PIECE_ORIGINS[piece.tileId]}
            rotation={(piece.rotation * Math.PI) / 2}
            alpha={0.35}
            tint={ok ? 0x22c55e : 0xef4444}
          />,
        );
      }
    }
  }
  return <>{sprites}</>;
});
