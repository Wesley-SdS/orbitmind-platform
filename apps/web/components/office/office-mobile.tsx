"use client";

import { forwardRef, useMemo } from "react";
import Link from "next/link";
import { Bell, Building, GitBranch, LayoutDashboard, MessageSquare, RotateCw } from "lucide-react";
import { OfficeStage, type OfficeStageHandle } from "./office-stage";
import { OfficeAvatar } from "./office-avatar";
import { SquadSelector, PipelineSegments, pipelineTitle } from "./office-hud";
import type { SquadSummary } from "./hooks/use-office-state";
import type { OfficeAgent, OfficeHandoff, OfficePipelineInfo } from "@/lib/office/types";
import { OFFICE_ROOMS } from "@/lib/office/room-layout";
import { FLOOR_COLORS } from "@/lib/office/iso/palette";
import type { OfficeScene } from "@/lib/office/iso/office-scene";
import { cn } from "@/lib/utils";

interface OfficeMobileProps {
  squads: SquadSummary[];
  squadId: string | null;
  onSquadChange: (id: string) => void;
  agents: OfficeAgent[];
  pipeline: OfficePipelineInfo;
  demoMode: boolean;
  handoff: OfficeHandoff | null;
  selectedId: string | null;
  eventsCount: number;
  chatHref: string;
  onSelectAgent: (id: string) => void;
  onOpenCheckpoint: () => void;
  onOpenEvents: () => void;
  onZoomChange: (z: number) => void;
  onReady: (scene: OfficeScene) => void;
  onHandoffDone: () => void;
  initialRotation: number;
  onRotationChange: (rotation: number) => void;
  onRotate: () => void;
}

type RoomTone = "checkpoint" | "delivering" | "working" | "idle";

const TONE_CHIP: Record<RoomTone, string> = {
  checkpoint: "bg-[#f2541b] text-[#1a1a17]",
  delivering: "bg-[#efe9ff] text-[#5b3fc4]",
  working: "bg-[#e4edfb] text-[#1d4fa3]",
  idle: "bg-[#ebe8e1] text-[#66645d]",
};

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function first(name: string): string {
  return name.split(" ")[0] ?? name;
}

