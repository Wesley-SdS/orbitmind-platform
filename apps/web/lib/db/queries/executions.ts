import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { executions } from "@/lib/db/schema";

export async function getExecutionsBySquadId(squadId: string, limit = 20) {
  return db
    .select()
    .from(executions)
    .where(eq(executions.squadId, squadId))
    .orderBy(desc(executions.startedAt))
    .limit(limit);
}

export async function getExecutionsByAgentId(agentId: string, limit = 20) {
  return db
    .select()
    .from(executions)
    .where(eq(executions.agentId, agentId))
    .orderBy(desc(executions.startedAt))
    .limit(limit);
}

export async function getExecutionById(executionId: string) {
  const [execution] = await db
    .select()
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);
  return execution ?? null;
}

export async function createExecution(data: {
  squadId: string;
  agentId: string;
  taskId?: string;
  pipelineStep?: string;
  status?: "running" | "completed" | "failed" | "cancelled";
  inputData?: Record<string, unknown>;
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
