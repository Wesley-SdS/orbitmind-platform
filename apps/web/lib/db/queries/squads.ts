import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { squads, agents, tasks } from "@/lib/db/schema";

export async function getSquadsByOrgId(orgId: string) {
  const rows = await db
    .select({
      id: squads.id,
      orgId: squads.orgId,
      name: squads.name,
      code: squads.code,
      description: squads.description,
      icon: squads.icon,
      config: squads.config,
      status: squads.status,
      templateId: squads.templateId,
      createdBy: squads.createdBy,
      createdAt: squads.createdAt,
      updatedAt: squads.updatedAt,
      agentCount: sql<number>`(SELECT count(*) FROM agents WHERE agents.squad_id = ${squads.id})::int`,
      taskCount: sql<number>`(SELECT count(*) FROM tasks WHERE tasks.squad_id = ${squads.id})::int`,
    })
    .from(squads)
    .where(and(eq(squads.orgId, orgId), sql`${squads.status} != 'archived'`));

  return rows;
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
