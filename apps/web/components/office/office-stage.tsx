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
  panToLocal: (x: number, y: number) => void;
  scene: () => OfficeScene | null;
}

interface OfficeStageProps {
  agents: OfficeAgent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  handoff: OfficeHandoff | null;
  onZoomChange?: (zoom: number) => void;
  onFollowLost?: () => void;
  onReady?: (scene: OfficeScene) => void;
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
  { agents, selectedId, onSelect, handoff, onZoomChange, onFollowLost, onReady, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OfficeScene | null>(null);
  const agentsRef = useRef(agents);
  const tagRefs = useRef(new Map<string, HTMLDivElement>());
  const roomRefs = useRef(new Map<string, HTMLDivElement>());
  const [ready, setReady] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  agentsRef.current = agents;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onZoomRef = useRef(onZoomChange);
  onZoomRef.current = onZoomChange;
  const onFollowLostRef = useRef(onFollowLost);
  onFollowLostRef.current = onFollowLost;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

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
      });
      sceneRef.current = scene;
      return scene.init(host).then(() => {
        if (cancelled || !scene) return;
        setReady(true);
        onReadyRef.current?.(scene);
      });
    }).catch(() => { /* WebGL indisponível: fica o fallback */ });
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
      look: { shirt: a.color, hair: a.hair, skin: a.skin },
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
    scene.handoff(handoff.fromId, handoff.toId, seatOf);
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
      const labelScale = Math.max(0.85, Math.min(1.25, 0.8 + zoom * 0.25));
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
        const visible = r.x > -120 && r.x < w + 120 && r.y > -40 && r.y < h + 60 && zoom > 0.55;
        el.style.display = visible ? "" : "none";
        const dy = r.placement === "above" ? "-100%" : "0%";
        el.style.transform = `translate(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px) translate(-50%, ${dy}) scale(${labelScale.toFixed(3)})`;
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
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#f2541b] border-t-transparent" />
            <p className="text-xs text-muted-foreground">Montando o escritório…</p>
          </div>
        </div>
      )}

      {/* etiquetas das salas */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {OFFICE_ROOMS.map((room) => {
          const count = countByRoom.get(room.id) ?? 0;
          const hot = checkpointRooms.has(room.id);
          return (
            <div key={room.id} ref={setRoomRef(room.id)} className="absolute left-0 top-0 flex flex-col items-center will-change-transform" style={{ display: "none" }}>
              <span className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-[#fbfaf7]/95 px-2.5 py-1 text-[11px] font-semibold leading-none text-[#1a1a17] shadow-[0_6px_14px_rgba(26,26,23,.16)]",
                hot ? "border-[#f2541b]" : "border-[#1a1a17]/12",
              )}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: hot ? "#f2541b" : room.accent }} />
                {room.name}
                {count > 0 && (
                  <span className={cn("inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold", hot ? "bg-[#f2541b] text-[#1a1a17]" : "bg-[#1a1a17] text-[#f4f2ec]")}>{count}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* nomes dos agentes */}
      <div className="absolute inset-0 pointer-events-none">
        {agents.map((a) => (
          <div key={a.id} ref={setTagRef(a.id)} className="absolute left-0 top-0 will-change-transform" style={{ display: "none" }}>
            <button
              type="button"
              onClick={() => onSelect(a.id)}
              className={cn(
                "pointer-events-auto flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#1a1a17]/90 px-2 py-1 text-[11px] font-semibold leading-none text-[#f4f2ec] shadow-[0_3px_8px_rgba(26,26,23,.25)] transition-shadow",
                a.id === selectedId && "ring-2 ring-[#f2541b]",
                a.id === hoverId && a.id !== selectedId && "ring-1 ring-[#f2541b]/70",
                a.status === "idle" && a.id !== selectedId && "opacity-80",
              )}
              aria-label={`${a.name}, ${a.role}`}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[a.status])} />
              {a.name.split(" ")[0]}
            </button>
          </div>
        ))}
        <div ref={setTagRef(USER_ID)} className="absolute left-0 top-0 will-change-transform" style={{ display: "none" }}>
          <span className="flex items-center whitespace-nowrap rounded-full bg-[#f2541b] px-2 py-1 text-[11px] font-semibold leading-none text-[#1a1a17] shadow-[0_3px_8px_rgba(26,26,23,.25)]">Você</span>
        </div>
      </div>
    </div>
  );
});
