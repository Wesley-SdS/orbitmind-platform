"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, FileText, Footprints, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RunStep } from "./hooks/use-office-state";
import type { OfficeAgent, OfficePipelineInfo } from "@/lib/office/types";
import { STATUS_LABELS } from "@/lib/office/types";
import { roomName } from "@/lib/office/room-layout";
import { cn } from "@/lib/utils";

interface OfficeAgentPanelProps {
  agent: OfficeAgent;
  agents: OfficeAgent[];
  pipeline: OfficePipelineInfo;
  runSteps: RunStep[];
  squadId: string | null;
  following: boolean;
  onClose: () => void;
  onGoTo: () => void;
  onToggleFollow: () => void;
}

const STATUS_STYLE: Record<OfficeAgent["status"], string> = {
  idle: "bg-[#ebe8e1] text-[#66645d] dark:bg-white/10 dark:text-[#a5a29a]",
  working: "bg-[#e4edfb] text-[#1d4fa3] dark:bg-[#2f6fd6]/25 dark:text-[#9dc0ff]",
  done: "bg-[#e3f3ea] text-[#1f6b43] dark:bg-[#2e8b57]/25 dark:text-[#8fd6ac]",
  checkpoint: "bg-[#fff1eb] text-[#b53f14] dark:bg-[#f2541b]/25 dark:text-[#ffb08f]",
  delivering: "bg-[#efe9ff] text-[#5b3fc4] dark:bg-[#8b5cf6]/25 dark:text-[#c9b6ff]",
};

