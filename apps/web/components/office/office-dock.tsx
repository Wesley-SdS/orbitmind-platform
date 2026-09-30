"use client";

import Link from "next/link";
import { Bell, Eye, Map as MapIcon, Maximize2, MessageSquare, Minus, Plus, Scan } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficeDockProps {
  userName: string;
  zoom: number;
  following: boolean;
  canFollow: boolean;
  onToggleFollow: () => void;
  chatHref: string;
  eventsCount: number;
  eventsOpen: boolean;
  onToggleEvents: () => void;
  minimapOpen: boolean;
  onToggleMinimap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onFullscreen: () => void;
}

const btn = "flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium text-[#f4f2ec]/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2541b]";

export function OfficeDock(p: OfficeDockProps) {
  const initials = p.userName.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  return (
    <div
      className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex h-14 -translate-x-1/2 items-center gap-1 rounded-2xl bg-gradient-to-b from-[#24221e] to-[#1a1a17] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_14px_34px_rgba(26,26,23,.35)]"
      role="toolbar"
      aria-label="Controles do escritório"
    >
      <div className="flex items-center gap-2 pl-1 pr-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2541b] text-xs font-bold text-[#1a1a17]">{initials}</span>
        <span className="hidden text-xs font-semibold text-[#f4f2ec] sm:inline">Você</span>
      </div>
      <span className="mx-1 h-7 w-px bg-[#f4f2ec]/15" />

      <button type="button" onClick={p.onToggleFollow} disabled={!p.canFollow} className={cn(btn, p.following && "bg-white/15", !p.canFollow && "opacity-40")} aria-pressed={p.following} title={p.canFollow ? "Seguir o agente selecionado" : "Selecione um agente para seguir"}>
        <Eye className="h-4 w-4" /><span className="hidden md:inline">Seguir</span>
      </button>
      <Link href={p.chatHref} className={btn} title="Abrir o chat do squad">
        <MessageSquare className="h-4 w-4" /><span className="hidden md:inline">Chat</span>
      </Link>
      <button type="button" onClick={p.onToggleEvents} className={cn(btn, "relative", p.eventsOpen && "bg-white/15")} aria-pressed={p.eventsOpen} title="Mostrar eventos">
        <Bell className="h-4 w-4" /><span className="hidden md:inline">Eventos</span>
        {p.eventsCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f2541b] px-1 text-[10px] font-bold text-[#1a1a17]">{p.eventsCount}</span>
        )}
      </button>
      <button type="button" onClick={p.onToggleMinimap} className={cn(btn, p.minimapOpen && "bg-white/15")} aria-pressed={p.minimapOpen} title="Mostrar minimapa">
        <MapIcon className="h-4 w-4" /><span className="hidden md:inline">Mapa</span>
      </button>

      <span className="mx-1 h-7 w-px bg-[#f4f2ec]/15" />
      <button type="button" onClick={p.onZoomOut} className={cn(btn, "min-w-8 px-0")} aria-label="Diminuir zoom"><Minus className="h-4 w-4" /></button>
      <button type="button" onClick={p.onFit} className="w-12 text-center font-mono text-xs text-[#f4f2ec] hover:text-white" title="Ajustar à tela">{Math.round(p.zoom * 100)}%</button>
      <button type="button" onClick={p.onZoomIn} className={cn(btn, "min-w-8 px-0")} aria-label="Aumentar zoom"><Plus className="h-4 w-4" /></button>
      <button type="button" onClick={p.onFit} className={cn(btn, "min-w-9 px-0")} aria-label="Ajustar à tela" title="Ajustar à tela"><Scan className="h-4 w-4" /></button>
      <button type="button" onClick={p.onFullscreen} className={cn(btn, "min-w-9 px-0")} aria-label="Tela cheia" title="Tela cheia"><Maximize2 className="h-4 w-4" /></button>
    </div>
  );
}
