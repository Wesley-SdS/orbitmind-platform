"use client";

import { ChevronDown, Rocket, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SquadSummary } from "./hooks/use-office-state";
import type { OfficeAgent, OfficePipelineInfo } from "@/lib/office/types";
import { cn } from "@/lib/utils";

interface OfficeHudProps {
  squads: SquadSummary[];
  squadId: string | null;
  onSquadChange: (id: string) => void;
  agents: OfficeAgent[];
  pipeline: OfficePipelineInfo;
  demoMode: boolean;
  compact?: boolean;
}

function elapsedLabel(startedAt: string | null): string | null {
  if (!startedAt) return null;
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms < 0) return null;
  const min = Math.floor(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}

const glass = "rounded-xl border border-[#1a1a17]/12 bg-[#fbfaf7]/85 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_10px_28px_rgba(26,26,23,.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1e1d1a]/85 dark:shadow-[0_10px_28px_rgba(0,0,0,.4)]";
const chip = "flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#1a1a17]/12 bg-[#fbfaf7]/85 px-2.5 text-xs font-medium text-foreground shadow-[0_4px_12px_rgba(26,26,23,.08)] backdrop-blur-md dark:border-white/10 dark:bg-[#1e1d1a]/85";

export function OfficeHud({ squads, squadId, onSquadChange, agents, pipeline, demoMode, compact }: OfficeHudProps) {
  const squad = squads.find((s) => s.id === squadId) ?? null;
  const working = agents.filter((a) => a.status === "working").length;
  const checkpoint = agents.filter((a) => a.status === "checkpoint").length;
  const delivering = agents.filter((a) => a.status === "delivering").length;

  const total = Math.max(pipeline.totalSteps, 1);
  const segments = Math.min(total, 12);
  const active = pipeline.status === "running" || pipeline.status === "waiting_approval";
  const elapsed = active ? elapsedLabel(pipeline.startedAt) : null;

  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-3">
      <div className="pointer-events-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className={cn(glass, "flex h-10 items-center gap-2 pl-2.5 pr-3 text-[13px] font-semibold text-foreground")} aria-label="Escolher squad">
                <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#f2541b] text-sm leading-none text-[#1a1a17]">
                  {squad?.icon ? <span aria-hidden="true">{squad.icon}</span> : <Rocket className="h-3.5 w-3.5" />}
                </span>
                <span className="max-w-[220px] truncate">{squad?.name ?? "Escolha um squad"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-64">
            {squads.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => onSquadChange(s.id)} className={cn(s.id === squadId && "bg-accent")}>
                <span className="mr-2 w-5 text-center" aria-hidden="true">{s.icon ?? "•"}</span>
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.agentCount}</span>
              </DropdownMenuItem>
            ))}
            {squads.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum squad ainda</div>}
          </DropdownMenuContent>
        </DropdownMenu>
        {!compact && (
          <span className={chip}>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {agents.length} {agents.length === 1 ? "agente" : "agentes"}
          </span>
        )}
      </div>

      {!compact && (
        <div className={cn(glass, "w-[340px] shrink-0 px-3.5 py-2.5")}>
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              {pipeline.runId && <span className="font-mono text-[10px] uppercase text-muted-foreground">exec {pipeline.runId.replace(/[^a-z0-9]/gi, "").slice(-6)}</span>}
              <span className="truncate text-[13px] font-semibold">
                {active && pipeline.currentStepName ? pipeline.currentStepName : pipeline.status === "completed" ? "Pipeline concluído" : pipeline.status === "failed" ? "Pipeline falhou" : pipeline.status === "cancelled" ? "Pipeline cancelado" : demoMode ? "Sem execução ativa" : "Pronto para executar"}
              </span>
            </div>
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              {active ? `Etapa ${Math.min(pipeline.currentStepIndex + 1, total)} de ${total}${elapsed ? ` · ${elapsed}` : ""}` : `${total} etapas`}
            </span>
          </div>
          <div className="mt-2 flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={pipeline.currentStepIndex} aria-label="Progresso do pipeline">
            {Array.from({ length: segments }, (_, i) => {
              const idx = Math.round((i / segments) * total);
              let color = "bg-[#ddd8cd] dark:bg-white/15";
              if (pipeline.status === "completed") color = "bg-[#2e8b57]";
              else if (pipeline.status === "failed" && idx <= pipeline.currentStepIndex) color = "bg-destructive";
              else if (active && idx < pipeline.currentStepIndex) color = "bg-[#1a1a17] dark:bg-[#f4f2ec]";
              else if (active && idx === pipeline.currentStepIndex) color = pipeline.status === "waiting_approval" ? "bg-[#f2541b] shadow-[0_0_0_2px_rgba(242,84,27,.25)]" : "bg-[#2f6fd6] shadow-[0_0_0_2px_rgba(47,111,214,.25)]";
              return <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", color)} />;
            })}
          </div>
        </div>
      )}

      <div className="pointer-events-auto flex items-center gap-2">
        {demoMode && <span className={cn(chip, "text-muted-foreground")}>Demonstração</span>}
        {working > 0 && <span className={chip}><span className="h-1.5 w-1.5 rounded-full bg-[#2f6fd6]" />{working} trabalhando</span>}
        {checkpoint > 0 && <span className={cn(chip, "border-[#f2541b] text-[#b53f14] dark:text-[#ff8a5b]")}><span className="h-1.5 w-1.5 rounded-full bg-[#f2541b]" />{checkpoint} checkpoint</span>}
        {delivering > 0 && <span className={chip}><span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />{delivering} entregando</span>}
      </div>
    </div>
  );
}
