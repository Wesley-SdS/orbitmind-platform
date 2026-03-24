"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage } from "@orbitmind/shared";

interface UseSquadSocketOptions {
  squadId: string | null;
  onMessage?: (msg: ChatMessage) => void;
  onTaskUpdated?: (taskId: string, status: string) => void;
  onAgentTyping?: (agentName: string) => void;
}

interface UseSquadSocketReturn {
  isConnected: boolean;
  sendMessage: (content: string) => void;
}

export function useSquadSocket(options: UseSquadSocketOptions): UseSquadSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (!options.squadId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use session cookie for auth - pass a placeholder token
    const wsUrl = `${protocol}//${window.location.host}/api/ws?token=session`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      ws.send(JSON.stringify({ type: "SUBSCRIBE_SQUAD", squadId: options.squadId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "CHAT_MESSAGE":
            optionsRef.current.onMessage?.(msg.message);
            break;
          case "AGENT_TYPING":
            optionsRef.current.onAgentTyping?.(msg.agentName);
            break;
          case "TASK_UPDATED":
            optionsRef.current.onTaskUpdated?.(msg.taskId, msg.status);
            break;
        }
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [options.squadId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (content: string) => {
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squadId: options.squadId, content }),
      });
    },
    [options.squadId],
  );

  return { isConnected, sendMessage };
}
