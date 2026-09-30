"use client";

import type { OfficeEvent } from "@/lib/office/types";
import { cn } from "@/lib/utils";

interface OfficeFeedProps {
  events: OfficeEvent[];
  onGoTo?: (agentId: string) => void;
  onOpenCheckpoint?: () => void;
}

const KIND_COLOR: Record<OfficeEvent["kind"], string> = {
  done: "bg-[#2e8b57]",
  handoff: "bg-[#8b5cf6]",
  checkpoint: "bg-[#f2541b]",
  start: "bg-[#2f6fd6]",
  failed: "bg-destructive",
  info: "bg-[#8f8c84]",
};

function ago(at: number): string {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 5) return "agora";
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export function OfficeFeed({ events, onGoTo, onOpenCheckpoint }: OfficeFeedProps) {
  const shown = events.slice(0, 3).reverse();
  if (shown.length === 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-[88px] left-4 z-10 flex w-[300px] flex-col gap-1.5" aria-live="polite" aria-label="Eventos recentes">
      {shown.map((e, i) => {
        const last = i === shown.length - 1;
        return (
          <div
            key={e.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-[#fbfaf7]/85 px-2.5 py-2 text-xs leading-snug text-foreground shadow-[0_10px_28px_rgba(26,26,23,.12)] backdrop-blur-md dark:bg-[#1e1d1a]/85",
              e.kind === "checkpoint" ? "border-[#f2541b]" : "border-[#1a1a17]/12 dark:border-white/10",
              !last && "opacity-80",
            )}
          >
            <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", KIND_COLOR[e.kind])} />
            <span className="flex-1">{e.text} <span className="text-muted-foreground">· {ago(e.at)}</span></span>
            {e.kind === "checkpoint" && onOpenCheckpoint && (
              <button type="button" onClick={onOpenCheckpoint} className="whitespace-nowrap font-semibold text-[#b53f14] hover:underline dark:text-[#ff8a5b]">Revisar</button>
            )}
            {e.kind !== "checkpoint" && e.agentId && onGoTo && (
              <button type="button" onClick={() => onGoTo(e.agentId!)} className="whitespace-nowrap font-medium text-muted-foreground hover:text-foreground hover:underline">Ver</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
