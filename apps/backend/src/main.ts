import { bootstrap } from "./composition";
import { createRestServer } from "./presentation/rest/server";

const app = bootstrap();
const server = createRestServer(app);

const port = Number(process.env.PORT ?? 3000);
await server.listen({ port, host: "0.0.0.0" });
console.log(`bulmacanya backend → http://localhost:${port} (health: /health)`);
