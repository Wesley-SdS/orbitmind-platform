import { eq, sql, and, gte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import { squads, agents, tasks, executions, auditLogs } from "@/lib/db/schema";
import { CacheTags } from "@/lib/cache";

// ---------------------------------------------------------------------------
// Uncached variant
// ---------------------------------------------------------------------------

export async function _uncachedGetDashboardMetrics(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Run all independent queries in parallel
  const [
    [squadsResult],
    [tasksResult],
    [execTodayResult],
    [costResult],
    executionsByDay,
    budgetByAgent,
    recentActivity,
    activeSquads,
  ] = await Promise.all([
    // Active squads count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(squads)
      .where(and(eq(squads.orgId, orgId), eq(squads.status, "active"))),

    // Tasks completed this month
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .innerJoin(squads, eq(tasks.squadId, squads.id))
      .where(
        and(
          eq(squads.orgId, orgId),
          eq(tasks.status, "done"),
          gte(tasks.completedAt, startOfMonth),
        ),
      ),

    // Executions today
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(executions)
      .innerJoin(squads, eq(executions.squadId, squads.id))
      .where(and(eq(squads.orgId, orgId), gte(executions.startedAt, startOfToday))),

    // Estimated cost this month
    db
      .select({ total: sql<number>`coalesce(sum(${executions.estimatedCost}), 0)::int` })
      .from(executions)
      .innerJoin(squads, eq(executions.squadId, squads.id))
      .where(and(eq(squads.orgId, orgId), gte(executions.startedAt, startOfMonth))),

    // Executions by day (last 7 days)
    db
      .select({
        date: sql<string>`date(${executions.startedAt})`,
        completed: sql<number>`count(*) filter (where ${executions.status} = 'completed')::int`,
        failed: sql<number>`count(*) filter (where ${executions.status} = 'failed')::int`,
        cancelled: sql<number>`count(*) filter (where ${executions.status} = 'cancelled')::int`,
      })
      .from(executions)
      .innerJoin(squads, eq(executions.squadId, squads.id))
      .where(and(eq(squads.orgId, orgId), gte(executions.startedAt, sevenDaysAgo)))
      .groupBy(sql`date(${executions.startedAt})`)
      .orderBy(sql`date(${executions.startedAt})`),

    // Budget by agent (top agents with usage)
    db
      .select({
        agentId: agents.id,
        agentName: agents.name,
        agentIcon: agents.icon,
        squadName: squads.name,
        budgetUsed: agents.budgetUsedTokens,
        budgetLimit: agents.monthlyBudgetTokens,
      })
      .from(agents)
      .innerJoin(squads, eq(agents.squadId, squads.id))
      .where(eq(squads.orgId, orgId))
      .orderBy(sql`${agents.budgetUsedTokens} desc`)
      .limit(10),

    // Recent activity
    db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.orgId, orgId))
      .orderBy(sql`${auditLogs.createdAt} desc`)
      .limit(10),

    // Active squads list (LEFT JOIN + GROUP BY instead of scalar subquery)
    db
      .select({
        id: squads.id,
        name: squads.name,
        icon: squads.icon,
        status: squads.status,
        agentCount: sql<number>`count(${agents.id})::int`,
        updatedAt: squads.updatedAt,
      })
      .from(squads)
      .leftJoin(agents, eq(agents.squadId, squads.id))
      .where(and(eq(squads.orgId, orgId), eq(squads.status, "active")))
      .groupBy(squads.id, squads.name, squads.icon, squads.status, squads.updatedAt),
  ]);

  return {
    squadsActive: squadsResult?.count ?? 0,
    tasksCompletedThisMonth: tasksResult?.count ?? 0,
    executionsToday: execTodayResult?.count ?? 0,
    estimatedCostCentsThisMonth: costResult?.total ?? 0,
    executionsByDay,
    budgetByAgent: budgetByAgent.map((a) => ({
      agentId: a.agentId,
      agentName: a.agentName,
      agentIcon: a.agentIcon,
      squadName: a.squadName,
      budgetUsed: a.budgetUsed ?? 0,
      budgetLimit: a.budgetLimit ?? 0,
      percentage: a.budgetLimit ? Math.round(((a.budgetUsed ?? 0) / a.budgetLimit) * 100) : 0,
    })),
    recentActivity,
    activeSquads,
  };
}

// ---------------------------------------------------------------------------
// Cached variant
// ---------------------------------------------------------------------------

export const getDashboardMetrics = cache((orgId: string) =>
  unstable_cache(
    () => _uncachedGetDashboardMetrics(orgId),
    ["dashboard-metrics", orgId],
    { tags: [CacheTags.metrics(orgId)], revalidate: 30 },
  )(),
);
