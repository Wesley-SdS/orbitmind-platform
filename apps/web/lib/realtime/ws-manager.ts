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
    const decoded = await this.validateToken(token);
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
  }

  private handleMessage(clientId: string, msg: { type: string; squadId?: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (msg.type) {
      case "SUBSCRIBE_SQUAD":
        if (msg.squadId) client.subscribedSquads.add(msg.squadId);
        break;
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
      const secret = process.env.NEXTAUTH_SECRET!;
      const decoded = await decode({ token, secret, salt: "authjs.session-token" } as Parameters<typeof decode>[0]);
      if (!decoded?.sub) return null;
      return {
        userId: decoded.sub as string,
        orgId: (decoded as Record<string, unknown>).orgId as string,
      };
    } catch {
      return null;
    }
  }

  get clientCount() {
    return this.clients.size;
  }
}

export const wsManager = new WsManager();
