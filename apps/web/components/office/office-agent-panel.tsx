"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, MessageSquare, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OfficeAvatar } from "./office-avatar";
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
  onClose: () => void;
  onGoTo: () => void;
}

export const STATUS_CHIP: Record<OfficeAgent["status"], string> = {
  idle: "bg-[#ebe8e1] text-[#66645d] dark:bg-white/10 dark:text-[#a5a29a]",
  working: "bg-[#e4edfb] text-[#1d4fa3] dark:bg-[#2f6fd6]/25 dark:text-[#9dc0ff]",
  done: "bg-[#e3f3ea] text-[#1f6b43] dark:bg-[#2e8b57]/25 dark:text-[#8fd6ac]",
  checkpoint: "bg-[#fff1eb] text-[#b53f14] dark:bg-[#f2541b]/25 dark:text-[#ffb08f]",
  delivering: "bg-[#efe9ff] text-[#5b3fc4] dark:bg-[#8b5cf6]/25 dark:text-[#c9b6ff]",
};

export const STATUS_DOT: Record<OfficeAgent["status"], string> = {
  idle: "#8f8c84", working: "#2f6fd6", done: "#2e8b57", checkpoint: "#f2541b", delivering: "#8b5cf6",
};

const LABEL = "text-[11px] font-semibold uppercase tracking-[.04em] text-[#66645d]";
const PANEL_BTN = "flex h-10 items-center justify-center gap-2 rounded-[10px] border border-transparent text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function toKebab(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-");
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

/** Centavos de US$ → "US$ 3,80". */
export function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "USD" }).replace("US$", "US$ ").replace(/\s+/g, " ");
}

function since(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  return `há ${Math.floor(m / 60)} h`;
}

const DEFAULT_STEP_MS = 150_000;

/** Progresso estimado da etapa: tempo decorrido sobre a duração média do agente (teto de 95%). */
function estimateProgress(agent: OfficeAgent, now: number): number | null {
  if (agent.status !== "working" || !agent.currentStepStartedAt) return null;
  const elapsed = now - new Date(agent.currentStepStartedAt).getTime();
  if (elapsed < 0) return null;
  const expected = agent.avgStepMs && agent.avgStepMs > 5000 ? agent.avgStepMs : DEFAULT_STEP_MS;
  return Math.min(95, Math.max(3, Math.round((elapsed / expected) * 100)));
}

export function useNow(everyMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}

