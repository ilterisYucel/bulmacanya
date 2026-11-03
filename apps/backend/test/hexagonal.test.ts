import { describe, expect, test } from "bun:test";
import { bootstrap } from "../src/composition";
import { createRestServer } from "../src/presentation/rest/server";
import { runCliCommand } from "../src/presentation/cli/run";

describe("UC-2 — backend hexagonal iskelet", () => {
  test("AK-2.4: GET /health 200 döner", async () => {
    const app = bootstrap();
    const server = createRestServer(app);
    const res = await server.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  test("AK-2.2: REST ve CLI aynı application örneğini paylaşır", async () => {
    const app = bootstrap();
    const server = createRestServer(app);
    await server.inject({ method: "GET", url: "/health" }); // visits: 0 → 1
    const out = await runCliCommand(app, ["visits"]); // aynı app: 1 → 2
    expect(out).toContain("2");
  });

  test("CLI bilinmeyen komutta hata fırlatır (sessiz davranış YOK)", async () => {
    const app = bootstrap();
    await expect(runCliCommand(app, ["bilinmeyen"])).rejects.toThrow();
  });
});
