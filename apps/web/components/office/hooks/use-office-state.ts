"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DESKS, STANDING_SPOTS, colorsForAgent, deskSeat, getRoomForRole } from "@/lib/office/room-layout";
import type {
  OfficeAgent, OfficeAgentStatus, OfficeEvent, OfficeHandoff, OfficePipelineInfo, OfficeSeat,
} from "@/lib/office/types";

export interface SquadSummary {
  id: string;
  name: string;
  icon: string | null;
  agentCount: number;
}

interface AgentRow {
  id: string;
  name: string;
  role: string;
  icon: string | null;
  status: string;
  modelTier?: string;
  monthlyBudgetTokens?: number | null;
  budgetUsedTokens?: number;
}

export interface RunStep {
  id: string;
  pipelineStep: string | null;
  agentId: string;
  status: string;
  tokensUsed: number;
  durationMs: number | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

interface StepOutput {
  agentName: string;
  agentIcon: string;
  content: string;
  completedAt: string;
}

interface PipelineRunRow {
  runId: string;
  status: string;
  checkpointStepId: string | null;
  stepOutputs?: Record<string, StepOutput>;
  currentStepIndex: number;
  totalSteps: number;
  startedAt: string | null;
  pausedAt?: string | null;
  completedAt?: string | null;
}

interface StepConfig {
  step: number;
  name: string;
  type: string;
  agentId?: string;
  sourceStepId?: string;
}

const CHECKPOINT_TYPES = new Set(["checkpoint", "checkpoint-approve", "checkpoint-input", "checkpoint-select"]);
const DONE_WINDOW_MS = 90_000;
const RUN_DONE_WINDOW_MS = 150_000;
const DEMO_PATTERN: OfficeAgentStatus[] = ["working", "idle", "done", "working", "idle", "working", "idle"];
const DEMO_HANDOFF_EVERY_MS = 16_000;

function toKebab(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-");
}

function isActiveRun(run: PipelineRunRow | null): boolean {
  return run?.status === "running" || run?.status === "waiting_approval";
}

/** Distribui os agentes pelas mesas da sala do seu papel; sobrando gente, ficam em pé. */
function assignSeats(rows: AgentRow[]): Map<string, OfficeSeat> {
  const deskUsed = new Set<number>();
  const spotUsed = new Set<number>();
  const out = new Map<string, OfficeSeat>();
  let overflow = 0;
  for (const row of rows) {
    const room = getRoomForRole(row.role);
    const deskIdx = DESKS.findIndex((d, i) => d.roomId === room && !deskUsed.has(i));
    if (deskIdx >= 0) {
      deskUsed.add(deskIdx);
      out.set(row.id, deskSeat(DESKS[deskIdx]!, deskIdx));
      continue;
    }
    let spotIdx = STANDING_SPOTS.findIndex((s, i) => s.roomId === room && !spotUsed.has(i));
    if (spotIdx < 0) spotIdx = STANDING_SPOTS.findIndex((s, i) => s.roomId === "lobby" && !spotUsed.has(i));
    if (spotIdx >= 0) {
      spotUsed.add(spotIdx);
      out.set(row.id, STANDING_SPOTS[spotIdx]!);
      continue;
    }
    out.set(row.id, { roomId: "lobby", x: 20.5 + (overflow % 6) * 1.2, y: 8.0 - Math.floor(overflow / 6) * 0.9 });
    overflow++;
  }
  return out;
}

function resolveStepAgent(step: StepConfig | undefined, rows: AgentRow[]): AgentRow | null {
  if (!step || CHECKPOINT_TYPES.has(step.type) || !step.agentId) return null;
  return rows.find((a) => a.id === step.agentId) ?? rows.find((a) => toKebab(a.name) === step.agentId) ?? null;
}

interface Derived {
  statuses: Map<string, OfficeAgentStatus>;
  currentStep: Map<string, { name: string; startedAt: string }>;
  checkpointAgentId: string | null;
  demo: boolean;
}

function deriveStatuses(rows: AgentRow[], run: PipelineRunRow | null, steps: RunStep[], cfg: StepConfig[], now: number): Derived {
  const statuses = new Map<string, OfficeAgentStatus>();
  const currentStep = new Map<string, { name: string; startedAt: string }>();
  const latest = new Map<string, RunStep>();
  for (const s of steps) {
    const prev = latest.get(s.agentId);
    if (!prev || new Date(s.startedAt).getTime() > new Date(prev.startedAt).getTime()) latest.set(s.agentId, s);
  }

  let checkpointAgentId: string | null = null;
  if (run?.status === "waiting_approval") {
    const cpStep = cfg.find((s) => `step-${s.step}` === run.checkpointStepId);
    const source = cpStep?.sourceStepId ? cfg.find((s) => `step-${s.step}` === cpStep.sourceStepId) : undefined;
    const sourceAgent = resolveStepAgent(source, rows);
    if (sourceAgent) checkpointAgentId = sourceAgent.id;
    else {
      const lastDone = steps
        .filter((s) => s.status === "completed" && s.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];
      checkpointAgentId = lastDone?.agentId ?? null;
    }
  }

  const runDoneRecently = run?.status === "completed" && run.completedAt && now - new Date(run.completedAt).getTime() < RUN_DONE_WINDOW_MS;

  for (const row of rows) {
    if (row.id === checkpointAgentId) { statuses.set(row.id, "checkpoint"); continue; }
    const exec = latest.get(row.id);
    if (!exec || !isActiveRun(run) && !runDoneRecently) { statuses.set(row.id, "idle"); continue; }
    if (exec.status === "running") {
      statuses.set(row.id, "working");
      currentStep.set(row.id, { name: exec.pipelineStep ?? "Etapa em execução", startedAt: exec.startedAt });
    } else if (exec.status === "completed" && exec.completedAt && (now - new Date(exec.completedAt).getTime() < DONE_WINDOW_MS || runDoneRecently)) {
      statuses.set(row.id, "done");
    } else {
      statuses.set(row.id, "idle");
    }
  }

  const allIdle = rows.length > 0 && [...statuses.values()].every((s) => s === "idle");
  const demo = allIdle && !isActiveRun(run);
  if (demo) rows.forEach((row, i) => statuses.set(row.id, DEMO_PATTERN[i % DEMO_PATTERN.length]!));

  return { statuses, currentStep, checkpointAgentId, demo };
}

const EMPTY_PIPELINE: OfficePipelineInfo = {
  runId: null, status: "idle", currentStepIndex: 0, totalSteps: 0, currentStepName: null, startedAt: null,
  checkpointStepId: null, checkpointStepName: null, checkpointType: null, checkpointAgentId: null,
  stepOutputs: {}, sourceStepOutput: null, steps: [],
};

export function useOfficeState(initialSquadId: string | null = null) {
  const [squads, setSquads] = useState<SquadSummary[]>([]);
  const [squadId, setSquadIdState] = useState<string | null>(initialSquadId);
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [cfg, setCfg] = useState<StepConfig[]>([]);
  const [run, setRun] = useState<PipelineRunRow | null>(null);
  const [runSteps, setRunSteps] = useState<RunStep[]>([]);
  const [handoff, setHandoff] = useState<OfficeHandoff | null>(null);
  const [extraEvents, setExtraEvents] = useState<OfficeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const seenTransitions = useRef(new Set<string>());
  const primedSquad = useRef<string | null>(null);
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoStep = useRef(0);

  // squads da organização
  useEffect(() => {
    let alive = true;
    fetch("/api/squads")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SquadSummary[]) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setSquads(list);
        setSquadIdState((cur) => cur ?? list[0]?.id ?? null);
        if (list.length === 0) setLoading(false);
      })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const setSquadId = useCallback((id: string) => {
    setSquadIdState(id);
    setRun(null);
    setRunSteps([]);
    setHandoff(null);
    setExtraEvents([]);
    setLoading(true);
  }, []);

