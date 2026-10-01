"use client";

import { ArrowLeft, ChevronDown, Rocket, Users, ZoomIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SquadSummary } from "./hooks/use-office-state";
import type { OfficeAgent, OfficePipelineInfo } from "@/lib/office/types";
import { cn } from "@/lib/utils";

export const HUD_GLASS = "rounded-xl border border-[#1a1a17]/12 bg-[#fbfaf7]/86 shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_10px_28px_rgba(26,26,23,.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1e1d1a]/86 dark:shadow-[0_10px_28px_rgba(0,0,0,.4)]";
export const HUD_CHIP = "flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#1a1a17]/12 bg-[#fbfaf7]/86 px-2.5 text-xs font-medium text-[#1a1a17] shadow-[0_4px_12px_rgba(26,26,23,.08)] backdrop-blur-md dark:border-white/10 dark:bg-[#1e1d1a]/86 dark:text-[#f4f2ec]";
export const HUD_CHIP_HOT = "border-[#f2541b] text-[#b53f14] dark:border-[#f2541b] dark:text-[#ff8a5b]";

export function elapsedLabel(startedAt: string | null): string | null {
  if (!startedAt) return null;
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms < 0) return null;
  const min = Math.floor(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}

/** Segmentos do progresso: feito em grafite, atual em laranja, futuro em cinza (kit visual). */
export function PipelineSegments({ pipeline, height = 6, gap = 4 }: { pipeline: OfficePipelineInfo; height?: number; gap?: number }) {
  const total = Math.max(pipeline.totalSteps, 1);
  const segments = Math.min(total, 12);
  const active = pipeline.status === "running" || pipeline.status === "waiting_approval";
  return (
    <div className="flex" style={{ gap }} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={pipeline.currentStepIndex} aria-label="Progresso do pipeline">
      {Array.from({ length: segments }, (_, i) => {
        const idx = Math.floor((i / segments) * total);
        let color = "bg-[#ddd8cd] dark:bg-white/15";
        let ring = "";
        if (pipeline.status === "completed") color = "bg-[#1a1a17] dark:bg-[#f4f2ec]";
        else if (pipeline.status === "failed" && idx <= pipeline.currentStepIndex) color = "bg-destructive";
        else if (active && idx < pipeline.currentStepIndex) color = "bg-[#1a1a17] dark:bg-[#f4f2ec]";
        else if (active && idx === pipeline.currentStepIndex) { color = "bg-[#f2541b]"; ring = "shadow-[0_0_0_2px_rgba(242,84,27,.25)]"; }
        return <span key={i} className={cn("flex-1 rounded-full transition-colors", color, ring)} style={{ height }} />;
      })}
    </div>
  );
}

function stepLabel(pipeline: OfficePipelineInfo): string {
  const total = Math.max(pipeline.totalSteps, 1);
  return `Etapa ${Math.min(pipeline.currentStepIndex + 1, total)} de ${total}`;
}

/** Título do bloco de progresso conforme o estado da execução. */
export function pipelineTitle(pipeline: OfficePipelineInfo, demoMode: boolean): string {
  const active = pipeline.status === "running" || pipeline.status === "waiting_approval";
  if (active && pipeline.currentStepName) return pipeline.currentStepName;
  if (pipeline.status === "completed") return "Pipeline concluído";
  if (pipeline.status === "failed") return "Pipeline falhou";
  if (pipeline.status === "cancelled") return "Pipeline cancelado";
  return demoMode ? "Sem execução ativa" : "Pronto para executar";
}

export function pipelineStepText(pipeline: OfficePipelineInfo): string {
  const active = pipeline.status === "running" || pipeline.status === "waiting_approval";
  if (!active) return `${Math.max(pipeline.totalSteps, 0)} etapas`;
  return stepLabel(pipeline);
}

interface SquadSelectorProps {
  squads: SquadSummary[];
  squadId: string | null;
  onSquadChange: (id: string) => void;
  size?: "desktop" | "mobile";
}