function lowerFirst(s: string): string {
  if (s.length > 1 && s[1] === s[1]!.toUpperCase() && s[1] !== s[1]!.toLowerCase()) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Frase de um agente livre a partir da posição dele no pipeline ("já entregou…", "espera a aprovação"). */
function idleLine(agent: OfficeAgent, pipeline: OfficePipelineInfo, all: OfficeAgent[]): string {
  const idx = pipeline.steps.findIndex((s) => s.agentId === agent.id);
  const step = idx >= 0 ? pipeline.steps[idx]! : null;
  const running = pipeline.status === "running" || pipeline.status === "waiting_approval";
  if (!step || !running) return `${first(agent.name)} está livre`;
  if (idx < pipeline.currentStepIndex) return `${first(agent.name)} já entregou ${lowerFirst(step.name)}`;
  const pendingApproval = pipeline.status === "waiting_approval" || all.some((a) => a.status === "checkpoint");
  if (pendingApproval) return `${first(agent.name)} espera a aprovação`;
  return `${first(agent.name)} aguarda a vez (${lowerFirst(step.name)})`;
}

/** Linha de uma sala: estado mais urgente, frase sobre quem está nela e os avatares. */
function describeRoom(agents: OfficeAgent[], pipeline: OfficePipelineInfo, all: OfficeAgent[], handoff: OfficeHandoff | null): { tone: RoomTone; chip: string; text: string } {
  const cp = agents.find((a) => a.status === "checkpoint");
  if (cp) return { tone: "checkpoint", chip: "Checkpoint", text: `${cp.name} aguarda sua aprovação` };
  const moving = agents.find((a) => a.status === "delivering");
  if (moving) {
    const to = handoff?.fromId === moving.id ? all.find((a) => a.id === handoff.toId) : null;
    return { tone: "delivering", chip: "Entregando", text: to ? `${first(moving.name)} leva a entrega para ${first(to.name)}` : `${first(moving.name)} está levando uma entrega` };
  }
  const working = agents.filter((a) => a.status === "working");
  if (working.length > 0) {
    // agrupa quem está na mesma etapa: "Carlos e Diana em criação de conteúdo"
    const stepNames = new Map<string, string>(pipeline.steps.map((s) => [`step-${s.step}`, s.name]));
    const byStep = new Map<string, string[]>();
    for (const a of working) {
      const step = a.currentStep ? stepNames.get(a.currentStep) ?? a.currentStep : "";
      byStep.set(step, [...(byStep.get(step) ?? []), first(a.name)]);
    }
    const parts = [...byStep].map(([step, names]) => {
      const who = names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}` : names[0]!;
      return step ? `${who} em ${lowerFirst(step)}` : `${who} trabalhando`;
    });
    return { tone: "working", chip: `${working.length} trabalhando`, text: parts.join(" · ") };
  }
  return { tone: "idle", chip: "Disponível", text: agents.map((a) => idleLine(a, pipeline, all)).join(" · ") };
}

const TONE_ORDER: Record<RoomTone, number> = { checkpoint: 0, working: 1, delivering: 2, idle: 3 };

/**
 * Escritório no celular, como no design: seletor de squad e sino, progresso,
 * mapa compacto (pinça para zoom), lista de salas e a barra de abas.
 */
export const OfficeMobile = forwardRef<OfficeStageHandle, OfficeMobileProps>(function OfficeMobile(p, stageRef) {
  const rooms = useMemo(() => {
    return OFFICE_ROOMS
      .map((room) => {
        const inRoom = p.agents.filter((a) => a.roomId === room.id);
        if (inRoom.length === 0) return null;
        return { room, agents: inRoom, ...describeRoom(inRoom, p.pipeline, p.agents, p.handoff) };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]);
  }, [p.agents, p.pipeline, p.handoff]);

  const checkpoints = p.agents.filter((a) => a.status === "checkpoint").length;
  const total = Math.max(p.pipeline.totalSteps, 1);
  const active = p.pipeline.status === "running" || p.pipeline.status === "waiting_approval";

  return (
    <div className="flex h-full flex-col bg-[#f3f1ec] text-[#1a1a17] dark:bg-[#141413] dark:text-[#f4f2ec]">
      <div className="flex flex-col gap-2.5 px-4 pb-2.5 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <SquadSelector squads={p.squads} squadId={p.squadId} onSquadChange={p.onSquadChange} size="mobile" />
          <button
            type="button"
            onClick={p.onOpenEvents}
            aria-label={p.eventsCount > 0 ? `Eventos, ${p.eventsCount} novos` : "Eventos"}
            className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#1a1a17]/12 bg-[#fbfaf7] dark:border-white/10 dark:bg-[#1e1d1a]"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {p.eventsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f2541b] px-1 text-[10px] font-bold text-[#1a1a17]">{p.eventsCount}</span>
            )}
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold">{pipelineTitle(p.pipeline, p.demoMode)}</span>
            <span className="text-[#66645d]">{active ? `Etapa ${Math.min(p.pipeline.currentStepIndex + 1, total)} de ${total}` : `${p.pipeline.totalSteps} etapas`}</span>
          </div>
          <PipelineSegments pipeline={p.pipeline} height={5} gap={3} />
        </div>
      </div>

      <div className="relative mx-4 h-[222px] shrink-0 overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgba(26,26,23,.1)]">
        <OfficeStage
          ref={stageRef}
          agents={p.agents}
          selectedId={p.selectedId}
          onSelect={(id) => id && p.onSelectAgent(id)}
          handoff={p.handoff}
          compact
          onZoomChange={p.onZoomChange}
          onReady={p.onReady}
          onHandoffDone={p.onHandoffDone}
          initialRotation={p.initialRotation}
          onRotationChange={p.onRotationChange}
        />
        <button
          type="button"
          onClick={p.onRotate}
          aria-label="Girar o mapa"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#1a1a17]/12 bg-[#fbfaf7]/92 text-[#1a1a17]"
        >
          <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        {checkpoints > 0 && (
          <button type="button" onClick={p.onOpenCheckpoint} className="absolute left-2 top-2 rounded-full border border-[#f2541b] bg-[#fbfaf7]/92 px-[7px] py-[3px] text-[10px] font-semibold text-[#b53f14]">
            {checkpoints} checkpoint
          </button>
        )}
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-[#1a1a17]/82 px-[7px] py-[3px] text-[10px] font-semibold text-[#f4f2ec]">Pinça para zoom</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-3 pt-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-[#66645d]">Salas</span>
          <span className="text-[11px] text-[#66645d]">{p.agents.length} {p.agents.length === 1 ? "agente" : "agentes"}</span>
        </div>
        {rooms.map(({ room, agents, tone, chip, text }) => (
          <button
            key={room.id}
            type="button"
            onClick={() => (tone === "checkpoint" ? p.onOpenCheckpoint() : p.onSelectAgent(agents[0]!.id))}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left",
              tone === "checkpoint" ? "border-[#f2541b] bg-[#fff7f3] dark:bg-[#2a1a12]" : "border-[#1a1a17]/10 bg-[#fbfaf7] dark:border-white/10 dark:bg-[#1e1d1a]",
              tone === "idle" && "opacity-80",
            )}
          >
            <span className="h-10 w-2.5 shrink-0 rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]" style={{ background: hex(FLOOR_COLORS[room.floor].base) }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                {room.name}
                <span className={cn("inline-flex h-[22px] items-center rounded-full px-2 text-[11px] font-semibold", TONE_CHIP[tone])}>{chip}</span>
              </div>
              <div className="mt-0.5 truncate text-xs text-[#66645d]">{text}</div>
            </div>
            <div className="flex gap-1">
              {agents.slice(0, 3).map((a) => <OfficeAvatar key={a.id} look={a.look} />)}
            </div>
          </button>
        ))}
        {rooms.length === 0 && <p className="py-6 text-center text-xs text-[#66645d]">Nenhum agente neste squad ainda.</p>}
      </div>

      <nav aria-label="Navegação" className="flex items-center border-t border-[#1a1a17]/8 bg-[#fbfaf7] px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 dark:border-white/10 dark:bg-[#1e1d1a]">
        {[
          { href: "/dashboard", label: "Início", icon: LayoutDashboard },
          { href: p.chatHref, label: "Chat", icon: MessageSquare },
          { href: "/office", label: "Escritório", icon: Building, active: true },
          { href: "/pipeline", label: "Pipeline", icon: GitBranch },
        ].map((t) => (
          <Link
            key={t.label}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn("flex h-[52px] flex-1 flex-col items-center justify-center gap-[3px] text-[10px] font-medium", t.active ? "text-[#1a1a17] dark:text-[#f4f2ec]" : "text-[#66645d]")}
          >
            <t.icon className="h-[18px] w-[18px]" strokeWidth={t.active ? 2 : 1.75} />
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
});