  // agentes + pipeline configurado
  const loadSquad = useCallback(async (id: string): Promise<void> => {
    const [agentsRes, squadRes] = await Promise.all([
      fetch(`/api/squads/${id}/agents`),
      fetch(`/api/squads/${id}`),
    ]);
    if (agentsRes.ok) {
      const data = (await agentsRes.json()) as AgentRow[];
      setRows(Array.isArray(data) ? data : []);
    }
    if (squadRes.ok) {
      const squad = (await squadRes.json()) as { config?: { pipeline?: StepConfig[] } };
      setCfg(Array.isArray(squad?.config?.pipeline) ? squad.config!.pipeline! : []);
    }
  }, []);

  // execução mais recente
  const loadRun = useCallback(async (id: string): Promise<void> => {
    const prRes = await fetch(`/api/squads/${id}/pipeline-run`);
    let pr: PipelineRunRow | null = null;
    if (prRes.ok) {
      const json = (await prRes.json()) as PipelineRunRow | null;
      if (json?.runId) pr = json;
    }
    let steps: RunStep[] = [];
    if (pr?.runId) {
      const detail = await fetch(`/api/squads/${id}/runs/${pr.runId}`);
      if (detail.ok) {
        const data = (await detail.json()) as { steps?: RunStep[]; pipelineRun?: Partial<PipelineRunRow> | null };
        steps = Array.isArray(data.steps) ? data.steps : [];
        if (data.pipelineRun) pr = { ...pr, ...data.pipelineRun } as PipelineRunRow;
      }
    }
    setRun(pr);
    setRunSteps(steps);
  }, []);

