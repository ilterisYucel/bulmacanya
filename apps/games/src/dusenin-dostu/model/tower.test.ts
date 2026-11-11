/**
 * tower testleri — UC-4/FR-4.1/FR-4.5: seed determinizmi, omurga üretimi,
 * erişilebilirlik BFS garantisi (SC-7).
 */
import { describe, expect, test } from "bun:test";
import { DIFFICULTY_PARAMS } from "./difficulty";
import { initialSpawnCount, minRopesToGoal, planFloor, spawnBricks, verifyReachable } from "./tower";
import { mulberry32 } from "./physics";
import type { Brick } from "./types";

const params = DIFFICULTY_PARAMS.orta;

function spawnAll(seed: number, floors: number): Brick[] {
  let bricks: Brick[] = [];
  let nextId = 1;
  let top: Brick | null = null;
  const solid = (list: Brick[]): Brick[] =>
    list.filter((b) => b.kind !== "coin" && b.kind !== "breaker");
  for (let f = 0; f < floors; f++) {
    const r = spawnBricks({
      rng: mulberry32(seed + f),
      nextId,
      worldWidth: 80,
      worldHeight: 160,
      params,
      from: top,
      count: 3,
    });
    bricks = [...bricks, ...r.bricks];
    nextId = r.nextId;
    top = [...solid(bricks)].sort((a, b) => a.y - b.y)[0] ?? null;
  }
  return bricks;
}

describe("spawnBricks", () => {
  test("ilk çağrıda count kadar kutu + artan id", () => {
    const r = spawnBricks({
      rng: mulberry32(7),
      nextId: 1,
      worldWidth: 80,
      worldHeight: 160,
      params,
      from: null,
      count: 4,
    });
    expect(r.bricks.length).toBeGreaterThanOrEqual(4);
    expect(r.nextId).toBeGreaterThan(r.bricks.length);
    expect(new Set(r.bricks.map((b) => b.id)).size).toBe(r.bricks.length);
  });

  test("aynı seed + floor aynı kuleyi üretir", () => {
    const a = spawnBricks({ rng: mulberry32(11), nextId: 1, worldWidth: 80, worldHeight: 160, params, from: null, count: 3 });
    const b = spawnBricks({ rng: mulberry32(11), nextId: 1, worldWidth: 80, worldHeight: 160, params, from: null, count: 3 });
    expect(a).toEqual(b);
  });

  test("kutu tipleri geçerli kümede", () => {
    const bricks = spawnAll(5, 5);
    for (const b of bricks) {
      expect(["stone", "rotor-cw", "rotor-ccw", "breaker", "chest", "coin"]).toContain(b.kind);
    }
  });

  test("rotorRatio=1 → omurga tamamı rotor (Rev-3)", () => {
    const r = spawnBricks({
      rng: mulberry32(3),
      nextId: 1,
      worldWidth: 80,
      worldHeight: 160,
      params: { ...DIFFICULTY_PARAMS.kolay, rotorRatio: 1, breakerRatio: 0 },
      from: null,
      count: 4,
    });
    const spine = r.bricks.filter(
      (b) => b.kind === "stone" || b.kind === "rotor-cw" || b.kind === "rotor-ccw" || b.kind === "chest",
    );
    expect(spine.length).toBe(4);
    expect(spine.every((b) => b.kind === "rotor-cw" || b.kind === "rotor-ccw")).toBe(true);
  });
});

describe("verifyReachable", () => {
  test("100 kat × 20 seed üretiminde omurga her zaman erişilebilir", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const bricks = spawnAll(seed, 30);
      expect(verifyReachable(bricks, 6)).toBe(true);
    }
  });

  test("boş/tek kutu durumunda doğru döner", () => {
    expect(verifyReachable([], 6)).toBe(true);
    expect(verifyReachable([{ id: 1, kind: "stone", x: 0, y: 0, used: false }], 6)).toBe(true);
  });

  test("menzil dışı kopuk kule erişilemez", () => {
    const bricks: Brick[] = [
      { id: 1, kind: "stone", x: 0, y: 0, used: false },
      { id: 2, kind: "stone", x: 40, y: -20, used: false },
    ];
    expect(verifyReachable(bricks, 6)).toBe(false);
  });
});

describe("planFloor / minRopesToGoal (K29 çözülebilirlik garantisi)", () => {
  test("minRopesToGoal: oyuncu hedef bölgedeyse 0", () => {
    expect(minRopesToGoal([], 6, { x: 0, y: 5 }, 10)).toBe(0);
  });

  test("minRopesToGoal: ulaşılamazsa Infinity", () => {
    const bricks: Brick[] = [{ id: 1, kind: "stone", x: 0, y: 80, used: false }];
    expect(minRopesToGoal(bricks, 6, { x: 0, y: 85 }, 10)).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  test("kolay: 100 seed × 20 kat — her kat 4 iple çözülebilir", () => {
    const H = 90;
    const W = 80;
    const kolay = DIFFICULTY_PARAMS.kolay;
    for (let seed = 1; seed <= 100; seed++) {
      // createGame ile aynı başlangıç: tetik bölgesine uzanan omurga.
      let bricks: Brick[] = spawnBricks({
        rng: mulberry32(seed),
        nextId: 1,
        worldWidth: W,
        worldHeight: H,
        params: kolay,
        from: null,
        count: initialSpawnCount(H, kolay),
      }).bricks;
      for (let floor = 0; floor < 20; floor++) {
        bricks = bricks
          .filter((b) => b.y <= H * 0.67)
          .map((b) => ({ ...b, y: b.y + H / 3 }));
        // En kötü durum: oyuncu ~2H/3 hizasında, kulenin üzerinde/yanında.
        const solids = bricks.filter(
          (b) => b.kind === "stone" || b.kind === "rotor-cw" || b.kind === "rotor-ccw",
        );
        const anchor = solids.sort(
          (a, b) =>
            Math.hypot(a.x - W / 2, a.y - H * 0.66) -
            Math.hypot(b.x - W / 2, b.y - H * 0.66),
        )[0]!;
        const player = { x: anchor.x, y: H * 0.66 };
        const plan = planFloor({
          bricks,
          player,
          seed,
          floor,
          worldWidth: W,
          worldHeight: H,
          params: kolay,
        });
        expect(plan.guaranteed).toBe(true);
        bricks = [...bricks, ...plan.bricks];
      }
    }
  });
});
