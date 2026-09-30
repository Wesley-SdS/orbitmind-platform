"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSidebar } from "@/components/ui/sidebar";
import { useOfficeState } from "./hooks/use-office-state";
import { OfficeStage, type OfficeStageHandle } from "./office-stage";
import { OfficeHud } from "./office-hud";
import { OfficeDock } from "./office-dock";
import { OfficeFeed } from "./office-feed";
import { OfficeMinimap } from "./office-minimap";
import { OfficeAgentPanel } from "./office-agent-panel";
import { OfficeCheckpointPanel } from "./office-checkpoint-panel";
import type { OfficeScene } from "@/lib/office/iso/office-scene";
import { cn } from "@/lib/utils";

type Panel = { kind: "agent"; id: string } | { kind: "checkpoint" } | null;

/**
 * Escritório virtual: cena isométrica + HUD + painel lateral.
 * A sidebar do app recolhe para o modo ícone enquanto a página está aberta.
 */
export default function VirtualOffice() {
  const state = useOfficeState();
  const { agents, pipeline, events, handoff, squads, squadId, setSquadId, runSteps, demoMode, loading, refresh } = state;
  const { data: session } = useSession();
  const stageRef = useRef<OfficeStageHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<OfficeScene | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [zoom, setZoom] = useState(1);
  const [following, setFollowing] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(true);
  const [minimapOpen, setMinimapOpen] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const autoOpenedRun = useRef<string | null>(null);

  // sidebar em modo ícone enquanto o escritório está aberto
  const sidebar = useSidebar();
  const sidebarWasOpen = useRef(sidebar.open);
  useEffect(() => {
    const wasOpen = sidebarWasOpen.current;
    if (!sidebar.isMobile) sidebar.setOpen(false);
    return () => { if (!sidebar.isMobile) sidebar.setOpen(wasOpen); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = (): void => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // checkpoint novo → abre o painel de aprovação uma vez por execução
  useEffect(() => {
    if (pipeline.status !== "waiting_approval" || !pipeline.runId) return;
    if (autoOpenedRun.current === pipeline.runId) return;
    autoOpenedRun.current = pipeline.runId;
    setPanel({ kind: "checkpoint" });
    if (pipeline.checkpointAgentId) {
      setSelectedId(pipeline.checkpointAgentId);
      stageRef.current?.focusAgent(pipeline.checkpointAgentId);
    }
  }, [pipeline.status, pipeline.runId, pipeline.checkpointAgentId]);

  // painel de checkpoint fecha sozinho quando o pipeline segue
  useEffect(() => {
    if (panel?.kind === "checkpoint" && pipeline.status !== "waiting_approval") {
      setPanel(selectedId ? { kind: "agent", id: selectedId } : null);
    }
  }, [pipeline.status, panel, selectedId]);

  // agente selecionado saiu da lista (troca de squad)
  useEffect(() => {
    if (selectedId && !agents.some((a) => a.id === selectedId)) {
      setSelectedId(null);
      setPanel((p) => (p?.kind === "agent" ? null : p));
      setFollowing(false);
      stageRef.current?.follow(null);
    }
  }, [agents, selectedId]);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setPanel(id ? { kind: "agent", id } : null);
    if (!id) { setFollowing(false); stageRef.current?.follow(null); }
  }, []);

  const goTo = useCallback((id: string) => {
    select(id);
    stageRef.current?.walkUserToAgent(id);
    stageRef.current?.focusAgent(id);
  }, [select]);

  const toggleFollow = useCallback(() => {
    if (!selectedId) return;
    const next = !following;
    setFollowing(next);
    stageRef.current?.follow(next ? selectedId : null);
  }, [following, selectedId]);

  const fullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  }, []);

  const onSquadChange = useCallback((id: string) => {
    setSelectedId(null);
    setPanel(null);
    setFollowing(false);
    stageRef.current?.scene()?.cancelAnimations();
    stageRef.current?.follow(null);
    setSquadId(id);
  }, [setSquadId]);

  const selectedAgent = selectedId ? agents.find((a) => a.id === selectedId) ?? null : null;
  const checkpointAgent = pipeline.checkpointAgentId ? agents.find((a) => a.id === pipeline.checkpointAgentId) ?? null : null;
  const showPanel = panel !== null && (panel.kind === "checkpoint" ? pipeline.status === "waiting_approval" && Boolean(squadId) : selectedAgent !== null);
  const panelWidth = panel?.kind === "checkpoint" ? "w-[380px]" : "w-[300px]";

  return (
    <div ref={rootRef} className="relative flex h-full w-full overflow-hidden bg-background">
      <div className="relative min-w-0 flex-1">
        <OfficeStage
          ref={stageRef}
          agents={agents}
          selectedId={selectedId}
          onSelect={select}
          handoff={handoff}
          onZoomChange={setZoom}
          onFollowLost={() => setFollowing(false)}
          onReady={setScene}
        />

        <OfficeHud
          squads={squads}
          squadId={squadId}
          onSquadChange={onSquadChange}
          agents={agents}
          pipeline={pipeline}
          demoMode={demoMode}
          compact={isNarrow}
        />

        {eventsOpen && !isNarrow && (
          <OfficeFeed
            events={events}
            onGoTo={goTo}
            onOpenCheckpoint={() => { setPanel({ kind: "checkpoint" }); if (pipeline.checkpointAgentId) { setSelectedId(pipeline.checkpointAgentId); stageRef.current?.focusAgent(pipeline.checkpointAgentId); } }}
          />
        )}

        <OfficeDock
          userName={session?.user?.name ?? "Você"}
          zoom={zoom}
          following={following}
          canFollow={selectedId !== null}
          onToggleFollow={toggleFollow}
          chatHref={squadId ? `/chat?squad=${squadId}` : "/chat"}
          eventsCount={events.filter((e) => Date.now() - e.at < 5 * 60_000).length}
          eventsOpen={eventsOpen}
          onToggleEvents={() => setEventsOpen((v) => !v)}
          minimapOpen={minimapOpen}
          onToggleMinimap={() => setMinimapOpen((v) => !v)}
          onZoomIn={() => stageRef.current?.zoomIn()}
          onZoomOut={() => stageRef.current?.zoomOut()}
          onFit={() => stageRef.current?.fit()}
          onFullscreen={fullscreen}
        />

        {minimapOpen && !isNarrow && scene && (
          <OfficeMinimap scene={scene} onPanTo={(x, y) => { setFollowing(false); stageRef.current?.panToLocal(x, y); }} />
        )}

        {!loading && squads.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto max-w-sm rounded-2xl border bg-card/95 p-6 text-center shadow-xl backdrop-blur">
              <h2 className="text-base font-semibold">Nenhum squad ainda</h2>
              <p className="mt-1 text-sm text-muted-foreground">Crie um squad pelo chat ou pelo marketplace e os agentes aparecem aqui, cada um na sua sala.</p>
            </div>
          </div>
        )}
      </div>

      {showPanel && panel && (
        <div className={cn(
          "z-20 shrink-0 border-l bg-card shadow-[-12px_0_30px_rgba(26,26,23,.06)]",
          isNarrow ? "absolute inset-y-0 right-0 w-full max-w-[380px]" : panelWidth,
        )}>
          {panel.kind === "checkpoint" && squadId ? (
            <OfficeCheckpointPanel
              squadId={squadId}
              pipeline={pipeline}
              agent={checkpointAgent}
              onClose={() => setPanel(selectedAgent ? { kind: "agent", id: selectedAgent.id } : null)}
              onResolved={() => { setPanel(null); refresh(); }}
            />
          ) : selectedAgent ? (
            <OfficeAgentPanel
              agent={selectedAgent}
              agents={agents}
              pipeline={pipeline}
              runSteps={runSteps}
              squadId={squadId}
              following={following}
              onClose={() => select(null)}
              onGoTo={() => goTo(selectedAgent.id)}
              onToggleFollow={toggleFollow}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
