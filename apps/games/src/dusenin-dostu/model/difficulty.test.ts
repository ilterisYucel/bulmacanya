/**
 * difficulty testleri — UC-4/FR-4.3-4.4: tablo değerleri, mod sabitliği,
 * sonsuz mod kademe ölçekleme + tavan.
 */
import { describe, expect, test } from "bun:test";
import { DIFFICULTY_PARAMS, FLOORS_PER_TIER, paramsFor } from "./difficulty";

describe("paramsFor", () => {
  test("kampanya/zaman/günlük modlarda taban sabit", () => {
    for (const mode of ["campaign", "time", "daily"] as const) {
      const p = paramsFor("orta", 37, mode);
      expect(p).toEqual(DIFFICULTY_PARAMS.orta);
    }
  });

  test("sonsuz mod floor 0 = taban", () => {
    expect(paramsFor("kolay", 0, "endless")).toEqual(DIFFICULTY_PARAMS.kolay);
  });

  test(`sonsuz mod floor ${FLOORS_PER_TIER} = bir üst kademe`, () => {
    expect(paramsFor("kolay", FLOORS_PER_TIER, "endless")).toEqual(DIFFICULTY_PARAMS.orta);
  });

  test("bant ortasında iki kademe arasında lerp", () => {
    const mid = paramsFor("kolay", FLOORS_PER_TIER / 2, "endless");
    expect(mid.gravity).toBeGreaterThan(DIFFICULTY_PARAMS.kolay.gravity);
    expect(mid.gravity).toBeLessThan(DIFFICULTY_PARAMS.orta.gravity);
    expect(mid.rotorRatio).toBeLessThan(DIFFICULTY_PARAMS.kolay.rotorRatio);
    expect(mid.rotorRatio).toBeGreaterThan(DIFFICULTY_PARAMS.orta.rotorRatio);
  });

  test("Rev-3: Kolay rotor yoğunluğu + ip kotası", () => {
    expect(DIFFICULTY_PARAMS.kolay.rotorRatio).toBe(0.5);
    expect(DIFFICULTY_PARAMS.kolay.ropeQuota).toBe(4);
    expect(DIFFICULTY_PARAMS.kolay.gapMin).toBe(2.5);
    expect(DIFFICULTY_PARAMS.zor.passiveDamping).toBeLessThan(
      DIFFICULTY_PARAMS.kolay.passiveDamping,
    );
  });

  test("zor tavanı aşılmaz", () => {
    const p = paramsFor("zor", 500, "endless");
    expect(p.gravity).toBe(DIFFICULTY_PARAMS.zor.gravity);
    expect(p.ropeQuota).toBe(DIFFICULTY_PARAMS.zor.ropeQuota);
  });
});
