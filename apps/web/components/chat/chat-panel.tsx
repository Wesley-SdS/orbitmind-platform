"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ChatInput } from "./chat-input";
import type { ChatMessage } from "@orbitmind/shared";

interface Agent {
  id: string;
  name: string;
  icon: string;
  role: string;
}

interface ChatPanelProps {
  squadId: string;
  squadName: string;
  initialMessages: ChatMessage[];
  agents: Agent[];
  isArchitect?: boolean;
  conversationId?: string;
  onSquadCreated?: () => void;
  waitingResponse?: boolean;
}

export function ChatPanel({ squadId, squadName, initialMessages, agents, isArchitect, conversationId, onSquadCreated, waitingResponse }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [typingAgent, setTypingAgent] = useState<Agent | null>(
    waitingResponse && isArchitect ? { id: "system-architect", name: "Arquiteto", icon: "🧠", role: "Architect" } : null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sync when initialMessages change (squad switch)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, typingAgent]);

  const getAgent = useCallback(
    (agentId?: string) => {
      if (!agentId) return null;
      return agents.find((a) => a.id === agentId) ?? null;
    },
    [agents],
  );

  // For architect messages, resolve agent from metadata
  const resolveAgent = useCallback(
    (msg: ChatMessage) => {
      if (msg.agentId) return getAgent(msg.agentId);
      const meta = msg.metadata as Record<string, unknown> | null;
      if (meta?.isArchitect) {
        return {
          name: String(meta.agentName ?? "Arquiteto"),
          icon: String(meta.agentIcon ?? "🧠"),
          role: "Squad Architect",
        };
      }
      return null;
    },
    [getAgent],
  );

  async function handleSend(content: string) {
    // Optimistic: add user message immediately
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      squadId,
      senderId: "current-user",
      content,
      role: "user",
      metadata: {},
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    // Show typing indicator
    if (isArchitect) {
      setTypingAgent({ id: "system-architect", name: "Arquiteto", icon: "🧠", role: "Architect" });
    }

    // Send to appropriate API
    const endpoint = isArchitect ? "/api/chat/architect" : "/api/chat";
    const body = isArchitect
      ? { content, conversationId }
      : { squadId, content };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const saved = await res.json();
      if (saved.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? { ...saved, createdAt: saved.createdAt ?? tempMsg.createdAt } : m)),
        );
      }
    }

    // Poll for response
    if (isArchitect && conversationId) {
      const pollHistory = async () => {
        const histRes = await fetch(`/api/chat/architect/history?conversationId=${conversationId}`);
        if (histRes.ok) {
          const data = await histRes.json();
          if (Array.isArray(data)) {
            const parsed = (data as ChatMessage[]).map((m) => ({
              ...m,
              createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt as unknown as string).toISOString(),
            }));
            setMessages(parsed);
            if (parsed.some((m) => m.role === "agent" && m.content.includes("criado com sucesso"))) {
              onSquadCreated?.();
            }
          }
        }
        setTypingAgent(null);
      };
      setTimeout(pollHistory, 3000);
      setTimeout(pollHistory, 8000);
      setTimeout(pollHistory, 15000);
    } else if (!isArchitect) {
      // Squad chat — poll for agent response
      const firstAgent = agents[0];
      if (firstAgent) {
        setTypingAgent(firstAgent);
      }
      const pollSquadMessages = async () => {
        const res = await fetch(`/api/chat/${squadId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const parsed = (data as ChatMessage[]).map((m) => ({
              ...m,
              createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt as unknown as string).toISOString(),
            }));
            if (parsed.length > messages.length) {
              setMessages(parsed);
              setTypingAgent(null);
            }
          }
        }
      };
      setTimeout(pollSquadMessages, 3000);
      setTimeout(pollSquadMessages, 8000);
      setTimeout(pollSquadMessages, 15000);
      setTimeout(pollSquadMessages, 25000);
    }
  }

  async function handleNewConversation() {
    // Nova conversa is handled by the parent page now (startNewConversation)
    // This button just triggers a page-level reload via window location
    window.location.href = "/chat";
  }

  const subtitle = isArchitect
    ? "Criar e gerenciar squads"
    : `${agents.length} agentes`;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{squadName}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {isArchitect && messages.length > 0 && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleNewConversation}>
            <RotateCcw className="h-3.5 w-3.5" />
            Nova Conversa
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              agent={resolveAgent(msg)}
              onAction={handleSend}
            />
          ))}
          {typingAgent && (
            <TypingIndicator agentName={typingAgent.name} agentIcon={typingAgent.icon} />
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="shrink-0">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
