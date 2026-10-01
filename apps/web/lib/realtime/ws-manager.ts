import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";

interface Client {
  ws: WebSocket;
  userId: string;
  orgId: string;
  subscribedSquads: Set<string>;
}

interface WsBroadcastMessage {
  type: string;
  [key: string]: unknown;
}

class WsManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();

  initialize(server: import("node:http").Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (req: IncomingMessage, socket: import("node:stream").Duplex, head: Buffer) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      if (url.pathname !== "/api/ws") {
        socket.destroy();
        return;
      }

      const token = url.searchParams.get("token");
      if (!token) {
        socket.destroy();
        return;
      }

      this.wss!.handleUpgrade(req, socket, head, (ws) => {
        this.handleConnection(ws, token);
      });
    });
  }

  private async handleConnection(ws: WebSocket, token: string) {
    // mensagens que chegam enquanto o token é validado (ex.: SUBSCRIBE logo no open) não podem se perder
    const early: string[] = [];
    const buffer = (raw: unknown): void => { early.push(String(raw)); };
    ws.on("message", buffer);

    const decoded = await this.validateToken(token);
    ws.off("message", buffer);
    if (!decoded) {
      ws.close(4001, "Unauthorized");
      return;
    }

    const clientId = crypto.randomUUID();
    const client: Client = {
      ws,
      userId: decoded.userId,
      orgId: decoded.orgId,
      subscribedSquads: new Set(),
    };
    this.clients.set(clientId, client);

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleMessage(clientId, msg);
      } catch {
        /* ignore malformed */
      }
    });

    ws.on("close", () => {
      this.clients.delete(clientId);
    });

    ws.send(JSON.stringify({ type: "CONNECTED", clientId }));
    for (const raw of early) {
      try { this.handleMessage(clientId, JSON.parse(raw)); } catch { /* ignore malformed */ }
    }
  }

  /** Só se inscreve em squads da própria organização (senão veria eventos de outro tenant). */
  private async canSubscribe(orgId: string, squadId: string): Promise<boolean> {
    if (!UUID_RE.test(squadId) || !orgId) return false;
    try {
      const [{ db }, { squads }, { eq }] = await Promise.all([import("../db"), import("../db/schema"), import("drizzle-orm")]);
      const [row] = await db.select({ orgId: squads.orgId }).from(squads).where(eq(squads.id, squadId)).limit(1);
      return row?.orgId === orgId;
    } catch (err) {
      console.error("[ws] falha ao validar a inscrição no squad", err);
      return false;
    }
  }

  private handleMessage(clientId: string, msg: { type: string; squadId?: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (msg.type) {
      case "SUBSCRIBE_SQUAD": {
        const squadId = msg.squadId;
        if (!squadId) break;
        void this.canSubscribe(client.orgId, squadId).then((ok) => {
          if (!this.clients.has(clientId)) return;
          if (ok) {
            client.subscribedSquads.add(squadId);
            client.ws.send(JSON.stringify({ type: "SUBSCRIBED", squadId }));
          } else {
            client.ws.send(JSON.stringify({ type: "SUBSCRIBE_DENIED", squadId }));
          }
        });
        break;
      }
      case "UNSUBSCRIBE_SQUAD":
        if (msg.squadId) client.subscribedSquads.delete(msg.squadId);
        break;
      case "PING":
        client.ws.send(JSON.stringify({ type: "PONG" }));
        break;
    }
  }

  broadcastToSquad(squadId: string, message: WsBroadcastMessage) {
    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.subscribedSquads.has(squadId) && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(data);
        } catch {
          /* connection dying */
        }
      }
    }
  }

  broadcastToOrg(orgId: string, message: WsBroadcastMessage) {
    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.orgId === orgId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(data);
        } catch {
          /* connection dying */
        }
      }
    }
  }

  private async validateToken(token: string): Promise<{ userId: string; orgId: string } | null> {
    try {
      const { decode } = await import("next-auth/jwt");
      const { WS_TOKEN_SALT } = await import("./ws-token");
      const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "";
      // Primeiro o token curto emitido por /api/ws-token; depois o cookie de sessão (compatibilidade).
      for (const salt of [WS_TOKEN_SALT, "authjs.session-token"]) {
        try {
          const decoded = await decode({ token, secret, salt } as Parameters<typeof decode>[0]);
          if (decoded?.sub) {
            return {
              userId: decoded.sub as string,
              orgId: (decoded as Record<string, unknown>).orgId as string,
            };
          }
        } catch {
          // tenta o próximo salt
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  get clientCount() {
    return this.clients.size;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Uma instância por processo. O `server.ts` (carregado pelo tsx) e as rotas
 * (empacotadas pelo Next) importam cópias diferentes deste módulo; sem o
 * `globalThis`, as rotas transmitiam por um gerenciador sem clientes.
 */
const holder = globalThis as unknown as { __orbitmindWsManager?: WsManager };
export const wsManager: WsManager = holder.__orbitmindWsManager ?? (holder.__orbitmindWsManager = new WsManager());
