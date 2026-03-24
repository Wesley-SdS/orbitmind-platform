import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { wsManager } from "./lib/realtime/ws-manager";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  wsManager.initialize(server);

  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, () => {
    console.log(`> OrbitMind ready on http://localhost:${port}`);
    console.log(`> WebSocket ready on ws://localhost:${port}/api/ws`);
  });
});
