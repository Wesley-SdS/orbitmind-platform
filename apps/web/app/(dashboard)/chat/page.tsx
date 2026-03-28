"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Sparkles, ClipboardList, Bot, BarChart3, MessageSquare, Trash2 } from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatInput } from "@/components/chat/chat-input";
import type { ChatMessage } from "@orbitmind/shared";

const ARCHITECT_ID = "00000000-0000-0000-0000-a0c41ec70001";

interface Squad {
  id: string;
  name: string;
  icon: string | null;
  status: string;
  agentCount: number;
}

interface Agent {
  id: string;
  name: string;
  icon: string;
  role: string;
}

interface Conversation {
  conversationId: string;
  title: string | null;
  lastMessageAt: string;
  messageCount: number;
}

const SUGGESTIONS = [
  { text: "Criar um novo squad de agentes", icon: Sparkles },
  { text: "Ver meus squads", icon: ClipboardList },
  { text: "Como estão meus agentes?", icon: Bot },
  { text: "Resumo do meu dashboard", icon: BarChart3 },
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitingResponse, setWaitingResponse] = useState(false);
  const skipNextLoad = useRef(false);

  const isArchitectConversation = !!currentConversationId;
  const isSquadChat = !!selectedSquadId && !currentConversationId;
  const isEmptyState = !selectedSquadId && !currentConversationId;

  // Auto-select architect if URL param
  useEffect(() => {
    const squad = searchParams.get("squad");
    if (squad === "system-architect" || squad === ARCHITECT_ID) {
      startNewConversation();
    }
  }, [searchParams]);

  const loadSquads = useCallback(() => {
    return fetch("/api/squads").then((r) => r.json()).then((data) => setSquads(data));
  }, []);

  const loadConversations = useCallback(() => {
    return fetch("/api/chat/architect/history?list=true")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setConversations(data); });
  }, []);

  useEffect(() => {
    Promise.all([loadSquads(), loadConversations()]).finally(() => setLoading(false));
  }, [loadSquads, loadConversations]);

  // Load messages when selecting a conversation or squad
  useEffect(() => {
    if (skipNextLoad.current) { skipNextLoad.current = false; return; }

    if (currentConversationId) {
      setAgents([{ id: "system-architect", name: "Arquiteto", icon: "🧠", role: "Squad Architect" }]);
      fetch(`/api/chat/architect/history?conversationId=${currentConversationId}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setMessages(parseMessages(data)); });
      setSelectedSquadId(null);
    } else if (selectedSquadId) {
      Promise.all([
        fetch(`/api/squads/${selectedSquadId}/agents`)
          .then((r) => r.json())
          .then((data) => setAgents(data.map((a: Agent) => ({ id: a.id, name: a.name, icon: a.icon ?? "🤖", role: a.role })))),
        fetch(`/api/chat/${selectedSquadId}`)
          .then((r) => r.json())
          .then((data) => setMessages(parseMessages(data))),
      ]);
    } else {
      setMessages([]);
      setAgents([]);
    }
  }, [currentConversationId, selectedSquadId]);

  function startNewConversation() {
    setCurrentConversationId(null);
    setSelectedSquadId(null);
    setMessages([]);
    setAgents([]);
  }

  function selectConversation(convId: string) {
    setCurrentConversationId(convId);
    setSelectedSquadId(null);
  }

  function selectSquad(squadId: string) {
    setSelectedSquadId(squadId);
    setCurrentConversationId(null);
  }

  async function handleFreeSend(content: string) {
    const convId = currentConversationId || crypto.randomUUID();
    if (!currentConversationId) {
      setCurrentConversationId(convId);
      setSelectedSquadId(null);
      setAgents([{ id: "system-architect", name: "Arquiteto", icon: "🧠", role: "Squad Architect" }]);
      setWaitingResponse(true);
      skipNextLoad.current = true;
    }

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      squadId: ARCHITECT_ID,
      senderId: "current-user",
      content,
      role: "user",
      metadata: { conversationId: convId },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    await fetch("/api/chat/architect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, conversationId: convId }),
    });

    const pollHistory = async () => {
      const histRes = await fetch(`/api/chat/architect/history?conversationId=${convId}`);
      if (histRes.ok) {
        const data = await histRes.json();
        if (Array.isArray(data)) {
          setMessages(parseMessages(data));
          if (data.some((m: ChatMessage) => m.role !== "user")) {
            setWaitingResponse(false);
          }
        }
      }
      loadConversations();
    };
    const polls = [2000, 4000, 6000, 8000, 10000, 13000, 16000, 20000, 25000, 30000, 40000, 50000, 60000];
    polls.forEach(ms => setTimeout(pollHistory, ms));
  }

  async function handleDeleteConversation(convId: string) {
    await fetch("/api/chat/architect", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId }),
    });
    if (currentConversationId === convId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
    loadConversations();
  }

  const selectedName = isArchitectConversation
    ? "Arquiteto"
    : squads.find((s) => s.id === selectedSquadId)?.name ?? "";

  if (loading) return <PageLoader text="Carregando chat..." />;

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-border/50 bg-muted/30 flex flex-col">
        <div className="shrink-0 border-b border-border/50 p-2">
          <Button variant="outline" className="w-full justify-start gap-2 text-sm" onClick={startNewConversation}>
            <Plus className="h-4 w-4" />
            Nova Conversa
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Squads */}
            {squads.length > 0 && (
              <div className="px-3 py-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Squads</p>
              </div>
            )}
            {squads.filter((s) => s.status === "active").map((squad) => (
              <button
                key={squad.id}
                onClick={() => selectSquad(squad.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selectedSquadId === squad.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                <span className="text-xl">{squad.icon}</span>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{squad.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{squad.agentCount} agentes</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </button>
            ))}

            {/* Conversations */}
            {conversations.length > 0 && (
              <div className="px-3 py-1.5 mt-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Conversas</p>
              </div>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.conversationId}
                className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                  currentConversationId === conv.conversationId ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                <button
                  className="flex flex-1 items-center gap-2 min-w-0"
                  onClick={() => selectConversation(conv.conversationId)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium">{conv.title || "Conversa"}</p>
                    <p className="text-[10px] text-muted-foreground">{conv.messageCount} msgs</p>
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteConversation(conv.conversationId)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Panel */}
      <div id="tour-chat-panel" className="flex-1 flex flex-col overflow-hidden">
        {isArchitectConversation ? (
          <ChatPanel
            key={currentConversationId}
            squadId={ARCHITECT_ID}
            squadName="Arquiteto"
            initialMessages={messages}
            agents={agents}
            isArchitect
            conversationId={currentConversationId!}
            onSquadCreated={() => { loadSquads(); loadConversations(); }}
            waitingResponse={waitingResponse}
          />
        ) : isSquadChat ? (
          <ChatPanel
            key={selectedSquadId}
            squadId={selectedSquadId!}
            squadName={selectedName}
            initialMessages={messages}
            agents={agents}
            onSquadCreated={loadSquads}
          />
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col">
            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <span className="text-3xl">🧠</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">OrbitMind Assistant</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Pergunte qualquer coisa — criar squads, editar agentes, ver status, consultar métricas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleFreeSend(s.text)}
                    className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2.5 text-left text-sm hover:bg-accent/50 transition-colors"
                  >
                    <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <ChatInput onSend={handleFreeSend} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseMessages(data: unknown[]): ChatMessage[] {
  return (data as ChatMessage[]).map((m) => ({
    ...m,
    createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt as unknown as string).toISOString(),
  }));
}