export function OfficeAgentPanel({ agent, agents, pipeline, runSteps, squadId, onClose, onGoTo }: OfficeAgentPanelProps) {
  const [openOutput, setOpenOutput] = useState<string | null>(null);
  const now = useNow(5000);

  const stepNames = useMemo(() => new Map<string, string>(pipeline.steps.map((s) => [`step-${s.step}`, s.name])), [pipeline.steps]);
  const resolveAgent = (agentId?: string): OfficeAgent | null => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId) ?? agents.find((a) => toKebab(a.name) === agentId) ?? null;
  };

  // fluxo: quem entrega para este agente e para quem ele entrega, no pipeline configurado
  const flow = useMemo(() => {
    const mine = pipeline.steps.findIndex((s) => resolveAgent(s.agentId)?.id === agent.id);
    if (mine < 0) return null;
    const prevStep = [...pipeline.steps.slice(0, mine)].reverse().find((s) => { const a = resolveAgent(s.agentId); return a && a.id !== agent.id; });
    const nextStep = pipeline.steps.slice(mine + 1).find((s) => { const a = resolveAgent(s.agentId); return a && a.id !== agent.id; });
    return {
      prev: prevStep ? resolveAgent(prevStep.agentId) : null,
      prevStepName: prevStep?.name ?? null,
      next: nextStep ? resolveAgent(nextStep.agentId) : null,
      nextStepName: nextStep?.name ?? null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline.steps, agents, agent.id]);

  const deliveries = useMemo(() => runSteps
    .filter((s) => s.agentId === agent.id && s.status !== "running")
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 3), [runSteps, agent.id]);
  const latestWithOutput = deliveries.find((d) => d.pipelineStep && pipeline.stepOutputs[d.pipelineStep]);

  const budgetTotal = agent.monthlyBudgetTokens ?? 0;
  const budgetUsed = agent.budgetUsedTokens ?? 0;
  const budgetPct = budgetTotal > 0 ? Math.min(100, Math.round((budgetUsed / budgetTotal) * 100)) : 0;
  const firstName = agent.name.split(" ")[0] ?? agent.name;
  const openStep = openOutput ? pipeline.stepOutputs[openOutput] : null;
  const progress = estimateProgress(agent, now);
  const stepName = agent.currentStep ? stepNames.get(agent.currentStep) ?? agent.currentStep : null;
  const taskText =
    agent.status === "working" && stepName ? stepName
      : agent.status === "checkpoint" ? `Aguardando sua aprovação${pipeline.checkpointStepName ? `: ${pipeline.checkpointStepName}` : ""}`
      : agent.status === "delivering" ? "Levando a entrega para o próximo agente"
      : agent.status === "done" ? "Etapa concluída, aguardando o restante do pipeline"
      : "Sem tarefa em execução";

  const flowChip = (a: OfficeAgent | null, fallback: string) => (
    <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-[#ebe8e1] px-2 py-[5px] dark:bg-white/10">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: a ? `#${a.color.toString(16).padStart(6, "0")}` : "#8f8c84" }} />
      <span className="truncate">{a ? a.name.split(" ")[0] : fallback}</span>
    </span>
  );

  return (
    <aside className="flex h-full w-full flex-col bg-[#fbfaf7] text-[#1a1a17] dark:bg-[#1e1d1a] dark:text-[#f4f2ec]" aria-label={`Detalhes de ${agent.name}`}>
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#ece9e2] dark:bg-white/10">
          <div style={{ transform: "scale(1.3)", transformOrigin: "50% 40%" }}><OfficeAvatar look={agent.look} /></div>
          <span className="absolute -bottom-[3px] -right-[3px] h-3.5 w-3.5 rounded-full border-2 border-[#fbfaf7] dark:border-[#1e1d1a]" style={{ background: STATUS_DOT[agent.status] }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold leading-tight">{agent.name}</div>
          <div className="mt-0.5 truncate text-xs text-[#66645d]">{agent.role} · {roomName(agent.roomId)}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar painel" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#66645d] hover:bg-[#1a1a17]/6">
          <X className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold", STATUS_CHIP[agent.status])}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[agent.status] }} />
          {STATUS_LABELS[agent.status]}
        </span>
        {agent.model && (
          <span className="inline-flex h-6 items-center rounded-full bg-[#ebe8e1] px-2.5 font-om-mono text-xs font-medium text-[#66645d] dark:bg-white/10 dark:text-[#a5a29a]">{agent.model}</span>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3.5 px-4 pb-4">
          <section className="flex flex-col gap-2 rounded-xl border border-[#1a1a17]/10 p-3 dark:border-white/10">
            <div className={cn(LABEL, "flex justify-between")}>
              <span>Tarefa atual</span>
              {agent.currentStepStartedAt && agent.status === "working" && <span className="font-medium normal-case tracking-normal">{since(agent.currentStepStartedAt)}</span>}
            </div>
            <div className="text-[13px] leading-[1.4]">{taskText}</div>
            {progress !== null && (
              <div className="flex items-center gap-2" title="Estimativa pela duração média das etapas deste agente">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ebe8e1] dark:bg-white/10">
                  <i className="block h-full rounded-full bg-[#2f6fd6] transition-[width] duration-700" style={{ width: `${progress}%` }} />
                </div>
                <span className="font-om-mono text-[11px] text-[#66645d]">{progress}%</span>
              </div>
            )}
          </section>

          {flow && (flow.prev || flow.next) && (
            <section className="flex flex-col gap-2">
              <div className={LABEL}>Fluxo</div>
              <div className="flex items-center gap-1.5 text-xs">
                {flowChip(flow.prev, "Início")}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#8f8c84]" strokeWidth={2} />
                <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-[#1a1a17] px-2 py-[5px] text-[#f4f2ec] dark:bg-[#f4f2ec] dark:text-[#1a1a17]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_DOT[agent.status] }} />
                  <span className="truncate">{firstName}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#8f8c84]" strokeWidth={2} />
                {flowChip(flow.next, "Fim")}
              </div>
              <div className="text-[11px] text-[#66645d]">
                {flow.prev ? `Recebe ${flow.prevStepName ? `“${flow.prevStepName}” ` : ""}de ${flow.prev.name.split(" ")[0]}` : "Abre o pipeline"}
                {flow.next ? ` · entrega para ${flow.next.name.split(" ")[0]}${flow.nextStepName ? ` (${flow.nextStepName})` : ""}` : " · fecha o pipeline"}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <div className={cn(LABEL, "flex justify-between")}>
              <span>Orçamento do agente</span>
              <span className="font-om-mono font-medium normal-case tracking-normal">{fmtTokens(budgetUsed)}{budgetTotal > 0 ? ` / ${fmtTokens(budgetTotal)}` : ""}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#ebe8e1] dark:bg-white/10">
              <i className={cn("block h-full rounded-full", budgetPct > 85 ? "bg-destructive" : "bg-[#1a1a17] dark:bg-[#f4f2ec]")} style={{ width: `${budgetPct}%` }} />
            </div>
            <div className="text-[11px] text-[#66645d]">
              {agent.runCostCents ? `${fmtUsd(agent.runCostCents)} nesta execução · ` : ""}
              {budgetTotal > 0 ? `${budgetPct}% do mês` : "sem limite mensal"}
            </div>
          </section>

          <section className="flex flex-col gap-1.5">
            <div className={LABEL}>Entregas recentes</div>
            {deliveries.length === 0 && <div className="text-xs text-[#66645d]">Nenhuma entrega nesta execução.</div>}
            {deliveries.map((d) => {
              const hasOutput = d.pipelineStep ? Boolean(pipeline.stepOutputs[d.pipelineStep]) : false;
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={!hasOutput}
                  onClick={() => d.pipelineStep && setOpenOutput(d.pipelineStep)}
                  className={cn("flex items-center gap-2.5 rounded-[10px] border border-[#1a1a17]/10 px-2.5 py-2 text-left dark:border-white/10", hasOutput ? "hover:bg-[#1a1a17]/4" : "cursor-default")}
                >
                  <FileText className="h-4 w-4 shrink-0 text-[#66645d]" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate text-xs">{d.pipelineStep ? stepNames.get(d.pipelineStep) ?? d.pipelineStep : "Etapa"}</span>
                  <span className={cn("text-[11px]", d.status === "completed" ? "font-semibold text-[#2e8b57]" : d.status === "failed" ? "font-semibold text-destructive" : "font-medium text-[#66645d]")}>
                    {d.status === "completed" ? "Concluído" : d.status === "failed" ? "Falhou" : d.status}
                  </span>
                </button>
              );
            })}
          </section>
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-2 border-t border-[#1a1a17]/8 px-4 pb-4 pt-3 dark:border-white/10">
        <Link href={squadId ? `/chat?squad=${squadId}` : "/chat"} className={cn(PANEL_BTN, "bg-[#1a1a17] text-[#f7f5f0] hover:bg-[#2a2825] dark:bg-[#f4f2ec] dark:text-[#1a1a17]")}>
          <MessageSquare className="h-4 w-4" strokeWidth={1.75} /> Conversar com {firstName}
        </Link>
        <div className="flex gap-2">
          <button type="button" onClick={onGoTo} className={cn(PANEL_BTN, "flex-1 border-[#1a1a17]/18 hover:bg-[#1a1a17]/4 dark:border-white/15")}>Ir até {firstName}</button>
          <button
            type="button"
            disabled={!latestWithOutput}
            onClick={() => latestWithOutput?.pipelineStep && setOpenOutput(latestWithOutput.pipelineStep)}
            className={cn(PANEL_BTN, "flex-1 border-[#1a1a17]/18 hover:bg-[#1a1a17]/4 dark:border-white/15")}
            title={latestWithOutput ? undefined : "Este agente ainda não entregou nesta execução"}
          >
            Ver entrega
          </button>
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
