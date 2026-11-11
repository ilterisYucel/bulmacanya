/**
 * checkpoint testleri — UC-6/UC-9 (G3): kademe ilerlemesi, kilit, günlük kilit,
 * ders bayrağı. localStorage stub'ı ile (Node ortamı).
 */
import { beforeEach, describe, expect, test } from "bun:test";

const store = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  },
});

const {
  dailyDone,
  isDifficultyUnlocked,
  levelNoFor,
  levelsDone,
  readCheckpoint,
  setTutorialDone,
  tutorialDone,
  writeCheckpoint,
} = await import("./checkpoint");
const { CAMPAIGN_LEVELS } = await import("@bulmacanya/games/dusenin-dostu/campaign");

beforeEach(() => {
  store.clear();
});

describe("checkpoint", () => {
  test("kampanya kaydı ilerlemeyi ve devam noktasını günceller", () => {
    writeCheckpoint({ mode: "campaign", difficulty: "orta", levelNo: 3 });
    expect(readCheckpoint()).toMatchObject({ difficulty: "orta", levelNo: 3 });
    expect(levelsDone("orta")).toBe(3);
    expect(levelNoFor("orta")).toBe(3);
  });

  test("ilerleme geriye gitmez (max)", () => {
    writeCheckpoint({ mode: "campaign", difficulty: "kolay", levelNo: 5 });
    writeCheckpoint({ mode: "campaign", difficulty: "kolay", levelNo: 2 });
    expect(levelsDone("kolay")).toBe(5);
  });

  test("kademe kilidi: kolay açık, orta/zor tamamlanınca", () => {
    expect(isDifficultyUnlocked("kolay")).toBe(true);
    expect(isDifficultyUnlocked("orta")).toBe(false);
    writeCheckpoint({ mode: "campaign", difficulty: "kolay", levelNo: CAMPAIGN_LEVELS });
    expect(isDifficultyUnlocked("orta")).toBe(true);
    expect(isDifficultyUnlocked("zor")).toBe(false);
    writeCheckpoint({ mode: "campaign", difficulty: "orta", levelNo: CAMPAIGN_LEVELS });
    expect(isDifficultyUnlocked("zor")).toBe(true);
  });

  test("geçersiz payload sessizce yok sayılır", () => {
    writeCheckpoint(null);
    writeCheckpoint({ mode: "campaign" });
    writeCheckpoint("bozuk");
    expect(readCheckpoint()).toBeNull();
    expect(levelsDone("kolay")).toBe(0);
  });

  test("günlük kaydı günlük kilidi açar ve checkpoint'i ezmez", () => {
    writeCheckpoint({ mode: "campaign", difficulty: "kolay", levelNo: 1 });
    writeCheckpoint({ mode: "daily", difficulty: "kolay", levelNo: 0 });
    expect(dailyDone()).toBe(true);
    expect(readCheckpoint()).toMatchObject({ mode: "campaign", levelNo: 1 });
  });

  test("ders bayrağı bir kez yazılır", () => {
    expect(tutorialDone()).toBe(false);
    setTutorialDone();
    expect(tutorialDone()).toBe(true);
  });
});
