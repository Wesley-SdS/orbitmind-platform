import { eq, desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import { executions } from "@/lib/db/schema";
import { CacheTags } from "@/lib/cache";

// ---------------------------------------------------------------------------
// Uncached variants
// ---------------------------------------------------------------------------

export async function _uncachedGetExecutionsBySquadId(squadId: string, limit = 20) {
  return db
    .select()
    .from(executions)
    .where(eq(executions.squadId, squadId))
    .orderBy(desc(executions.startedAt))
    .limit(limit);
}

export async function _uncachedGetExecutionsByAgentId(agentId: string, limit = 20) {
  return db
    .select()
    .from(executions)
    .where(eq(executions.agentId, agentId))
    .orderBy(desc(executions.startedAt))
    .limit(limit);
}

export async function _uncachedGetExecutionById(executionId: string) {
  const [execution] = await db
    .select()
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);
  return execution ?? null;
}

// ---------------------------------------------------------------------------
// Cached variants
// ---------------------------------------------------------------------------

export const getExecutionsBySquadId = cache((squadId: string, limit = 20) =>
  unstable_cache(
    () => _uncachedGetExecutionsBySquadId(squadId, limit),
    ["executions-by-squad", squadId, String(limit)],
    { tags: [CacheTags.executions(squadId)], revalidate: 30 },
  )(),
);

export const getExecutionsByAgentId = cache((agentId: string, limit = 20) =>
  unstable_cache(
    () => _uncachedGetExecutionsByAgentId(agentId, limit),
    ["executions-by-agent", agentId, String(limit)],
    { tags: [`executions-agent-${agentId}`], revalidate: 30 },
  )(),
);

export const getExecutionById = cache((executionId: string) =>
  unstable_cache(
    () => _uncachedGetExecutionById(executionId),
    ["execution-by-id", executionId],
    { tags: [`execution-${executionId}`], revalidate: 60 },
  )(),
);

// ---------------------------------------------------------------------------
// Mutations (not cached)
// ---------------------------------------------------------------------------

export async function createExecution(data: {
  squadId: string;
  agentId: string;
  taskId?: string;
  pipelineStep?: string;
  status?: "running" | "completed" | "failed" | "cancelled";
  inputData?: Record<string, unknown>;
  runId?: string;
  version?: number;
}) {
  const [execution] = await db.insert(executions).values(data).returning();
  return execution!;
}

export async function updateExecution(
  executionId: string,
  data: {
    status?: "running" | "completed" | "failed" | "cancelled";
    outputData?: Record<string, unknown>;
    tokensUsed?: number;
    estimatedCost?: number;
    durationMs?: number;
    completedAt?: Date;
    error?: string;
  },
) {
  const [updated] = await db
    .update(executions)
    .set(data)
    .where(eq(executions.id, executionId))
    .returning();
  return updated ?? null;
}
