/**
 * balloons testleri — FAZ-GAME7 AK-2.2/2.3/2.7/2.8 (UC-2).
 */
import { describe, expect, test } from "bun:test";
import { BALLOON_CAPACITY, BalloonField } from "./balloons";
import type { LetterPool } from "./letter-pool";

const BOUNDS = { width: 100, height: 200 };

function field(pool: LetterPool, rng: () => number): BalloonField {
  return new BalloonField(pool, rng, BOUNDS);
}

function seq(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

test("AK-2.2: kapasite sabit 14; aynı harften 2 balon eşzamanlı uçabilir", () => {
  const pool: LetterPool = {
    letters: ["E", "E", "A", "B", "C", "D", "F", "G", "H", "I", "K", "L", "M", "N"],
    distractorCount: 0,
  };
  // rng: harf çekimi sırasıyla 0, 0.1, 0.2… → E, E, A, …; konumlar 0.5
  const f = field(pool, seq([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.05, 0.15, 0.25, 0.35, 0.45, 0.5, 0.5]));
  const letters = f.all().map((b) => b.letter);
  expect(f.all()).toHaveLength(BALLOON_CAPACITY);
  expect(letters.filter((l) => l === "E").length).toBeGreaterThanOrEqual(2);
});

test("AK-2.3: FREE balon yukarı süzülür; tepeyi geçen havuzdan yeniden doğar", () => {
  const pool: LetterPool = { letters: ["A", "B"], distractorCount: 0 };
  const f = field(pool, seq([0, 0.5, 0.5, 0.5, 1, 0.25]));
  const b = f.all()[0]!;
  b.y = 50;
  f.tick(100, 100, 10); // dy=10 → y=40
  expect(b.y).toBe(40);
  f.tick(1000, 100, 10); // dy=100 → y=-60 < -10 → respawn
  expect(b.y).toBeGreaterThanOrEqual(BOUNDS.height + 10);
  expect(["A", "B"]).toContain(b.letter);
});

test("AK-2.7: tek aktif sürükleme — ikinci drag reddedilir (K25)", () => {
  const pool: LetterPool = { letters: ["A", "B", "C", "D"], distractorCount: 0 };
  const f = field(pool, () => 0.5);
  const [a, b] = f.all();
  expect(f.beginDrag(a!.id)).toBe(true);
  expect(f.beginDrag(b!.id)).toBe(false);
  expect(f.dragging?.id).toBe(a!.id);
});

test("AK-2.8: SET → FREE geçişte harf KORUNUR (K21)", () => {
  const pool: LetterPool = { letters: ["K", "E"], distractorCount: 0 };
  const f = field(pool, () => 0.5);
  const b = f.all()[0]!;
  const before = b.letter;
  f.setToSlot(b.id, 0);
  expect(b.state).toBe("SET");
  expect(b.slotIndex).toBe(0);
  f.freeFromSlot(b.id);
  expect(b.state).toBe("FREE");
  expect(b.slotIndex).toBeNull();
  expect(b.letter).toBe(before);
});

test("tick: DRAG ve SET balonlar hareket etmez; dt ≤ 0 no-op", () => {
  const pool: LetterPool = { letters: ["A", "B"], distractorCount: 0 };
  const f = field(pool, () => 0.5);
  const [a, b] = f.all();
  f.beginDrag(a!.id);
  a!.y = 50;
  const dragY = a!.y;
  b!.y = 50;
  f.setToSlot(b!.id, 0);
  const setY = b!.y;
  f.tick(1000, 100, 10);
  expect(a!.y).toBe(dragY);
  expect(b!.y).toBe(setY);
  f.endDrag();
  const yAfter = a!.y;
  f.tick(0, 100, 10);
  expect(a!.y).toBe(yAfter);
});
