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

export async function getExecutionById(executionId: string) {
  const [execution] = await db
    .select()
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);
  return execution ?? null;
}