const STATUS_DOT: Record<OfficeAgent["status"], string> = {
  idle: "#8f8c84", working: "#2f6fd6", done: "#2e8b57", checkpoint: "#f2541b", delivering: "#8b5cf6",
};

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function toKebab(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-");
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function since(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  return `há ${Math.floor(m / 60)} h`;
}

/** Avatar em CSS com as cores do agente (mesma linguagem do canvas). */
export function AgentAvatar({ agent, size = 1 }: { agent: OfficeAgent; size?: number }) {
  return (
    <div className="relative" style={{ width: 22 * size, height: 30 * size }} aria-hidden="true">
      <div className="absolute rounded-t-[6px] rounded-b-[2px]" style={{ left: size, top: 0, width: 20 * size, height: 9 * size, background: hex(agent.hair), zIndex: 1 }} />
      <div className="absolute rounded-[5px]" style={{ left: 2 * size, top: 2 * size, width: 18 * size, height: 16 * size, background: hex(agent.skin) }} />
      <div className="absolute" style={{ left: 6 * size, top: 10 * size, width: 10 * size, height: 2 * size, zIndex: 2, background: `linear-gradient(90deg,#2a2521 0 ${2 * size}px,transparent ${2 * size}px ${8 * size}px,#2a2521 ${8 * size}px ${10 * size}px)` }} />
      <div className="absolute rounded-t-[5px] rounded-b-[3px]" style={{ left: 0, top: 17 * size, width: 22 * size, height: 11 * size, background: hex(agent.color) }} />
    </div>
  );
}

export function OfficeAgentPanel({ agent, agents, pipeline, runSteps, squadId, following, onClose, onGoTo, onToggleFollow }: OfficeAgentPanelProps) {
  const [openOutput, setOpenOutput] = useState<string | null>(null);

  const stepNames = useMemo(() => new Map<string, string>(pipeline.steps.map((s) => [`step-${s.step}`, s.name])), [pipeline.steps]);
  const resolveAgent = (agentId?: string): OfficeAgent | null => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId) ?? agents.find((a) => toKebab(a.name) === agentId) ?? null;
  };

  // fluxo: etapa anterior/próxima com agente no pipeline configurado
  const flow = useMemo(() => {
    const mine = pipeline.steps.findIndex((s) => resolveAgent(s.agentId)?.id === agent.id);
    if (mine < 0) return null;
    const prev = [...pipeline.steps.slice(0, mine)].reverse().map((s) => resolveAgent(s.agentId)).find((a) => a && a.id !== agent.id) ?? null;
    const next = pipeline.steps.slice(mine + 1).map((s) => resolveAgent(s.agentId)).find((a) => a && a.id !== agent.id) ?? null;
    return { prev, next };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline.steps, agents, agent.id]);

  const deliveries = useMemo(() => runSteps
    .filter((s) => s.agentId === agent.id && s.status !== "running")
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 3), [runSteps, agent.id]);

  const budgetTotal = agent.monthlyBudgetTokens ?? 0;
  const budgetUsed = agent.budgetUsedTokens ?? 0;
  const budgetPct = budgetTotal > 0 ? Math.min(100, Math.round((budgetUsed / budgetTotal) * 100)) : 0;
  const firstName = agent.name.split(" ")[0] ?? agent.name;
  const openStep = openOutput ? pipeline.stepOutputs[openOutput] : null;

  return (
    <aside className="flex h-full w-full flex-col bg-card text-card-foreground" aria-label={`Detalhes de ${agent.name}`}>
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-secondary">
          <AgentAvatar agent={agent} size={1.3} />
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card" style={{ background: STATUS_DOT[agent.status] }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight">{agent.name}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{agent.role} · {roomName(agent.roomId)}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose} aria-label="Fechar painel"><X className="h-4 w-4" /></Button>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold", STATUS_STYLE[agent.status])}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[agent.status] }} />
          {STATUS_LABELS[agent.status]}
        </span>
        {agent.modelTier && (
          <span className="inline-flex h-6 items-center rounded-full bg-secondary px-2.5 font-mono text-[11px] text-muted-foreground">
            {agent.modelTier === "fast" ? "modelo rápido" : "modelo potente"}
          </span>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3.5 px-4 pb-4">
          <section className="rounded-xl border p-3">
            <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Tarefa atual</span>
              {agent.currentStepStartedAt && <span className="normal-case tracking-normal font-medium">{since(agent.currentStepStartedAt)}</span>}
            </div>
            <div className="mt-1.5 text-[13px] leading-snug">
              {agent.status === "working" && agent.currentStep ? stepNames.get(agent.currentStep) ?? agent.currentStep
                : agent.status === "checkpoint" ? `Aguardando sua aprovação${pipeline.checkpointStepName ? `: ${pipeline.checkpointStepName}` : ""}`
                : agent.status === "delivering" ? "Levando a entrega para o próximo agente"
                : agent.status === "done" ? "Etapa concluída, aguardando o restante do pipeline"
                : "Sem tarefa em execução"}
            </div>
          </section>

          {flow && (flow.prev || flow.next) && (
            <section className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fluxo</div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-secondary px-2 py-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: flow.prev ? hex(flow.prev.color) : "#8f8c84" }} />
                  <span className="truncate">{flow.prev ? flow.prev.name.split(" ")[0] : "Início"}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-primary-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_DOT[agent.status] }} />
                  <span className="truncate">{firstName}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-secondary px-2 py-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: flow.next ? hex(flow.next.color) : "#8f8c84" }} />
                  <span className="truncate">{flow.next ? flow.next.name.split(" ")[0] : "Fim"}</span>
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {flow.prev ? `Recebe de ${flow.prev.name.split(" ")[0]}` : "Abre o pipeline"}{flow.next ? ` · entrega para ${flow.next.name.split(" ")[0]}` : " · fecha o pipeline"}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Orçamento do agente</span>
              <span className="font-mono normal-case tracking-normal font-medium">{fmtTokens(budgetUsed)}{budgetTotal > 0 ? ` / ${fmtTokens(budgetTotal)}` : ""}</span>
            </div>
            <Progress value={budgetPct} className={cn("h-1.5", budgetPct > 80 && "[&>div]:bg-destructive")} />
            <div className="text-[11px] text-muted-foreground">
              {budgetTotal > 0 ? `${budgetPct}% do orçamento mensal de tokens` : "Sem limite mensal definido"}
            </div>
          </section>

          <section className="flex flex-col gap-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Entregas recentes</div>
            {deliveries.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma entrega nesta execução.</div>}
            {deliveries.map((d) => {
              const hasOutput = d.pipelineStep ? Boolean(pipeline.stepOutputs[d.pipelineStep]) : false;
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={!hasOutput}
                  onClick={() => d.pipelineStep && setOpenOutput(d.pipelineStep)}
                  className={cn("flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2 text-left", hasOutput ? "hover:bg-accent" : "cursor-default")}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-xs">{d.pipelineStep ? stepNames.get(d.pipelineStep) ?? d.pipelineStep : "Etapa"}</span>
                  <span className={cn("text-[11px] font-semibold", d.status === "completed" ? "text-[#2e8b57]" : d.status === "failed" ? "text-destructive" : "text-muted-foreground")}>
                    {d.status === "completed" ? "Concluído" : d.status === "failed" ? "Falhou" : d.status}
                  </span>
                </button>
              );
            })}
          </section>
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-2 border-t p-4">
        <Button className="h-10" render={<Link href={squadId ? `/chat?squad=${squadId}` : "/chat"} />}>
          <MessageSquare className="h-4 w-4" /> Conversar com {firstName}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 flex-1" onClick={onGoTo}><Footprints className="h-4 w-4" /> Ir até {firstName}</Button>
          <Button variant={following ? "secondary" : "outline"} className="h-10 flex-1" onClick={onToggleFollow} aria-pressed={following}><Eye className="h-4 w-4" /> {following ? "Seguindo" : "Seguir"}</Button>
        </div>
      </div>

      <Dialog open={openOutput !== null} onOpenChange={(o) => { if (!o) setOpenOutput(null); }}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{openOutput ? stepNames.get(openOutput) ?? openOutput : ""}</DialogTitle>
            <DialogDescription>
              {openStep ? `${openStep.agentName} · ${new Date(openStep.completedAt).toLocaleString("pt-BR")}` : ""}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-3">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{openStep?.content ?? ""}</ReactMarkdown>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
