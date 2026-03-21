"use client";

import { useState } from "react";
import { MessageSquare, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatPanel } from "@/components/chat/chat-panel";
import { MOCK_SQUADS, MOCK_AGENTS, MOCK_MESSAGES } from "@/lib/mock-data";

export default function ChatPage() {
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);

  const selectedSquad = MOCK_SQUADS.find((s) => s.id === selectedSquadId);
  const agents = selectedSquadId
    ? MOCK_AGENTS.filter((a) => a.squadId === selectedSquadId).map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        role: a.role,
      }))
    : [];
  const messages = selectedSquadId
    ? MOCK_MESSAGES.filter((m) => m.squadId === selectedSquadId)
    : [];

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)]">
      <div className="w-72 shrink-0 border-r border-border/50 bg-muted/30">
        <div className="border-b border-border/50 px-4 py-3">
          <h2 className="text-sm font-semibold">Conversas</h2>
        </div>
        <ScrollArea className="h-[calc(100%-49px)]">
          <div className="p-2 space-y-1">
            {MOCK_SQUADS.filter((s) => s.status === "active").map((squad) => (
              <button
                key={squad.id}
                onClick={() => setSelectedSquadId(squad.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selectedSquadId === squad.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <span className="text-xl">{squad.icon}</span>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{squad.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {squad.agentCount} agentes
                  </p>
                </div>
                {squad.status === "active" && (
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1">
        {selectedSquad ? (
          <ChatPanel
            squadId={selectedSquad.id}
            squadName={selectedSquad.name}
            initialMessages={messages}
            agents={agents}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Selecione um squad</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Escolha um squad na lista ao lado para comecar a conversar com seus agentes de IA.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
