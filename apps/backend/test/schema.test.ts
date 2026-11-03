import { describe, expect, test } from "bun:test";
import { getTableName } from "drizzle-orm";
import { tableList } from "../src/infra/db/schema";

describe("UC-5 — Drizzle şema (K7, K8)", () => {
  test("AK-5.1: 10 tablo tanımlı ve doğru isimlerde", () => {
    const names = tableList.map((t) => getTableName(t));
    expect(names).toHaveLength(10);
    expect(names).toEqual([
      "users",
      "skills",
      "profile",
      "progress",
      "sessions",
      "achievements",
      "hints",
      "coins",
      "subscriptions",
      "daily_puzzle",
    ]);
  });
});
