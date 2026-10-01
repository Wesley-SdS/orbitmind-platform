"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useOfficeState, type OfficeState } from "./hooks/use-office-state";
import { OfficeStage, type OfficeCallout, type OfficeStageHandle } from "./office-stage";
import { CheckpointHud, OfficeHud } from "./office-hud";
import { OfficeDock } from "./office-dock";
import { OfficeFeed } from "./office-feed";
import { OfficeMinimap } from "./office-minimap";
import { OfficeAgentPanel } from "./office-agent-panel";
import { OfficeCheckpointPanel } from "./office-checkpoint-panel";
import { OfficeMobile } from "./office-mobile";
import { OfficeViewControls } from "./office-view-controls";
import { OfficeAudio } from "@/lib/office/audio";
import { digestReview } from "@/lib/office/review-parse";
import { roomName } from "@/lib/office/room-layout";
import { CHECKPOINT_SCALE, ZOOM_UNIT } from "@/lib/office/camera";
import type { OfficeScene } from "@/lib/office/iso/office-scene";
import { cn } from "@/lib/utils";

type Panel = { kind: "agent"; id: string } | { kind: "checkpoint" } | null;

const SOUND_KEY = "orbitmind.office.sound";
const ROTATION_KEY = "orbitmind.office.rotation";

function readRotation(): number {
  try {
    const r = Number(localStorage.getItem(ROTATION_KEY) ?? 0);
    return Number.isInteger(r) && r >= 0 && r <= 3 ? r : 0;
  } catch {
    return 0;
  }
}

function saveRotation(r: number): void {
  try { localStorage.setItem(ROTATION_KEY, String(r)); } catch { /* sem storage */ }
}

function useMediaQuery(query: string): boolean {
  // o escritório só renderiza no navegador (ssr: false): ler já na montagem evita montar o Pixi duas vezes
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = (): void => setMatch(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [query]);
  return match;
}

/** Escritório virtual com dados reais do squad (polling + WebSocket). */
export default function VirtualOffice() {
  // /office?squad=<id> abre direto num squad (links do chat, da página do squad…)
  const [initialSquad] = useState(() => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("squad")));
  const state = useOfficeState(initialSquad);
  const { data: session } = useSession();
  return <VirtualOfficeView state={state} userName={session?.user?.name ?? "Você"} />;
}

interface VirtualOfficeViewProps {
  state: OfficeState;
  userName: string;
  /** Painel aberto ao montar (QA visual). */
  initialPanel?: Panel;
}

/**
 * Cena isométrica + HUD + painel lateral. Três modos, como nas pranchas do
 * design: visão geral (01), zoom no checkpoint com painel de aprovação (02) e
 * celular (04).
 */
