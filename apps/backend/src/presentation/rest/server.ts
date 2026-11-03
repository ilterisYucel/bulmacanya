import Fastify, { type FastifyInstance } from "fastify";
import type { App } from "../../application/app";

/**
 * REST adaptör — aynı App örneğine bağlanır (AK-2.2).
 * İş mantığı YOKTUR: yalnızca HTTP'yi App metotlarına çevirir.
 */
export function createRestServer(app: App): FastifyInstance {
  const server = Fastify({ logger: false });

  // ponytail: Fastify v5 onRequest hook'u Bun altında inject ile takılıyor;
  // touch'ı handler içinden çağırıyoruz. Hook'a dönülürse önce Bun uyumluluğu doğrulanmalı.
  server.get("/health", async () => {
    app.touch();
    const health = await app.health();
    return { ok: health.ok };
  });

  return server;
}