export function SquadSelector({ squads, squadId, onSquadChange, size = "desktop" }: SquadSelectorProps) {
  const squad = squads.find((s) => s.id === squadId) ?? null;
  const mobile = size === "mobile";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className={cn(
              "flex items-center gap-2 text-[13px] font-semibold text-[#1a1a17] dark:text-[#f4f2ec]",
              mobile
                ? "h-9 rounded-[10px] border border-[#1a1a17]/12 bg-[#fbfaf7] pl-2 pr-2.5 dark:border-white/10 dark:bg-[#1e1d1a]"
                : cn(HUD_GLASS, "h-10 pl-2.5 pr-3"),
            )}
            aria-label="Escolher squad"
          >
            <span className={cn("flex items-center justify-center bg-[#f2541b] text-[#1a1a17]", mobile ? "h-[22px] w-[22px] rounded-md" : "h-6 w-6 rounded-[7px]")}>
              {!mobile && <Rocket className="h-3.5 w-3.5" strokeWidth={2} />}
            </span>
            <span className="max-w-[220px] truncate">{squad?.name ?? "Escolha um squad"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#66645d]" strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        {squads.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => onSquadChange(s.id)} className={cn(s.id === squadId && "bg-accent")}>
            <span className="flex-1 truncate">{s.name}</span>
            <span className="text-xs text-muted-foreground">{s.agentCount}</span>
          </DropdownMenuItem>
        ))}
        {squads.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum squad ainda</div>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface OfficeHudProps {
  squads: SquadSummary[];
  squadId: string | null;
  onSquadChange: (id: string) => void;
  agents: OfficeAgent[];
  pipeline: OfficePipelineInfo;
  demoMode: boolean;
}

/** HUD da visão geral: seletor de squad, contagem, progresso do pipeline e contadores de estado. */
export function OfficeHud({ squads, squadId, onSquadChange, agents, pipeline, demoMode }: OfficeHudProps) {
  const working = agents.filter((a) => a.status === "working").length;
  const checkpoint = agents.filter((a) => a.status === "checkpoint").length;
  const delivering = agents.filter((a) => a.status === "delivering").length;
  const active = pipeline.status === "running" || pipeline.status === "waiting_approval";
  const elapsed = active ? elapsedLabel(pipeline.startedAt) : null;

  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-3">
      <div className="pointer-events-auto flex items-center gap-2">
        <SquadSelector squads={squads} squadId={squadId} onSquadChange={onSquadChange} />
        <span className={HUD_CHIP}>
          <Users className="h-3.5 w-3.5 text-[#66645d]" strokeWidth={2} />
          {agents.length} {agents.length === 1 ? "agente" : "agentes"}
        </span>
      </div>

      <div className={cn(HUD_GLASS, "pointer-events-auto w-[330px] shrink-0 px-3.5 py-2.5")}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-2">
            {pipeline.runNumber ? <span className="font-om-mono text-[11px] text-[#66645d]">EXEC #{pipeline.runNumber}</span> : null}
            <span className="truncate text-[13px] font-semibold text-[#1a1a17] dark:text-[#f4f2ec]">{pipelineTitle(pipeline, demoMode)}</span>
          </div>
          <span className="whitespace-nowrap text-[11px] text-[#66645d]">{pipelineStepText(pipeline)}{elapsed ? ` · ${elapsed}` : ""}</span>
        </div>
        <div className="mt-2">
          <PipelineSegments pipeline={pipeline} />
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        {demoMode && <span className={cn(HUD_CHIP, "text-[#66645d]")} title="Sem execução ativa: estados de exemplo para o escritório ter vida">Demonstração</span>}
        {working > 0 && <span className={HUD_CHIP}><span className="h-1.5 w-1.5 rounded-full bg-[#2f6fd6]" />{working} trabalhando</span>}
        {checkpoint > 0 && <span className={cn(HUD_CHIP, HUD_CHIP_HOT)}><span className="h-1.5 w-1.5 rounded-full bg-[#f2541b]" />{checkpoint} checkpoint</span>}
        {delivering > 0 && <span className={HUD_CHIP}><span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />{delivering} entregando</span>}
      </div>
    </div>
  );
}

interface CheckpointHudProps {
  roomName: string;
  zoom: number;
  onBack: () => void;
}

/** HUD compacto do zoom no checkpoint: voltar à visão geral, sala + zoom e aviso de pausa. */
export function CheckpointHud({ roomName, zoom, onBack }: CheckpointHudProps) {
  return (
    <>
      <div className="pointer-events-auto absolute left-4 top-4 z-10 flex items-center gap-2">
        <button type="button" onClick={onBack} className={cn(HUD_GLASS, "flex h-10 items-center gap-2 pl-2.5 pr-3 text-[13px] font-semibold text-[#1a1a17] dark:text-[#f4f2ec]")}>
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
          Visão geral
        </button>
        <span className={HUD_CHIP}>
          <ZoomIn className="h-3.5 w-3.5 text-[#66645d]" strokeWidth={2} />
          {roomName} · {Math.round(zoom * 100)}%
        </span>
      </div>
      <div className="pointer-events-auto absolute right-4 top-4 z-10">
        <span className={cn(HUD_CHIP, HUD_CHIP_HOT, "bg-[#fff1eb] dark:bg-[#3a1d12]")}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#f2541b]" />
          Pipeline pausado no checkpoint
        </span>
      </div>
    </>
  );
}