export function VirtualOfficeView({ state, userName, initialPanel = null }: VirtualOfficeViewProps) {
  const { agents: baseAgents, pipeline, events, handoff, squads, squadId, setSquadId, runSteps, demoMode, loading, refresh } = state;
  // enquanto caminha com o documento, o agente do handoff aparece como "entregando"
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  useEffect(() => { if (handoff) setDeliveringId(handoff.fromId); }, [handoff]);
  const agents = useMemo(
    () => (deliveringId ? baseAgents.map((a) => (a.id === deliveringId && a.status !== "checkpoint" ? { ...a, status: "delivering" as const } : a)) : baseAgents),
    [baseAgents, deliveringId],
  );
  const stageRef = useRef<OfficeStageHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<OfficeAudio | null>(null);
  const [scene, setScene] = useState<OfficeScene | null>(null);
  const [sceneVersion, setSceneVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(initialPanel?.kind === "agent" ? initialPanel.id : null);
  const [panel, setPanel] = useState<Panel>(initialPanel);
  const [zoom, setZoom] = useState(1);
  const [following, setFollowing] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(true);
  const [minimapOpen, setMinimapOpen] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [initialRotation] = useState(readRotation);
  const isNarrow = useMediaQuery("(max-width: 1100px)");
  const autoOpenedRun = useRef<string | null>(null);
  const lastPipelineStatus = useRef<string | null>(null);

  const checkpointAgent = pipeline.checkpointAgentId ? agents.find((a) => a.id === pipeline.checkpointAgentId) ?? null : null;
  const checkpointMode = panel?.kind === "checkpoint" && pipeline.status === "waiting_approval" && Boolean(squadId);

  // ---- som ambiente (só liga com gesto do usuário; a preferência fica salva) ----
  useEffect(() => {
    audioRef.current = new OfficeAudio();
    return () => { audioRef.current?.destroy(); audioRef.current = null; };
  }, []);
  const toggleSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setSoundOn((cur) => {
      const next = !cur;
      try { localStorage.setItem(SOUND_KEY, next ? "1" : "0"); } catch { /* sem storage */ }
      if (next) void audio.enable(); else audio.disable();
      return next;
    });
  }, []);
  useEffect(() => {
    let wants = false;
    try { wants = localStorage.getItem(SOUND_KEY) === "1"; } catch { wants = false; }
    if (!wants) return;
    // navegadores exigem um gesto: religa no primeiro clique/toque na página
    const once = (): void => {
      if (!audioRef.current) return;
      setSoundOn(true);
      void audioRef.current.enable();
      window.removeEventListener("pointerdown", once);
    };
    window.addEventListener("pointerdown", once);
    return () => window.removeEventListener("pointerdown", once);
  }, []);
  useEffect(() => {
    audioRef.current?.setWorking(agents.filter((a) => a.status === "working").length);
  }, [agents]);
  useEffect(() => {
    if (pipeline.status === "waiting_approval" && lastPipelineStatus.current !== "waiting_approval") audioRef.current?.chime();
    lastPipelineStatus.current = pipeline.status;
  }, [pipeline.status]);
  useEffect(() => {
    if (handoff) audioRef.current?.whoosh();
  }, [handoff]);

  // ---- câmera no modo checkpoint: 200% na sala, e você caminha até quem espera a decisão ----
  const cameraMode = useRef<"overview" | "checkpoint">("overview");
  useEffect(() => {
    if (!scene) return;
    if (checkpointMode && cameraMode.current !== "checkpoint" && pipeline.checkpointAgentId) {
      cameraMode.current = "checkpoint";
      setFollowing(false);
      stageRef.current?.follow(null);
      stageRef.current?.focusAgent(pipeline.checkpointAgentId, CHECKPOINT_SCALE);
      stageRef.current?.walkUserToAgent(pipeline.checkpointAgentId);
    } else if (!checkpointMode && cameraMode.current === "checkpoint") {
      cameraMode.current = "overview";
      stageRef.current?.fit();
    }
  }, [checkpointMode, scene, pipeline.checkpointAgentId]);

  // checkpoint novo → abre o painel de aprovação uma vez por execução
  useEffect(() => {
    if (pipeline.status !== "waiting_approval" || !pipeline.runId) return;
    if (autoOpenedRun.current === pipeline.runId) return;
    autoOpenedRun.current = pipeline.runId;
    setPanel({ kind: "checkpoint" });
    if (pipeline.checkpointAgentId) setSelectedId(pipeline.checkpointAgentId);
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

  const openCheckpoint = useCallback(() => {
    setPanel({ kind: "checkpoint" });
    if (pipeline.checkpointAgentId) setSelectedId(pipeline.checkpointAgentId);
  }, [pipeline.checkpointAgentId]);

  const backToOverview = useCallback(() => {
    setPanel(null);
    setSelectedId(null);
  }, []);

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

  // atalhos: Q/E (ou R) giram a câmera, 0 ajusta à tela, M liga o som, Esc fecha o painel
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "r" || e.key === "R" || e.key === "e" || e.key === "E") stageRef.current?.rotate(1);
      else if (e.key === "q" || e.key === "Q") stageRef.current?.rotate(-1);
      else if (e.key === "0") stageRef.current?.fit();
      else if (e.key === "m" || e.key === "M") toggleSound();
      else if (e.key === "Escape" && panel) { if (panel.kind === "checkpoint") backToOverview(); else select(null); }
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, toggleSound, backToOverview, select]);

  const selectedAgent = selectedId ? agents.find((a) => a.id === selectedId) ?? null : null;
  const recentEvents = events.filter((e) => Date.now() - e.at < 5 * 60_000).length;
  const chatHref = squadId ? `/chat?squad=${squadId}` : "/chat";

  const callout: OfficeCallout | null = useMemo(() => {
    if (!checkpointMode || !checkpointAgent) return null;
    return { agentId: checkpointAgent.id, title: "Preciso da sua aprovação", text: digestReview(pipeline.sourceStepOutput).summary ?? (pipeline.checkpointStepName ? `${pipeline.checkpointStepName} está pronta para sua revisão.` : null) };
  }, [checkpointMode, checkpointAgent, pipeline.sourceStepOutput, pipeline.checkpointStepName]);

  const panelNode = panel?.kind === "checkpoint" && squadId && pipeline.status === "waiting_approval" ? (
    <OfficeCheckpointPanel
      squadId={squadId}
      pipeline={pipeline}
      agent={checkpointAgent}
      agents={agents}
      onClose={isMobile ? () => setPanel(null) : undefined}
      onResolved={() => { setPanel(null); refresh(); }}
    />
  ) : panel?.kind === "agent" && selectedAgent ? (
    <OfficeAgentPanel
      agent={selectedAgent}
      agents={agents}
      pipeline={pipeline}
      runSteps={runSteps}
      squadId={squadId}
      onClose={() => select(null)}
      onGoTo={() => goTo(selectedAgent.id)}
    />
  ) : null;

  if (isMobile) {
    return (
      <div ref={rootRef} className="relative h-full w-full overflow-hidden">
        <OfficeMobile
          ref={stageRef}
          squads={squads}
          squadId={squadId}
          onSquadChange={onSquadChange}
          agents={agents}
          pipeline={pipeline}
          demoMode={demoMode}
          handoff={handoff}
          selectedId={selectedId}
          eventsCount={recentEvents}
          chatHref={chatHref}
          onSelectAgent={(id) => select(id)}
          onOpenCheckpoint={openCheckpoint}
          onOpenEvents={() => { const cp = events.find((e) => e.kind === "checkpoint"); if (cp) openCheckpoint(); else if (events[0]?.agentId) select(events[0].agentId); }}
          onZoomChange={(z) => setZoom(z / ZOOM_UNIT)}
          onReady={setScene}
          onHandoffDone={() => setDeliveringId(null)}
          initialRotation={initialRotation}
          onRotationChange={saveRotation}
          onRotate={() => stageRef.current?.rotate(1)}
        />
        {panelNode && <div className="absolute inset-0 z-30 bg-[#fbfaf7] dark:bg-[#1e1d1a]">{panelNode}</div>}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative flex h-full w-full overflow-hidden bg-[#f3f1ec] dark:bg-[#141413]">
      <div className="relative min-w-0 flex-1">
        <OfficeStage
          ref={stageRef}
          agents={agents}
          selectedId={selectedId}
          onSelect={select}
          handoff={handoff}
          callout={callout}
          onlyRoomId={checkpointMode ? checkpointAgent?.roomId ?? null : null}
          onZoomChange={(z) => setZoom(z / ZOOM_UNIT)}
          onFollowLost={() => setFollowing(false)}
          onReady={setScene}
          onFootstep={() => audioRef.current?.footstep()}
          onRebuild={() => setSceneVersion((v) => v + 1)}
          onHandoffDone={() => setDeliveringId(null)}
          initialRotation={initialRotation}
          onRotationChange={saveRotation}
        />

        {checkpointMode ? (
          <CheckpointHud roomName={checkpointAgent ? roomName(checkpointAgent.roomId) : "Checkpoint"} zoom={zoom} onBack={backToOverview} />
        ) : (
          <OfficeHud squads={squads} squadId={squadId} onSquadChange={onSquadChange} agents={agents} pipeline={pipeline} demoMode={demoMode} />
        )}

        {eventsOpen && !checkpointMode && (
          <OfficeFeed
            events={events}
            checkpointAgentName={checkpointAgent?.name.split(" ")[0] ?? null}
            onSelectAgent={(id) => select(id)}
            onGoToCheckpoint={openCheckpoint}
          />
        )}

        <OfficeDock
          userName={userName}
          zoom={zoom}
          following={following}
          canFollow={selectedId !== null}
          onToggleFollow={toggleFollow}
          chatHref={chatHref}
          chatActive={checkpointMode}
          eventsCount={recentEvents}
          eventsOpen={eventsOpen}
          onToggleEvents={() => setEventsOpen((v) => !v)}
          minimapOpen={minimapOpen}
          onToggleMinimap={() => setMinimapOpen((v) => !v)}
          onZoomIn={() => stageRef.current?.zoomIn()}
          onZoomOut={() => stageRef.current?.zoomOut()}
          onFit={() => stageRef.current?.fit()}
          onFullscreen={fullscreen}
        />

        {!checkpointMode && (
          <OfficeViewControls
            soundOn={soundOn}
            onToggleSound={toggleSound}
            onRotate={(d) => stageRef.current?.rotate(d)}
            bottom={minimapOpen && scene ? 142 : 16}
          />
        )}

        {minimapOpen && !checkpointMode && scene && (
          <OfficeMinimap key={sceneVersion} scene={scene} onPanTo={(x, y) => { setFollowing(false); stageRef.current?.panToLocal(x, y); }} />
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

      {panelNode && (
        <div className={cn(
          "z-20 shrink-0 border-l border-[#1a1a17]/10 shadow-[-12px_0_30px_rgba(26,26,23,.06)] dark:border-white/10",
          isNarrow ? "absolute inset-y-0 right-0 w-full max-w-[380px]" : panel?.kind === "checkpoint" ? "w-[380px]" : "w-[300px]",
        )}>
          {panelNode}
        </div>
      )}
    </div>
  );
}
