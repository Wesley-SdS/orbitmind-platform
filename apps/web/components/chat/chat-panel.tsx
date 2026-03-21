"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
}

const SIMULATED_RESPONSES = [
  { agentIdx: 0, content: "Entendido! Vou analisar isso e trazer os dados relevantes." },
  { agentIdx: 1, content: "Com base na analise, sugiro focarmos em 3 pontos-chave para maximizar o impacto." },
  { agentIdx: 2, content: "Ja estou trabalhando no conteudo. Foco em storytelling e dados concretos!" },
  { agentIdx: 5, content: "Revisao feita! Tudo aprovado com pequenos ajustes sugeridos." },
];

export function ChatPanel({ squadId, squadName, initialMessages, agents }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [typingAgent, setTypingAgent] = useState<Agent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const responseIdx = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingAgent]);

  const getAgent = useCallback(
    (agentId?: string) => agents.find((a) => a.id === agentId) ?? null,
    [agents],
  );

  function handleSend(content: string) {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      squadId,
      senderId: "current-user",
      content,
      role: "user",
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    const sim = SIMULATED_RESPONSES[responseIdx.current % SIMULATED_RESPONSES.length]!;
    const respondingAgent = agents[sim.agentIdx] ?? agents[0];
    responseIdx.current++;

    if (respondingAgent) {
      setTimeout(() => {
        setTypingAgent(respondingAgent);
      }, 500);

      setTimeout(() => {
        setTypingAgent(null);
        const agentMsg: ChatMessage = {
          id: `msg-${Date.now()}-agent`,
          squadId,
          agentId: respondingAgent.id,
          content: sim.content,
          role: "agent",
          metadata: {},
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      }, 2000 + Math.random() * 1500);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/50 px-4 py-3">
        <h2 className="text-sm font-semibold">{squadName}</h2>
        <p className="text-xs text-muted-foreground">{agents.length} agentes</p>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              agent={msg.agentId ? getAgent(msg.agentId) : null}
            />
          ))}
          {typingAgent && (
            <TypingIndicator agentName={typingAgent.name} agentIcon={typingAgent.icon} />
          )}
        </div>
      </ScrollArea>
      <ChatInput onSend={handleSend} />
    </div>
  );
}
