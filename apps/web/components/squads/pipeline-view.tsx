"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLoader } from "@/components/ui/page-loader";
import { CheckCircle2, Circle, Loader2, XCircle, User } from "lucide-react";

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

interface PipelineViewProps {
  squadId: string;
  pipeline: PipelineStep[];
  agents: Agent[];
}

type StepStatus = "done" | "running" | "failed" | "pending";

export function PipelineView({ squadId, pipeline, agents }: PipelineViewProps) {
  const [latestRun, setLatestRun] = useState<RunStep[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveRun, setHasActiveRun] = useState(false);

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const loadLatestRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/squads/${squadId}/runs`);
      if (!res.ok) return;
      const runs = await res.json();
      if (!Array.isArray(runs) || runs.length === 0) {
        setLatestRun(null);
        setHasActiveRun(false);
        return;
      }

      const latest = runs[0];
      if (!latest.runId) {
        setLatestRun(null);
        setHasActiveRun(false);
        return;
      }

      // Fetch individual executions for this run
      const execRes = await fetch(`/api/squads/${squadId}/runs/${latest.runId}`);
      if (execRes.ok) {
        const steps = await execRes.json();
        setLatestRun(Array.isArray(steps) ? steps : null);
        setHasActiveRun(steps.some((s: RunStep) => s.status === "running"));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [squadId]);

  useEffect(() => {
    loadLatestRun();
  }, [loadLatestRun]);

  // Poll while there's an active run
  useEffect(() => {
    if (!hasActiveRun) return;
    const interval = setInterval(loadLatestRun, 5000);
    return () => clearInterval(interval);
  }, [hasActiveRun, loadLatestRun]);

  if (loading) return <SectionLoader text="Carregando pipeline..." />;

  if (pipeline.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12 text-muted-foreground">
          Nenhum pipeline configurado para este squad.
        </CardContent>
      </Card>
    );
  }

  // Map execution status to each pipeline step
  const runMap = new Map<string, RunStep>();
  if (latestRun) {
    for (const exec of latestRun) {
      if (exec.pipelineStep) {
        runMap.set(exec.pipelineStep, exec);
      }
    }
  }

  function getStepStatus(step: PipelineStep): StepStatus {
    const exec = runMap.get(`step-${step.step}`);
    if (!exec) return "pending";
    if (exec.status === "completed") return "done";
    if (exec.status === "running") return "running";
    if (exec.status === "failed") return "failed";
    return "pending";
  }

  function toKebab(s: string): string {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
  }

  function resolveAgent(step: PipelineStep): Agent | null {
    if (step.type === "checkpoint") return null;
    if (!step.agentId) return null;
    // Try direct UUID match
    const direct = agentMap.get(step.agentId);
    if (direct) return direct;
    // Fallback: match kebab-case to agent name (accent-insensitive)
    const found = agents.find(a => toKebab(a.name) === step.agentId);
    return found ?? null;
  }

  function getAgentName(step: PipelineStep): string {
    if (step.type === "checkpoint") return "Humano";
    return resolveAgent(step)?.name ?? "Agente";
  }

  function getAgentIcon(step: PipelineStep): string {
    if (step.type === "checkpoint") return "👤";
    return resolveAgent(step)?.icon ?? "🤖";
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {pipeline.map((step, i) => {
            const status = getStepStatus(step);
            const exec = runMap.get(`step-${step.step}`);

            return (
              <div key={step.step} className="flex w-full max-w-md flex-col items-center">
                <div
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 ${
                    status === "running"
                      ? "border-primary bg-primary/5"
                      : status === "done"
                        ? "border-green-500/30 bg-green-500/5"
                        : status === "failed"
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-border"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      status === "done"
                        ? "bg-green-500 text-white"
                        : status === "running"
                          ? "bg-primary text-primary-foreground"
                          : status === "failed"
                            ? "bg-red-500 text-white"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : status === "running" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : status === "failed" ? (
                      <XCircle className="h-4 w-4" />
                    ) : step.type === "checkpoint" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span>{getAgentIcon(step)} {getAgentName(step)}</span>
                      {exec?.durationMs != null && (
                        <span className="ml-2 text-[10px]">
                          ({Math.round(exec.durationMs / 1000)}s)
                        </span>
                      )}
                    </p>
                  </div>
                  {status === "running" && (
                    <Badge className="bg-primary/10 text-primary">Em andamento</Badge>
                  )}
                  {status === "failed" && (
                    <Badge variant="destructive" className="text-[10px]">Falhou</Badge>
                  )}
                  {status === "done" && exec?.tokensUsed ? (
                    <span className="text-[10px] text-muted-foreground">
                      {exec.tokensUsed.toLocaleString()} tokens
                    </span>
                  ) : null}
                </div>
                {i < pipeline.length - 1 && (
                  <div className="h-4 w-px bg-border" />
                )}
              </div>
            );
          })}
        </div>
        {!latestRun && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Nenhuma execução ainda. Clique em Executar ou configure um agendamento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
