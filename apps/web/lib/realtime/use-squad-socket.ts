"use client";

import { useEffect, useRef, useState } from "react";

export interface SquadSocketMessage {
  type: string;
  [key: string]: unknown;
}

const MAX_BACKOFF_MS = 30_000;
const GIVE_UP_AFTER = 4; // depois disso tenta só de minuto em minuto
const PING_EVERY_MS = 25_000;

/**
 * Conecta ao WebSocket do servidor (`/api/ws`) com o token curto de
 * `/api/ws-token` e se inscreve nos eventos de um squad.
 *
 * Se o processo não tiver servidor WS (por exemplo `next dev` sem `server.ts`),
 * a conexão falha e o hook fica tentando com backoff, sem barulho: quem usa
 * deve manter um polling de segurança enquanto `connected` for falso.
 */
export function useSquadSocket(squadId: string | null, onMessage: (msg: SquadSocketMessage) => void): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!squadId || typeof window === "undefined") return;
    let alive = true;
    let ws: WebSocket | null = null;
    let attempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    /** Squad de outra organização: o servidor recusou; não adianta insistir. */
    let denied = false;

    const schedule = (): void => {
      if (!alive) return;
      attempts++;
      const delay = attempts > GIVE_UP_AFTER ? 60_000 : Math.min(MAX_BACKOFF_MS, 1500 * 2 ** (attempts - 1));
      reconnectTimer = setTimeout(connect, delay);
    };

    const connect = async (): Promise<void> => {
      if (!alive) return;
      let token: string | null = null;
      try {
        const res = await fetch("/api/ws-token", { cache: "no-store" });
        if (res.ok) token = ((await res.json()) as { token?: string }).token ?? null;
        else if (res.status === 401) return; // sem sessão: não insiste
      } catch {
        token = null;
      }
      if (!alive) return;
      if (!token) { schedule(); return; }

      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      try {
        ws = new WebSocket(`${proto}//${window.location.host}/api/ws?token=${encodeURIComponent(token)}`);
      } catch {
        schedule();
        return;
      }
      const socket = ws;
      socket.onopen = () => {
        if (!alive) { socket.close(); return; }
        attempts = 0;
        // a inscrição vai depois do CONNECTED (token validado); "conectado" só com o SUBSCRIBED
        pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "PING" }));
        }, PING_EVERY_MS);
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as SquadSocketMessage;
          if (!msg || typeof msg.type !== "string") return;
          if (msg.type === "CONNECTED") { socket.send(JSON.stringify({ type: "SUBSCRIBE_SQUAD", squadId })); return; }
          if (msg.type === "SUBSCRIBED") { if (msg.squadId === squadId) setConnected(true); return; }
          if (msg.type === "SUBSCRIBE_DENIED") { denied = true; socket.close(); return; }
          if (msg.type !== "PONG" && msg.type !== "CONNECTED") onMessageRef.current(msg);
        } catch {
          // mensagem inválida
        }
      };
      socket.onerror = () => { /* onclose cuida da reconexão */ };
      socket.onclose = () => {
        setConnected(false);
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
        if (alive && !denied) schedule();
      };
    };

    void connect();

    return () => {
      alive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingTimer) clearInterval(pingTimer);
      if (ws) {
        try {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "UNSUBSCRIBE_SQUAD", squadId }));
          ws.close();
        } catch { /* já fechado */ }
      }
      setConnected(false);
    };
  }, [squadId]);

  return { connected };
}
