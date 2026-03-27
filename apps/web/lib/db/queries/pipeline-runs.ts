import { db } from "@/lib/db";
import { pipelineRuns } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function createPipelineRun(data: {
  squadId: string;
  orgId: string;
  runId: string;
  totalSteps: number;
  pipelineConfig?: unknown;
}) {
  const [row] = await db
    .insert(pipelineRuns)
    .values({
      squadId: data.squadId,
      orgId: data.orgId,
      runId: data.runId,
      totalSteps: data.totalSteps,
      pipelineConfig: data.pipelineConfig ?? null,
    })
    .returning();
  return row!;
}

export async function getPipelineRun(runId: string) {
  const [row] = await db
    .select()
    .from(pipelineRuns)
    .where(eq(pipelineRuns.runId, runId))
    .limit(1);
  return row ?? null;
}

export async function getPipelineRunById(id: string) {
  const [row] = await db
    .select()
    .from(pipelineRuns)
    .where(eq(pipelineRuns.id, id))
    .limit(1);
  return row ?? null;
}

export async function getPipelineRunByRunIdAndSquad(runId: string, squadId: string) {
  const [row] = await db
    .select()
    .from(pipelineRuns)
    .where(and(eq(pipelineRuns.runId, runId), eq(pipelineRuns.squadId, squadId)))
    .limit(1);
  return row ?? null;
}

export async function getLatestPipelineRun(squadId: string) {
  const [row] = await db
    .select()
    .from(pipelineRuns)
    .where(eq(pipelineRuns.squadId, squadId))
    .orderBy(desc(pipelineRuns.startedAt))
    .limit(1);
  return row ?? null;
}

export async function updatePipelineRun(
  runId: string,
  data: {
    status?: "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
    currentStepIndex?: number;
    checkpointStepId?: string | null;
    stepOutputs?: unknown;
    pausedAt?: Date | null;
    completedAt?: Date | null;
    approvedBy?: string | null;
    approvedAt?: Date | null;
  },
) {
  await db
    .update(pipelineRuns)
    .set(data)
    .where(eq(pipelineRuns.runId, runId));
}

export async function saveStepOutput(
  runId: string,
  stepId: string,
  output: { agentName: string; agentIcon: string; content: string; completedAt: string },
) {
  const run = await getPipelineRun(runId);
  if (!run) return;

  const existing = (run.stepOutputs ?? {}) as Record<string, unknown>;
  const updated = { ...existing, [stepId]: output };

  await db
    .update(pipelineRuns)
    .set({ stepOutputs: updated })
    .where(eq(pipelineRuns.runId, runId));
}
