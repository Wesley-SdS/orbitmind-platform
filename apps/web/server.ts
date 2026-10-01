/**
 * Servidor do OrbitMind: Next.js + WebSocket (`/api/ws`) no mesmo processo.
 * `tsx server.ts` roda em desenvolvimento; `tsx server.ts --prod` usa o build
 * de produção (sem depender de `NODE_ENV=…` na linha de comando, que não
 * funciona no Windows).
 */
import { createServer } from "node:http";
import { parse } from "node:url";

const prod = process.argv.includes("--prod");
if (prod) (process.env as Record<string, string>).NODE_ENV = "production";

async function main(): Promise<void> {
  // imports depois de definir o NODE_ENV: o Next lê o ambiente ao carregar
  const { default: next } = await import("next");
  const { wsManager } = await import("./lib/realtime/ws-manager");

  const app = next({ dev: !prod });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    void handle(req, res, parsedUrl);
  });

  wsManager.initialize(server);

  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, () => {
    console.log(`> OrbitMind ${prod ? "(produção)" : "(dev)"} em http://localhost:${port}`);
    console.log(`> WebSocket em ws://localhost:${port}/api/ws`);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
