"use client";

import { useEffect, useMemo, useState } from "react";
import { Building, Columns3, Bot, GitBranch, HelpCircle, LayoutDashboard, Link as LinkIcon, MessageSquare, Settings, ShoppingBag, Users } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OfficeRail } from "@/components/office/office-rail";
import { VirtualOfficeView } from "@/components/office/virtual-office";
import type { OfficeState } from "@/components/office/hooks/use-office-state";
import { DESKS, deskSeat, getRoomForRole, lookForAgent } from "@/lib/office/room-layout";
import type { OfficeAgent, OfficeAgentStatus, OfficeEvent, OfficeHandoff, OfficePipelineInfo } from "@/lib/office/types";

// Estado idêntico ao das pranchas do design (01 visão geral, 02 checkpoint, 04 celular).
const ROWS: Array<{ id: string; name: string; role: string; status: OfficeAgentStatus; step?: string }> = [
  { id: "a1-ana", name: "Ana Insights", role: "Pesquisadora de mercado", status: "working", step: "step-1" },
  { id: "a2-samuel", name: "Samuel SEO", role: "Analista SEO", status: "done" },
  { id: "a3-carlos", name: "Carlos Copy", role: "Copywriter", status: "working", step: "step-3" },
  { id: "a4-diana", name: "Diana Design", role: "Designer", status: "working", step: "step-3" },
  { id: "a5-vera", name: "Vera Review", role: "Revisora de qualidade", status: "checkpoint" },
  { id: "a6-sofia", name: "Sofia Strategy", role: "Estrategista", status: "idle" },
  { id: "a7-paula", name: "Paula Post", role: "Publicadora", status: "idle" },
];

function buildAgents(): OfficeAgent[] {
  const used = new Set<number>();
  return ROWS.map((r) => {
    const room = r.id === "a4-diana" ? "creative" : getRoomForRole(r.role);
    const idx = DESKS.findIndex((d, i) => d.roomId === room && !used.has(i));
    used.add(idx);
    const seat = deskSeat(DESKS[idx]!, idx);
    const look = lookForAgent(r.role, r.id);
    const started = new Date(Date.now() - 4 * 60000).toISOString();
    return {
      id: r.id, name: r.name, role: r.role, icon: "", status: r.status, roomId: room, seat, look, color: look.shirt,
      modelTier: "powerful", model: "claude-sonnet-4-6", monthlyBudgetTokens: 300000, budgetUsedTokens: 128000,
      currentStep: r.step ?? null, currentStepStartedAt: r.step ? started : null,
      runCostCents: r.id === "a3-carlos" ? 38 : 12, avgStepMs: 6.5 * 60000,
    };
  });
}

const REVIEW = `Revisei o carrossel de setembro. Dois slides ficaram acima do limite de caracteres.

## Slides
Slide 1: Seu time de marketing pode trabalhar 24h?
Slide 2: 3 sinais de que sua agência precisa de squads
Slide 3: Squads de IA pesquisam, escrevem, desenham e publicam enquanto sua equipe foca na estratégia. Cada agente tem uma função clara e entrega para o próximo, com um checkpoint humano antes de publicar. Menos retrabalho.
Slide 4: Comece com um squad de conteúdo: pesquisa, estratégia, copy, design, revisão e publicação, com aprovação humana em cada entrega importante e relatórios semanais do que performou melhor nas redes.
Slide 5: Fale com a OrbitMind e monte o seu squad em uma semana.

## Critérios de qualidade
- [x] Tom de voz alinhado ao briefing (direto, sem jargão)
- [x] CTA no último slide com link do site
- [x] Palavras-chave do relatório de SEO presentes
- [ ] Limite de 180 caracteres por slide · falhou em 2 slides

## Sugestão
Devolver para Carlos cortar os slides 3 e 4. Estimativa: 2 min e 6k tokens.`;

const STEPS = [
  { step: 1, name: "Pesquisa de mercado", type: "agent", agentId: "a1-ana" },
  { step: 2, name: "Briefing", type: "agent", agentId: "a6-sofia" },
  { step: 3, name: "Criação de conteúdo", type: "agent", agentId: "a3-carlos" },
  { step: 4, name: "Revisão do carrossel de setembro", type: "checkpoint-approve" },
  { step: 5, name: "Design", type: "agent", agentId: "a4-diana" },
  { step: 6, name: "Revisão final", type: "agent", agentId: "a5-vera" },
  { step: 7, name: "Publicação", type: "agent", agentId: "a7-paula" },
];

