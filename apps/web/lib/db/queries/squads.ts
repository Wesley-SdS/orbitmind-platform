import { eq, and, sql, count, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { squads, agents, tasks } from "@/lib/db/schema";

export async function getSquadsByOrgId(orgId: string) {
  // Get squads first
  const squadRows = await db
    .select()
    .from(squads)
    .where(and(
      eq(squads.orgId, orgId),
      ne(squads.status, "archived"),
      ne(squads.code, "system-architect"),
    ));

  // Get counts separately (avoids Drizzle subquery parameter issue)
  const agentCounts = await db
    .select({ squadId: agents.squadId, count: count() })
    .from(agents)
    .groupBy(agents.squadId);

  const taskCounts = await db
    .select({ squadId: tasks.squadId, count: count() })
    .from(tasks)
    .groupBy(tasks.squadId);

  const agentMap = new Map(agentCounts.map((r) => [r.squadId, r.count]));
  const taskMap = new Map(taskCounts.map((r) => [r.squadId, r.count]));

  return squadRows.map((s) => ({
    ...s,
    agentCount: agentMap.get(s.id) ?? 0,
    taskCount: taskMap.get(s.id) ?? 0,
  }));
}

export async function getSquadById(squadId: string) {
  const [squad] = await db
    .select()
    .from(squads)
    .where(eq(squads.id, squadId))
    .limit(1);
  return squad ?? null;
}

export async function getSquadWithAgents(squadId: string) {
  const squad = await getSquadById(squadId);
  if (!squad) return null;

  const squadAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.squadId, squadId));

  return { ...squad, agents: squadAgents };
}

export async function createSquad(data: {
  orgId: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  config?: Record<string, unknown>;
  templateId?: string;
  createdBy?: string;
}) {
  const [squad] = await db.insert(squads).values(data).returning();
  return squad!;
}

export async function updateSquad(
  squadId: string,
  data: { name?: string; description?: string; icon?: string; config?: Record<string, unknown>; status?: "active" | "paused" | "archived" },
) {
  const [updated] = await db
    .update(squads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(squads.id, squadId))
    .returning();
  return updated ?? null;
}
