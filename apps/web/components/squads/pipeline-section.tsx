"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionLoader } from "@/components/ui/page-loader";
import { PipelineChat } from "./pipeline-chat";
import { PipelineStepsView } from "./pipeline-view";
import { CheckpointReview } from "./checkpoint-review";

interface CheckpointField {
  name: string;
  label: string;
  type: string;
  options?: string[];
}

interface PipelineStep {
  step: number;
  name: string;
  type: string;
  agentId?: string;
  sourceStepId?: string;
  checkpointFields?: CheckpointField[];
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
      // Always fetch the latest pipeline run (includes waiting_approval checkpoints)
      const prRes = await fetch(`/api/squads/${squadId}/pipeline-run`);
      let prData: PipelineRun | null = null;
      if (prRes.ok) {
        const prJson = await prRes.json();
        if (prJson?.runId) prData = prJson;
      }

      // Fetch execution steps if we have a runId
      let steps: RunStep[] | null = null;
      if (prData?.runId) {
        const execRes = await fetch(`/api/squads/${squadId}/runs/${prData.runId}`);
        if (execRes.ok) {
          const data = await execRes.json();
          const execSteps = data.steps ?? data;
          steps = Array.isArray(execSteps) ? execSteps : null;
          // Merge pipelineRun from detail endpoint if available
          if (data.pipelineRun) prData = { ...prData, ...data.pipelineRun };
        }
      } else {
        // Fallback: try executions list for older runs without pipeline_runs record
        const res = await fetch(`/api/squads/${squadId}/runs`);
        if (res.ok) {
          const runs = await res.json();
          if (Array.isArray(runs) && runs.length > 0 && runs[0].runId) {
            const execRes = await fetch(`/api/squads/${squadId}/runs/${runs[0].runId}`);
            if (execRes.ok) {
              const data = await execRes.json();
              steps = Array.isArray(data.steps) ? data.steps : Array.isArray(data) ? data : null;
              if (data.pipelineRun) prData = data.pipelineRun;
            }
          }
        }
      }

      setLatestRun(steps);
      setPipelineRun(prData);
      const isRunning = steps?.some((s: RunStep) => s.status === "running") ?? false;
      const isWaiting = prData?.status === "waiting_approval" || prData?.status === "running";
      setHasActiveRun(isRunning || isWaiting);
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

  const isWaitingApproval = pipelineRun?.status === "waiting_approval";

  return (
    <div className="space-y-6">
      {isWaitingApproval && pipelineRun && (() => {
        const checkpointStep = pipeline.find(s => `step-${s.step}` === pipelineRun.checkpointStepId);
        const checkpointType = checkpointStep?.type ?? "checkpoint-approve";
        const sourceOutput = checkpointStep?.sourceStepId
          ? pipelineRun.stepOutputs[checkpointStep.sourceStepId]?.content
          : undefined;
        return (
          <CheckpointReview
            squadId={squadId}
            runId={pipelineRun.runId}
            checkpointStepName={checkpointStep?.name ?? "Checkpoint"}
            checkpointType={checkpointType}
            stepOutputs={pipelineRun.stepOutputs}
            sourceStepOutput={sourceOutput}
            checkpointFields={checkpointStep?.checkpointFields}
            onApproved={loadData}
            onRejected={loadData}
          />
        );
      })()}
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
    </div>
  );
}
