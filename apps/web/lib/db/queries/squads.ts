import { eq, and, sql, count, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import { squads, agents, tasks } from "@/lib/db/schema";
import { CacheTags } from "@/lib/cache";

// ---------------------------------------------------------------------------
// Uncached variants (use after mutations that need fresh data)
// ---------------------------------------------------------------------------

export async function _uncachedGetSquadsByOrgId(orgId: string) {
  const [squadRows, agentCounts, taskCounts] = await Promise.all([
    db
      .select()
      .from(squads)
      .where(and(
        eq(squads.orgId, orgId),
        ne(squads.status, "archived"),
        ne(squads.code, "system-architect"),
      )),
    db
      .select({ squadId: agents.squadId, count: count() })
      .from(agents)
      .groupBy(agents.squadId),
    db
      .select({ squadId: tasks.squadId, count: count() })
      .from(tasks)
      .groupBy(tasks.squadId),
  ]);

  const agentMap = new Map(agentCounts.map((r) => [r.squadId, r.count]));
  const taskMap = new Map(taskCounts.map((r) => [r.squadId, r.count]));

  return squadRows.map((s) => ({
    ...s,
    agentCount: agentMap.get(s.id) ?? 0,
    taskCount: taskMap.get(s.id) ?? 0,
  }));
}

export async function _uncachedGetSquadById(squadId: string) {
  const [squad] = await db
    .select()
    .from(squads)
    .where(eq(squads.id, squadId))
    .limit(1);
  return squad ?? null;
}

export async function _uncachedGetSquadWithAgents(squadId: string) {
  const squad = await _uncachedGetSquadById(squadId);
  if (!squad) return null;

  const squadAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.squadId, squadId));

  return { ...squad, agents: squadAgents };
}

// ---------------------------------------------------------------------------
// Cached variants (unstable_cache + React cache for request dedup)
// ---------------------------------------------------------------------------

export const getSquadsByOrgId = cache((orgId: string) =>
  unstable_cache(
    () => _uncachedGetSquadsByOrgId(orgId),
    ["squads-by-org", orgId],
    { tags: [CacheTags.squads(orgId)], revalidate: 30 },
  )(),
);

export const getSquadById = cache((squadId: string) =>
  unstable_cache(
    () => _uncachedGetSquadById(squadId),
    ["squad-by-id", squadId],
    { tags: [CacheTags.squad(squadId)], revalidate: 60 },
  )(),
);

export const getSquadWithAgents = cache((squadId: string) =>
  unstable_cache(
    async () => {
      const squad = await _uncachedGetSquadById(squadId);
      if (!squad) return null;

      const squadAgents = await db
        .select()
        .from(agents)
        .where(eq(agents.squadId, squadId));

      return { ...squad, agents: squadAgents };
    },
    ["squad-with-agents", squadId],
    {
      tags: [CacheTags.squad(squadId), CacheTags.agents(squadId)],
      revalidate: 30,
    },
  )(),
);

// ---------------------------------------------------------------------------
// Mutations (not cached)
// ---------------------------------------------------------------------------

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