function pipelineFor(view: string): OfficePipelineInfo {
  const checkpoint = view === "checkpoint";
  const now = Date.now();
  return {
    runId: "20260930120000", runNumber: 42,
    status: checkpoint ? "waiting_approval" : "running",
    currentStepIndex: checkpoint ? 3 : 2, totalSteps: 7,
    currentStepName: checkpoint ? "Revisão do carrossel de setembro" : "Criação de conteúdo",
    startedAt: new Date(now - 12 * 60000).toISOString(),
    pausedAt: new Date(now - 40000).toISOString(),
    checkpointStepId: checkpoint ? "step-4" : null,
    checkpointStepName: checkpoint ? "Revisão do carrossel de setembro" : null,
    checkpointType: checkpoint ? "checkpoint-approve" : null,
    checkpointAgentId: "a5-vera",
    nextStepName: "Publicação",
    stepOutputs: {
      "step-1": { agentName: "Ana Insights", agentIcon: "", content: "Pesquisa", completedAt: new Date(now - 9 * 60000).toISOString() },
      "step-2": { agentName: "Carlos Copy", agentIcon: "", content: "Legendas", completedAt: new Date(now - 5 * 60000).toISOString() },
      "step-3": { agentName: "Diana Design", agentIcon: "", content: REVIEW, completedAt: new Date(now - 60000).toISOString() },
    },
    sourceStepOutput: REVIEW,
    steps: STEPS,
  };
}

function eventsFor(): OfficeEvent[] {
  const now = Date.now();
  return [
    { id: "e1", kind: "checkpoint", actor: "Vera Review", text: "aguarda sua aprovação do carrossel", at: now - 40000, agentId: "a5-vera" },
    { id: "e2", kind: "handoff", actor: "Samuel SEO", text: "está levando o relatório de palavras-chave para", settledText: "entregou o relatório de palavras-chave para", target: "Diana Design", at: now - 2000, agentId: "a2-samuel" },
    { id: "e3", kind: "done", actor: "Ana Insights", text: "concluiu a pesquisa de mercado", at: now - 120000, agentId: "a1-ana" },
  ];
}

const RAIL_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Board", href: "/board", icon: Columns3 },
  { title: "Squads", href: "/squads", icon: Bot },
  { title: "Agentes", href: "/agents", icon: Users },
  { title: "Pipeline", href: "/pipeline", icon: GitBranch },
  { title: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { title: "Integrações", href: "/integrations", icon: LinkIcon },
  { title: "Configurações", href: "/settings", icon: Settings },
  { title: "Escritório", href: "/office-preview", icon: Building },
  { title: "Ajuda", href: "/help", icon: HelpCircle },
];

/** Página de QA visual: o componente real do escritório com o estado das pranchas. */
export function OfficePreviewClient({ view, rotation }: { view: string; rotation: number | null }) {
  const agents = useMemo(buildAgents, []);
  const pipeline = useMemo(() => pipelineFor(view), [view]);
  const events = useMemo(eventsFor, []);
  const [handoff, setHandoff] = useState<OfficeHandoff | null>(null);
  // horários relativos e o canvas só existem no navegador (como na página real, que usa ssr: false)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // ?rot=N: grava a orientação que o escritório lê ao abrir
    if (rotation !== null) { try { localStorage.setItem("orbitmind.office.rotation", String(rotation)); } catch { /* sem storage */ } }
    setMounted(true);
  }, [rotation]);

  // Samuel sai da mesa e leva o relatório até Diana, como na prancha 01
  useEffect(() => {
    if (view === "checkpoint") return;
    const t = setTimeout(() => setHandoff({ fromId: "a2-samuel", toId: "a4-diana", at: Date.now() }), 900);
    return () => clearTimeout(t);
  }, [view]);

  const state: OfficeState = {
    squads: [{ id: "s1", name: "Agência de Marketing", icon: null, agentCount: 7 }],
    squad: { id: "s1", name: "Agência de Marketing", icon: null, agentCount: 7 },
    squadId: "s1",
    setSquadId: () => {},
    agents,
    runSteps: [],
    pipeline,
    events,
    handoff,
    demoMode: false,
    realtime: true,
    loading: false,
    refresh: () => {},
  };

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#f3f1ec]">
        <OfficeRail items={RAIL_ITEMS} userName="Wesley" />
        <div className="min-w-0 flex-1">
          <VirtualOfficeView
            state={state}
            userName="Wesley"
            initialPanel={view === "checkpoint" ? { kind: "checkpoint" } : window.innerWidth < 768 ? null : { kind: "agent", id: "a3-carlos" }}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
