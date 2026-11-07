/**
 * slots testleri — FAZ-GAME7 AK-2.1/2.4/2.5/2.6/2.8 (UC-2).
 */
import { describe, expect, test } from "bun:test";
import { SlotBoard } from "./slots";

test("AK-2.1: slot sayısı = kelime uzunluğu N", () => {
  expect(new SlotBoard(4).count).toBe(4);
  expect(new SlotBoard(4).letters()).toEqual([null, null, null, null]);
});

test("AK-2.4: en yakın slot + yerinden etme — eski balon harfiyle döner", () => {
  const board = new SlotBoard(4);
  expect(board.place(1, "E", 1)).toEqual({ ok: true, displaced: undefined });
  const r = board.place(2, "K", 1);
  expect(r.ok).toBe(true);
  expect(r.displaced).toEqual({ balloonId: 1, letter: "E" });
  expect(board.letters()).toEqual([null, "K", null, null]);
});

test("AK-2.5: klasik per-slot doğrulama — yanlış harf geri seker (K23)", () => {
  const board = new SlotBoard(4);
  const expected = ["K", "E", "D", "İ"];
  expect(board.place(1, "A", 0, expected)).toEqual({ ok: false, reason: "wrong-letter" });
  expect(board.letters()[0]).toBeNull();
  expect(board.place(1, "K", 0, expected).ok).toBe(true);
  // expected verilmezse serbest oturma (Dedektif/Sabit)
  const free = new SlotBoard(4);
  expect(free.place(1, "A", 0).ok).toBe(true);
});

test("AK-2.6: kilitli slot reddedilir, kilitli harf yerinde kalır", () => {
  const board = new SlotBoard(4, ["K", null, null, "İ"]);
  expect(board.isLocked(0)).toBe(true);
  expect(board.place(1, "A", 0)).toEqual({ ok: false, reason: "locked" });
  expect(board.letters()[0]).toBe("K");
  expect(board.place(1, "E", 1).ok).toBe(true);
});

test("AK-2.8: SET balon çıkarılınca slot boşalır", () => {
  const board = new SlotBoard(4);
  board.place(7, "K", 2);
  expect(board.letters()[2]).toBe("K");
  board.removeByBalloon(7);
  expect(board.letters()[2]).toBeNull();
});

test("isFull: tüm slotlar dolunca true (kilitli dahil)", () => {
  const board = new SlotBoard(3, ["A", null, null]);
  expect(board.isFull()).toBe(false);
  board.place(1, "B", 1);
  board.place(2, "C", 2);
  expect(board.isFull()).toBe(true);
});
