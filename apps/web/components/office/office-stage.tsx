"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { OfficeScene } from "@/lib/office/iso/office-scene";
import { OFFICE_ROOMS } from "@/lib/office/room-layout";
import { USER_ID, type OfficeAgent, type OfficeHandoff } from "@/lib/office/types";
import { cn } from "@/lib/utils";

export interface OfficeStageHandle {
  focusAgent: (id: string, zoom?: number) => void;
  follow: (id: string | null) => void;
  walkUserToAgent: (id: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  rotate: (delta: number) => void;
  panToLocal: (x: number, y: number) => void;
  scene: () => OfficeScene | null;
}

/** Balão de fala ancorado num agente (checkpoint: "Preciso da sua aprovação"). */
export interface OfficeCallout {
  agentId: string;
  title: string;
  text: string | null;
}

interface OfficeStageProps {
  agents: OfficeAgent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  handoff: OfficeHandoff | null;
  callout?: OfficeCallout | null;
  /** Mapa compacto do celular: sem etiquetas de sala nem de nome, como no design. */
  compact?: boolean;
  /** Mostra só a etiqueta desta sala (zoom no checkpoint, prancha 02). */
  onlyRoomId?: string | null;
  onZoomChange?: (zoom: number) => void;
  onFollowLost?: () => void;
  onReady?: (scene: OfficeScene) => void;
  onFootstep?: () => void;
  onRebuild?: () => void;
  /** O agente do handoff voltou para o lugar. */
  onHandoffDone?: () => void;
  /** A câmera girou (0..3). */
  onRotationChange?: (rotation: number) => void;
  /** Orientação inicial da câmera (preferência salva). */
  initialRotation?: number;
  className?: string;
}

const STATUS_DOT: Record<OfficeAgent["status"], string> = {
  idle: "bg-[#8f8c84]",
  working: "bg-[#2f6fd6]",
  done: "bg-[#2e8b57]",
  checkpoint: "bg-[#f2541b]",
  delivering: "bg-[#8b5cf6]",
};

/**
 * Canvas PixiJS + etiquetas em HTML posicionadas a cada frame. O React nunca
 * re-renderiza por causa da câmera: as etiquetas são movidas via `style.transform`.
 */
export const OfficeStage = forwardRef<OfficeStageHandle, OfficeStageProps>(function OfficeStage(
  { agents, selectedId, onSelect, handoff, callout, compact, onlyRoomId, onZoomChange, onFollowLost, onReady, onFootstep, onRebuild, onHandoffDone, onRotationChange, initialRotation, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const calloutAgentRef = useRef<string | null>(null);
  calloutAgentRef.current = callout?.agentId ?? null;
  const sceneRef = useRef<OfficeScene | null>(null);
  const agentsRef = useRef(agents);
  const tagRefs = useRef(new Map<string, HTMLDivElement>());
  const roomRefs = useRef(new Map<string, HTMLDivElement>());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  /** Com a câmera perto (≥160%), as etiquetas mostram o nome completo, como no zoom do design. */
  const [fullNames, setFullNames] = useState(false);
  const fullNamesRef = useRef(false);
  agentsRef.current = agents;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onZoomRef = useRef(onZoomChange);
  onZoomRef.current = onZoomChange;
  const onFollowLostRef = useRef(onFollowLost);
  onFollowLostRef.current = onFollowLost;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onFootstepRef = useRef(onFootstep);
  onFootstepRef.current = onFootstep;
  const onRebuildRef = useRef(onRebuild);
  onRebuildRef.current = onRebuild;
  const onHandoffDoneRef = useRef(onHandoffDone);
  onHandoffDoneRef.current = onHandoffDone;
  const onRotationRef = useRef(onRotationChange);
  onRotationRef.current = onRotationChange;
  const initialRotationRef = useRef(initialRotation ?? 0);

  // monta a cena uma vez (o PixiJS só carrega no navegador)
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let scene: OfficeScene | null = null;
    import("@/lib/office/iso/office-scene").then(({ OfficeScene: Scene }) => {
      if (cancelled) return;
      scene = new Scene({
        onAgentClick: (id) => onSelectRef.current(id),
        onAgentHover: (id) => setHoverId(id),
        onFloorClick: (pos) => sceneRef.current?.walkUserTo(pos),
        onZoomChange: (z) => onZoomRef.current?.(z),
        onUserPan: () => onFollowLostRef.current?.(),
        onFootstep: () => onFootstepRef.current?.(),
        onRebuild: () => onRebuildRef.current?.(),
        onRotationChange: (r) => onRotationRef.current?.(r),
      });
      sceneRef.current = scene;
      // QA: em desenvolvimento a cena fica acessível no console
      if (process.env.NODE_ENV !== "production") (window as unknown as { __officeScene?: unknown }).__officeScene = scene;
      return scene.init(host).then(() => {
        if (cancelled || !scene) return;
        scene.setRotationTo(initialRotationRef.current);
        scene.fitToView();
        setReady(true);
        onReadyRef.current?.(scene);
      });
    }).catch((err: unknown) => {
      console.error("[office] não foi possível montar a cena", err);
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      scene?.destroy();
      sceneRef.current = null;
      setReady(false);
    };
  }, []);

  // agentes → atores
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ready) return;
    scene.setAgents(agents.map((a) => ({
      id: a.id,
      status: a.status,
      seat: a.seat,
      look: a.look,
    })));
  }, [agents, ready]);

  useEffect(() => {
    sceneRef.current?.setSelected(selectedId);
  }, [selectedId, ready]);

  // handoff → animação
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ready || !handoff) return;
    const seatOf = (id: string) => agentsRef.current.find((a) => a.id === id)?.seat ?? null;
    scene.handoff(handoff.fromId, handoff.toId, seatOf, () => onHandoffDoneRef.current?.());
  }, [handoff, ready]);

  // etiquetas seguem a câmera
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !ready) return;
    const host = hostRef.current;
    return scene.onFrame(() => {
      const w = host?.clientWidth ?? 0;
      const h = host?.clientHeight ?? 0;
      const zoom = scene.zoom;
      // 1,0× na visão geral e ~1,18× a 200%, como nas pranchas do design
      const labelScale = Math.max(0.9, Math.min(1.24, 0.88 + zoom * 0.15));
      const full = zoom >= 1.6;
      if (full !== fullNamesRef.current) { fullNamesRef.current = full; setFullNames(full); }
      for (const [id, el] of tagRefs.current) {
        const a = scene.agentAnchor(id);
        if (!a) { el.style.display = "none"; continue; }
        const visible = a.x > -80 && a.x < w + 80 && a.y > -40 && a.y < h + 60;
        el.style.display = visible ? "" : "none";
        el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px) translate(-50%, -100%) scale(${labelScale.toFixed(3)})`;
      }
      for (const [roomId, el] of roomRefs.current) {
        const r = scene.roomAnchor(roomId);
        if (!r) { el.style.display = "none"; continue; }
        const visible = r.x > -140 && r.x < w + 140 && r.y > -60 && r.y < h + 60 && zoom > 0.55;
        el.style.display = visible ? "" : "none";
        el.dataset.placement = r.placement;
        el.style.transformOrigin = r.placement === "above" ? "50% 100%" : "50% 0%";
        // acima: o fio termina 14 px antes da âncora; abaixo: o fio sai da âncora
        const dy = r.placement === "above" ? `calc(-100% - ${(14 * labelScale).toFixed(1)}px)` : "0%";
        el.style.transform = `translate(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px) translate(-50%, ${dy}) scale(${labelScale.toFixed(3)})`;
      }
      // balão de fala: à direita da etiqueta do agente (a 200% fica como no design: +126 px, -40 px)
      const box = calloutRef.current;
      const who = calloutAgentRef.current;
      if (box) {
        const a = who ? scene.agentAnchor(who) : null;
        if (!a) { box.style.display = "none"; }
        else {
          box.style.display = "";
          box.style.transform = `translate(${(a.x + 6 + 60 * zoom).toFixed(1)}px, ${(a.y - 20 * zoom).toFixed(1)}px)`;
        }
      }
    });
  }, [ready, agents.length]);

  useImperativeHandle(ref, () => ({
    focusAgent: (id, zoom) => sceneRef.current?.focusOn(id, zoom),
    follow: (id) => sceneRef.current?.follow(id),
    walkUserToAgent: (id) => {
      const seat = agentsRef.current.find((a) => a.id === id)?.seat;
      if (seat) sceneRef.current?.walkUserToAgent(id, seat);
    },
    zoomIn: () => sceneRef.current?.zoomBy(1.25),
    zoomOut: () => sceneRef.current?.zoomBy(1 / 1.25),
    fit: () => sceneRef.current?.fitToView(),
    rotate: (delta) => sceneRef.current?.rotate(delta),
    panToLocal: (x, y) => sceneRef.current?.panToLocal(x, y),
    scene: () => sceneRef.current,
  }), []);

  const setTagRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) tagRefs.current.set(id, el); else tagRefs.current.delete(id);
  }, []);
  const setRoomRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) roomRefs.current.set(id, el); else roomRefs.current.delete(id);
  }, []);

  const countByRoom = new Map<string, number>();
  for (const a of agents) countByRoom.set(a.roomId, (countByRoom.get(a.roomId) ?? 0) + 1);
  const checkpointRooms = new Set(agents.filter((a) => a.status === "checkpoint").map((a) => a.roomId));

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div
        ref={hostRef}
        className="absolute inset-0 bg-[#ebe6da] dark:bg-[#22201c] [background-image:radial-gradient(rgba(26,26,23,.13)_1px,transparent_1.2px)] dark:[background-image:radial-gradient(rgba(244,242,236,.08)_1px,transparent_1.2px)] [background-size:24px_24px]"
        aria-label="Escritório virtual isométrico"
        role="img"
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          {failed ? (
            <p className="max-w-xs text-center text-xs text-[#66645d]">Não foi possível desenhar o escritório neste navegador (WebGL indisponível). Os painéis continuam funcionando.</p>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#f2541b] border-t-transparent" />
              <p className="text-xs text-[#66645d]">Montando o escritório…</p>
            </div>
          )}
        </div>
      )}

      {/* etiquetas das salas */}
      <div className={cn("pointer-events-none absolute inset-0", compact && "hidden")} aria-hidden="true">
        {OFFICE_ROOMS.filter((room) => !onlyRoomId || room.id === onlyRoomId).map((room) => {
          const count = countByRoom.get(room.id) ?? 0;
          const hot = checkpointRooms.has(room.id);
          return (
            <div key={room.id} ref={setRoomRef(room.id)} className="group absolute left-0 top-0 flex flex-col items-center will-change-transform data-[placement=below]:flex-col-reverse" style={{ display: "none" }}>
              <span className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-[#fbfaf7]/95 px-[9px] py-[5px] text-[11px] font-semibold leading-none text-[#1a1a17] shadow-[0_6px_14px_rgba(26,26,23,.16)]",
                hot ? "border-[#f2541b]" : "border-[#1a1a17]/12",
              )}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: hot ? "#f2541b" : room.accent }} />
                {room.name}
                {count > 0 && (
                  <span className={cn("inline-flex h-4 min-w-4 items-center justify-center rounded-full px-[5px] text-[9px] font-bold", hot ? "bg-[#f2541b] text-[#1a1a17]" : "bg-[#1a1a17] text-[#f4f2ec]")}>{count}</span>
                )}
              </span>
              <span className="h-[14px] w-px bg-[#1a1a17]/40" />
            </div>
          );
        })}
      </div>

      {/* nomes dos agentes */}
      <div className={cn("absolute inset-0 pointer-events-none", compact && "hidden")}>
        {agents.map((a) => (
          <div key={a.id} ref={setTagRef(a.id)} className="absolute left-0 top-0 origin-bottom will-change-transform" style={{ display: "none" }}>
            <button
              type="button"
              onClick={() => onSelect(a.id)}
              className={cn(
                "pointer-events-auto flex items-center gap-[5px] whitespace-nowrap rounded-full bg-[#1a1a17]/90 px-2 py-1 text-[11px] font-semibold leading-none text-[#f4f2ec] shadow-[0_3px_8px_rgba(26,26,23,.25)] transition-shadow",
                a.id === selectedId && "shadow-[0_0_0_2px_#f2541b,0_3px_8px_rgba(26,26,23,.25)]",
                a.id === hoverId && a.id !== selectedId && "shadow-[0_0_0_1px_rgba(242,84,27,.7),0_3px_8px_rgba(26,26,23,.25)]",
                a.status === "idle" && a.id !== selectedId && "opacity-80",
              )}
              aria-label={`${a.name}, ${a.role}`}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[a.status])} />
              {fullNames ? a.name : a.name.split(" ")[0]}
            </button>
          </div>
        ))}
        <div ref={setTagRef(USER_ID)} className="absolute left-0 top-0 origin-bottom will-change-transform" style={{ display: "none" }}>
          <span className="flex items-center whitespace-nowrap rounded-full bg-[#f2541b] px-2 py-1 text-[11px] font-semibold leading-none text-[#1a1a17] shadow-[0_3px_8px_rgba(26,26,23,.25)]">Você</span>
        </div>
      </div>

      {/* balão de fala do agente (checkpoint) */}
      {callout && (
        <div ref={calloutRef} className="pointer-events-none absolute left-0 top-0 z-[1] will-change-transform" style={{ display: "none" }} role="status">
          <div className="w-[236px] rounded-[14px_14px_14px_4px] border border-[#1a1a17]/12 bg-[#fbfaf7]/96 px-3 py-2.5 text-[13px] leading-[1.4] text-[#1a1a17] shadow-[0_10px_28px_rgba(26,26,23,.18)] dark:border-white/10 dark:bg-[#1e1d1a]/96 dark:text-[#f4f2ec]">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#f2541b] text-[11px] font-bold text-[#1a1a17]">!</span>
              <b className="font-semibold">{callout.title}</b>
            </div>
            {callout.text}
          </div>
        </div>
      )}
    </div>
  );
});
