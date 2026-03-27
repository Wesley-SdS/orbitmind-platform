"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionLoader } from "@/components/ui/page-loader";
import { PipelineChat } from "./pipeline-chat";
import { PipelineStepsView } from "./pipeline-view";

interface PipelineStep {
  step: number;
  name: string;
  type: string;
  agentId?: string;
}

interface Agent {
  id: string;
  name: string;
  icon: string | null;
}

interface RunStep {
  pipelineStep: string | null;
  status: string;
  agentId: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  tokensUsed: number;
  error: string | null;
}

interface PipelineRun {
  runId: string;
  status: string;
  checkpointStepId: string | null;
  stepOutputs: Record<string, { agentName: string; agentIcon: string; content: string; completedAt: string }>;
}

interface PipelineSectionProps {
  squadId: string;
  pipeline: PipelineStep[];
  agents: Agent[];
}

export function PipelineSection({ squadId, pipeline, agents }: PipelineSectionProps) {
  const [latestRun, setLatestRun] = useState<RunStep[] | null>(null);
  const [pipelineRun, setPipelineRun] = useState<PipelineRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveRun, setHasActiveRun] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/squads/${squadId}/runs`);
      if (!res.ok) return;
      const runs = await res.json();
      if (!Array.isArray(runs) || runs.length === 0) {
        setLatestRun(null);
        setPipelineRun(null);
        setHasActiveRun(false);
        return;
      }

      const latest = runs[0];
      if (!latest.runId) return;

      const execRes = await fetch(`/api/squads/${squadId}/runs/${latest.runId}`);
      if (!execRes.ok) return;
      const data = await execRes.json();
      const steps = data.steps ?? data;
      const prData = data.pipelineRun ?? null;

      setLatestRun(Array.isArray(steps) ? steps : null);
      setPipelineRun(prData);
      const isRunning = Array.isArray(steps) && steps.some((s: RunStep) => s.status === "running");
      setHasActiveRun(isRunning);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [squadId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Listen for pipeline-started event
  useEffect(() => {
    const handler = () => {
      setHasActiveRun(true);
      const polls = [1000, 3000, 5000, 8000, 12000, 16000, 20000, 25000, 30000, 40000, 50000, 60000];
      polls.forEach(ms => setTimeout(loadData, ms));
    };
    window.addEventListener("pipeline-started", handler);
    return () => window.removeEventListener("pipeline-started", handler);
  }, [loadData]);

  // Poll while active (running only, not waiting_approval)
  useEffect(() => {
    if (!hasActiveRun) return;
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [hasActiveRun, loadData]);

  if (loading) return <SectionLoader text="Carregando pipeline..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      <PipelineStepsView
        pipeline={pipeline}
        agents={agents}
        latestRun={latestRun}
        pipelineRun={pipelineRun}
        squadId={squadId}
        onRefresh={loadData}
      />
      <PipelineChat
        squadId={squadId}
        pipeline={pipeline}
        stepOutputs={pipelineRun?.stepOutputs ?? {}}
        runStatus={pipelineRun?.status ?? null}
      />
    </div>
  );
}