  useEffect(() => {
    if (!squadId) return;
    let alive = true;
    (async () => {
      try {
        await Promise.all([loadSquad(squadId), loadRun(squadId)]);
      } catch { /* rede indisponível: mantém o que tinha */ }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [squadId, loadSquad, loadRun]);

  // polling: rápido com execução ativa, lento em repouso, só com a aba visível
  const active = isActiveRun(run);
  useEffect(() => {
    if (!squadId) return;
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadRun(squadId).catch(() => {});
      setTick((t) => t + 1);
    }, active ? 3000 : 12000);
    const agentsInterval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadSquad(squadId).catch(() => {});
    }, 30000);
    return () => { clearInterval(interval); clearInterval(agentsInterval); };
  }, [squadId, active, loadRun, loadSquad]);

  const refresh = useCallback(() => {
    if (!squadId) return;
    loadRun(squadId).catch(() => {});
    loadSquad(squadId).catch(() => {});
  }, [squadId, loadRun, loadSquad]);

  // ---- derivações ----
  const seats = useMemo(() => assignSeats(rows), [rows]);

  const derived = useMemo(() => deriveStatuses(rows, run, runSteps, cfg, Date.now()), [rows, run, runSteps, cfg, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const agents: OfficeAgent[] = useMemo(() => rows.map((row) => {
    const seat = seats.get(row.id)!;
    const look = colorsForAgent(row.role, row.id);
    const step = derived.currentStep.get(row.id);
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      icon: row.icon ?? "🤖",
      status: derived.statuses.get(row.id) ?? "idle",
      roomId: seat.roomId,
      seat,
      color: look.primary,
      hair: look.hair,
      skin: look.skin,
      modelTier: row.modelTier,
      monthlyBudgetTokens: row.monthlyBudgetTokens ?? null,
      budgetUsedTokens: row.budgetUsedTokens ?? 0,
      currentStep: step?.name ?? null,
      currentStepStartedAt: step?.startedAt ?? null,
    };
  }), [rows, seats, derived]);

  const pipeline: OfficePipelineInfo = useMemo(() => {
    if (!run) return { ...EMPTY_PIPELINE, steps: cfg.map((s) => ({ step: s.step, name: s.name, type: s.type, agentId: s.agentId })), totalSteps: cfg.length };
    const cpStep = cfg.find((s) => `step-${s.step}` === run.checkpointStepId);
    const outputs = run.stepOutputs ?? {};
    let sourceOutput: string | null = null;
    if (cpStep?.sourceStepId && outputs[cpStep.sourceStepId]) sourceOutput = outputs[cpStep.sourceStepId]!.content;
    else {
      const last = Object.entries(outputs).sort(([, a], [, b]) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
      sourceOutput = last?.[1].content ?? null;
    }
    const running = runSteps.find((s) => s.status === "running");
    const currentCfg = cfg[run.currentStepIndex];
    const status = (["running", "waiting_approval", "completed", "failed", "cancelled"].includes(run.status) ? run.status : "idle") as OfficePipelineInfo["status"];
    return {
      runId: run.runId,
      status,
      currentStepIndex: run.currentStepIndex,
      totalSteps: run.totalSteps || cfg.length,
      currentStepName: running?.pipelineStep ?? currentCfg?.name ?? cpStep?.name ?? null,
      startedAt: run.startedAt,
      checkpointStepId: run.checkpointStepId,
      checkpointStepName: cpStep?.name ?? (run.checkpointStepId ? "Aprovação" : null),
      checkpointType: cpStep?.type ?? (run.checkpointStepId ? "checkpoint-approve" : null),
      checkpointAgentId: derived.checkpointAgentId,
      stepOutputs: outputs,
      sourceStepOutput: sourceOutput,
      steps: cfg.map((s) => ({ step: s.step, name: s.name, type: s.type, agentId: s.agentId })),
    };
  }, [run, runSteps, cfg, derived.checkpointAgentId]);

  // ---- handoffs detectados a partir das execuções ----
  useEffect(() => {
    if (!squadId || runSteps.length === 0 || !run) return;
    const sorted = [...runSteps].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
    const priming = primedSquad.current !== squadId;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      if (prev.agentId === cur.agentId) continue;
      const key = `${run.runId}:${cur.id}`;
      if (seenTransitions.current.has(key)) continue;
      seenTransitions.current.add(key);
      if (priming) continue;
      if (cur.status !== "running" && !(cur.status === "completed" && Date.now() - new Date(cur.startedAt).getTime() < 20_000)) continue;
      if (!rows.some((r) => r.id === prev.agentId) || !rows.some((r) => r.id === cur.agentId)) continue;
      setHandoff({ fromId: prev.agentId, toId: cur.agentId, at: Date.now() });
      const from = rows.find((r) => r.id === prev.agentId)?.name ?? "Agente";
      const to = rows.find((r) => r.id === cur.agentId)?.name ?? "Agente";
      const stepLabel = prev.pipelineStep ? cfg.find((s) => `step-${s.step}` === prev.pipelineStep)?.name ?? prev.pipelineStep : "o trabalho";
      const event: OfficeEvent = { id: key, kind: "handoff", text: `${from} entregou ${stepLabel} para ${to}`, at: Date.now(), agentId: prev.agentId };
      setExtraEvents((ev) => [event, ...ev].slice(0, 12));
    }
    primedSquad.current = squadId;
  }, [runSteps, run, rows, cfg, squadId]);

  // ---- modo demonstração: sem execução, um handoff a cada ~16 s para o escritório ter vida ----
  useEffect(() => {
    if (demoTimer.current) { clearInterval(demoTimer.current); demoTimer.current = null; }
    if (!derived.demo || agents.length < 2) return;
    demoTimer.current = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const working = agents.filter((a) => a.status === "working" || a.status === "done");
      const pool = working.length >= 2 ? working : agents;
      const from = pool[demoStep.current % pool.length]!;
      const to = pool[(demoStep.current + 1) % pool.length]!;
      demoStep.current++;
      if (from.id !== to.id) setHandoff({ fromId: from.id, toId: to.id, at: Date.now() });
    }, DEMO_HANDOFF_EVERY_MS);
    return () => { if (demoTimer.current) clearInterval(demoTimer.current); };
  }, [derived.demo, agents]);

  // ---- feed de eventos ----
  const events: OfficeEvent[] = useMemo(() => {
    const byId = new Map(rows.map((r) => [r.id, r] as const));
    const stepNames = new Map<string, string>(cfg.map((s) => [`step-${s.step}`, s.name]));
    const list: OfficeEvent[] = [...extraEvents];
    for (const s of runSteps) {
      const name = byId.get(s.agentId)?.name ?? "Agente";
      const stepName = s.pipelineStep ? stepNames.get(s.pipelineStep) ?? s.pipelineStep : "etapa";
      if (s.status === "completed" && s.completedAt) list.push({ id: `${s.id}:done`, kind: "done", text: `${name} concluiu ${stepName}`, at: new Date(s.completedAt).getTime(), agentId: s.agentId });
      else if (s.status === "running") list.push({ id: `${s.id}:start`, kind: "start", text: `${name} está trabalhando em ${stepName}`, at: new Date(s.startedAt).getTime(), agentId: s.agentId });
      else if (s.status === "failed") list.push({ id: `${s.id}:failed`, kind: "failed", text: `${name} falhou em ${stepName}${s.error ? `: ${s.error.slice(0, 80)}` : ""}`, at: new Date(s.startedAt).getTime(), agentId: s.agentId });
    }
    if (run?.status === "waiting_approval") {
      const who = derived.checkpointAgentId ? byId.get(derived.checkpointAgentId)?.name : null;
      list.push({ id: `${run.runId}:cp`, kind: "checkpoint", text: `${who ?? "O squad"} aguarda sua aprovação${pipeline.checkpointStepName ? `: ${pipeline.checkpointStepName}` : ""}`, at: run.pausedAt ? new Date(run.pausedAt).getTime() : Date.now(), agentId: derived.checkpointAgentId ?? undefined });
    }
    if (run?.status === "completed" && run.completedAt) list.push({ id: `${run.runId}:end`, kind: "info", text: "Pipeline concluído", at: new Date(run.completedAt).getTime() });
    if (run?.status === "failed") list.push({ id: `${run.runId}:fail`, kind: "failed", text: "Pipeline falhou", at: run.completedAt ? new Date(run.completedAt).getTime() : Date.now() });
    list.sort((a, b) => b.at - a.at);
    const seen = new Set<string>();
    return list.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true))).slice(0, 8);
  }, [runSteps, run, rows, cfg, extraEvents, derived.checkpointAgentId, pipeline.checkpointStepName]);

  const squad = squads.find((s) => s.id === squadId) ?? null;

  return { squads, squad, squadId, setSquadId, agents, runSteps, pipeline, events, handoff, demoMode: derived.demo, loading, refresh };
}

export type OfficeState = ReturnType<typeof useOfficeState>;
