/**
 * fx-audio testleri — FAZ-GAME-FX-SPEC AK-3.1/3.2/3.4/3.5 (mock AudioContext).
 */
import { describe, expect, test } from "bun:test";
import { FxAudio } from "./fx-audio";
import type { IAudioContextLike } from "./fx-audio";

interface OscRecord {
  type: string;
  freq: number;
  connects: unknown[];
  startAt?: number;
  stopAt?: number;
}

interface GainRecord {
  value: number;
  connects: unknown[];
}

interface Mock {
  factory: () => IAudioContextLike;
  oscs: OscRecord[];
  gains: GainRecord[];
  dest: { tag: string };
}

function mockContext(): Mock {
  const oscs: OscRecord[] = [];
  const gains: GainRecord[] = [];
  const dest = { tag: "destination" };
  const ctx: IAudioContextLike = {
    currentTime: 100,
    destination: dest,
    createOscillator: () => {
      const rec: OscRecord = { type: "", freq: 0, connects: [] };
      oscs.push(rec);
      return {
        get type() {
          return rec.type;
        },
        set type(v: string) {
          rec.type = v;
        },
        frequency: {
          get value() {
            return rec.freq;
          },
          set value(v: number) {
            rec.freq = v;
          },
        },
        connect: (node: unknown) => rec.connects.push(node),
        start: (when?: number) => {
          rec.startAt = when;
        },
        stop: (when?: number) => {
          rec.stopAt = when;
        },
      };
    },
    createGain: () => {
      const rec: GainRecord = { value: 0, connects: [] };
      gains.push(rec);
      return {
        gain: {
          get value() {
            return rec.value;
          },
          set value(v: number) {
            rec.value = v;
          },
        },
        connect: (node: unknown) => rec.connects.push(node),
      };
    },
    resume: () => {},
    close: () => {},
  };
  return { factory: () => ctx, oscs, gains, dest };
}

test("AK-3.2: unlock öncesi sessiz no-op; unlock sonrası çalar", () => {
  const m = mockContext();
  const fx = new FxAudio(m.factory);
  fx.play("tick");
  expect(m.oscs).toHaveLength(0);
  fx.unlock();
  fx.play("tick");
  expect(m.oscs).toHaveLength(1);
});

test("AK-3.1: mute açıkken hiçbir osilatör üretilmez", () => {
  const m = mockContext();
  const fx = new FxAudio(m.factory);
  fx.unlock();
  fx.setMuted(true);
  fx.play("pop");
  expect(m.oscs).toHaveLength(0);
  fx.setMuted(false);
  fx.play("pop");
  expect(m.oscs).toHaveLength(1);
});

test("AK-3.4: boop — osilatör/zarf/kayıt sırası birebir", () => {
  const m = mockContext();
  const fx = new FxAudio(m.factory);
  fx.unlock();
  fx.play("boop");
  const osc = m.oscs[0]!;
  const gain = m.gains[0]!;
  expect(osc.type).toBe("sawtooth");
  expect(osc.freq).toBe(220);
  expect(gain.value).toBeCloseTo(0.16);
  expect(osc.connects).toHaveLength(1); // osc → gain
  expect(gain.connects).toEqual([m.dest]); // gain → destination
  expect(osc.startAt).toBe(100);
  expect(osc.stopAt).toBeCloseTo(100.16);
});

test("arpeggio: 3 nota doğru zamanlarda", () => {
  const m = mockContext();
  const fx = new FxAudio(m.factory);
  fx.unlock();
  fx.play("arpeggio");
  expect(m.oscs).toHaveLength(3);
  expect(m.oscs[0]!.startAt).toBe(100);
  expect(m.oscs[1]!.startAt).toBeCloseTo(100.09);
  expect(m.oscs[2]!.startAt).toBeCloseTo(100.18);
});

test("AK-3.5: fabrika null → hata yok, sessiz no-op", () => {
  const fx = new FxAudio(() => null);
  fx.unlock();
  fx.play("pop"); // çökme yok
  expect(fx.unlocked).toBe(true);
});

test("destroy: sonrası çağrılar no-op; close çağrılır", () => {
  let closed = false;
  const m = mockContext();
  const ctx = m.factory();
  ctx.close = () => {
    closed = true;
  };
  const fx = new FxAudio(() => ctx);
  fx.unlock();
  fx.destroy();
  expect(closed).toBe(true);
  fx.play("pop"); // no-op
});
