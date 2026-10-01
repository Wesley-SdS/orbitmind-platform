"use client";

import type { OfficeEvent } from "@/lib/office/types";
import { cn } from "@/lib/utils";

interface OfficeFeedProps {
  events: OfficeEvent[];
  /** Nome curto do agente do checkpoint, para o link "Ir até …". */
  checkpointAgentName?: string | null;
  onSelectAgent?: (agentId: string) => void;
  onGoToCheckpoint?: () => void;
}

const KIND_COLOR: Record<OfficeEvent["kind"], string> = {
  done: "bg-[#2e8b57]",
  handoff: "bg-[#8b5cf6]",
  checkpoint: "bg-[#f2541b]",
  start: "bg-[#2f6fd6]",
  failed: "bg-destructive",
  info: "bg-[#8f8c84]",
};

/** Tempo desde o evento, no formato curto do design ("agora", "40 s", "2 min"). */
export function ago(at: number): string {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 5) return "agora";
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

/** Handoff em andamento por até 20 s ("está levando"); depois, "entregou". */
const MOVING_MS = 20_000;

export function EventSentence({ event }: { event: OfficeEvent }) {
  const text = event.settledText && Date.now() - event.at > MOVING_MS ? event.settledText : event.text;
  return (
    <>
      {event.actor && <b className="font-semibold">{event.actor}</b>}
      {event.actor ? " " : ""}
      {text}
      {event.target && <> <b className="font-semibold">{event.target}</b></>}
    </>
  );
}

/**
 * Últimos três eventos, do mais antigo (mais apagado) ao mais novo. O de
 * checkpoint ganha borda laranja e o link para ir até quem espera a decisão.
 */
export function OfficeFeed({ events, checkpointAgentName, onSelectAgent, onGoToCheckpoint }: OfficeFeedProps) {
  const shown = events.slice(0, 3).reverse();
  if (shown.length === 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-[88px] left-4 z-10 flex w-[300px] flex-col gap-1.5" aria-live="polite" aria-label="Eventos recentes">
      {shown.map((e, i) => {
        const opacity = i === shown.length - 1 || e.kind === "checkpoint" ? "" : i === shown.length - 2 ? "opacity-90" : "opacity-75";
        const isCheckpoint = e.kind === "checkpoint";
        const Row = !isCheckpoint && e.agentId && onSelectAgent ? "button" : "div";
        return (
          <Row
            key={e.id}
            {...(Row === "button" ? { type: "button" as const, onClick: () => onSelectAgent?.(e.agentId!) } : {})}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-[#fbfaf7]/86 px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_10px_28px_rgba(26,26,23,.12)] backdrop-blur-md dark:bg-[#1e1d1a]/86",
              isCheckpoint ? "border-[#f2541b]" : "border-[#1a1a17]/12 dark:border-white/10",
              opacity,
            )}
          >
            <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", KIND_COLOR[e.kind])} />
            <span className="flex-1 text-xs leading-[1.35] text-[#1a1a17] dark:text-[#f4f2ec]">
              <EventSentence event={e} /> <span className="text-[#66645d]">· {ago(e.at)}</span>
            </span>
            {isCheckpoint && onGoToCheckpoint && (
              <button type="button" onClick={onGoToCheckpoint} className="whitespace-nowrap text-xs font-semibold text-[#b53f14] hover:underline dark:text-[#ff8a5b]">
                Ir até {checkpointAgentName ?? "lá"}
              </button>
            )}
          </Row>
        );
      })}
    </div>
  );
}
