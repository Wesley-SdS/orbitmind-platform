import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

export async function getTasksBySquadId(
  squadId: string,
  filters?: { status?: string; priority?: string; type?: string; assignedAgentId?: string },
) {
  const conditions = [eq(tasks.squadId, squadId)];

  if (filters?.status) {
    conditions.push(eq(tasks.status, filters.status as typeof tasks.status.enumValues[number]));
  }
  if (filters?.priority) {
    conditions.push(eq(tasks.priority, filters.priority as typeof tasks.priority.enumValues[number]));
  }
  if (filters?.type) {
    conditions.push(eq(tasks.type, filters.type as typeof tasks.type.enumValues[number]));
  }
  if (filters?.assignedAgentId) {
    conditions.push(eq(tasks.assignedAgentId, filters.assignedAgentId));
  }

  return db.select().from(tasks).where(and(...conditions));
}

export async function getTaskById(taskId: string) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  return task ?? null;
}

export async function createTask(data: {
  squadId: string;
  title: string;
  description?: string;
  status?: "backlog" | "ready" | "in_progress" | "in_review" | "done" | "blocked";
  priority?: "p0" | "p1" | "p2" | "p3";
  type?: "feature" | "fix" | "content" | "research" | "review";
  assignedAgentId?: string;
  metadata?: Record<string, unknown>;
}) {
  const [task] = await db.insert(tasks).values(data).returning();
  return task!;
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: "backlog" | "ready" | "in_progress" | "in_review" | "done" | "blocked";
    priority?: "p0" | "p1" | "p2" | "p3";
    type?: "feature" | "fix" | "content" | "research" | "review";
    assignedAgentId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.status === "done") {
    updateData.completedAt = new Date();
  }

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(eq(tasks.id, taskId))
    .returning();
  return updated ?? null;
}

export async function deleteTask(taskId: string) {
  await db.delete(tasks).where(eq(tasks.id, taskId));
}
