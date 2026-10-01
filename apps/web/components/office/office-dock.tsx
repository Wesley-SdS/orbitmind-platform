"use client";

import Link from "next/link";
import { Bell, Eye, Map as MapIcon, Maximize, MessageSquare, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficeDockProps {
  userName: string;
  zoom: number;
  following: boolean;
  canFollow: boolean;
  onToggleFollow: () => void;
  chatHref: string;
  chatActive?: boolean;
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

const btn = "flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium text-[#f4f2ec] transition-colors hover:bg-[#f4f2ec]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2541b]";
const on = "bg-[#f4f2ec]/16 hover:bg-[#f4f2ec]/16";

/**
 * Dock inferior estilo Gather, igual ao design: você, seguir, chat, eventos,
 * mapa, zoom e tela cheia. Girar a câmera e o som ficam na barrinha acima do
 * minimapa (`OfficeViewControls`), também por teclado (Q/E, M; 0 ajusta a tela).
 */
export function OfficeDock(p: OfficeDockProps) {
  const initial = (p.userName.trim()[0] ?? "?").toUpperCase();
  return (
    <div
      className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex h-14 -translate-x-1/2 items-center gap-1 rounded-2xl bg-gradient-to-b from-[#24221e] to-[#1a1a17] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_14px_34px_rgba(26,26,23,.35)]"
      role="toolbar"
      aria-label="Controles do escritório"
    >
      <div className="flex items-center gap-2 pl-1 pr-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f2541b] text-xs font-bold text-[#1a1a17]">{initial}</span>
        <span className="text-xs font-semibold text-[#f4f2ec]">Você</span>
      </div>
      <span className="mx-1 h-7 w-px bg-[#f4f2ec]/15" />

      <button
        type="button"
        onClick={p.onToggleFollow}
        disabled={!p.canFollow}
        className={cn(btn, p.following && on, !p.canFollow && "cursor-not-allowed opacity-50")}
        aria-pressed={p.following}
        aria-label="Seguir agente"
        title={p.canFollow ? "Centralizar a câmera no agente selecionado" : "Selecione um agente para seguir"}
      >
        <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />Seguir
      </button>
      <Link href={p.chatHref} className={cn(btn, p.chatActive && on)} aria-label="Chat">
        <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.75} />Chat
      </Link>
      <button
        type="button"
        onClick={p.onToggleEvents}
        className={cn(btn, "relative", p.eventsOpen && on)}
        aria-pressed={p.eventsOpen}
        aria-label={p.eventsCount > 0 ? `Eventos, ${p.eventsCount} novos` : "Eventos"}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />Eventos
        {p.eventsCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f2541b] px-1 text-[10px] font-bold text-[#1a1a17]">{p.eventsCount}</span>
        )}
      </button>
      <button type="button" onClick={p.onToggleMinimap} className={cn(btn, p.minimapOpen && on)} aria-pressed={p.minimapOpen} aria-label="Mapa">
        <MapIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />Mapa
      </button>

      <span className="mx-1 h-7 w-px bg-[#f4f2ec]/15" />
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={p.onZoomOut} className={cn(btn, "min-w-8 px-0")} aria-label="Diminuir zoom"><Minus className="h-[18px] w-[18px]" strokeWidth={2} /></button>
        <button type="button" onClick={p.onFit} className="w-10 text-center font-om-mono text-xs text-[#f4f2ec]" title="Ajustar à tela (0)">{Math.round(p.zoom * 100)}%</button>
        <button type="button" onClick={p.onZoomIn} className={cn(btn, "min-w-8 px-0")} aria-label="Aumentar zoom"><Plus className="h-[18px] w-[18px]" strokeWidth={2} /></button>
      </div>
      <button type="button" onClick={p.onFullscreen} className={cn(btn, "min-w-10 px-0")} aria-label="Tela cheia"><Maximize className="h-[18px] w-[18px]" strokeWidth={1.75} /></button>
    </div>
  );
}
