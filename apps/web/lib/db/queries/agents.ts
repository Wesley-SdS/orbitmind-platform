import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents, squads, executions } from "@/lib/db/schema";

export async function getAgentsBySquadId(squadId: string) {
  return db.select().from(agents).where(eq(agents.squadId, squadId));
}

export async function getAgentById(agentId: string) {
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);
  return agent ?? null;
}

export async function createAgent(data: {
  squadId: string;
  name: string;
  role: string;
  icon?: string;
  modelTier?: "powerful" | "fast";
  runtimeType?: "claude-code" | "codex" | "custom";
  monthlyBudgetTokens?: number;
  config?: Record<string, unknown>;
}) {
  const [agent] = await db.insert(agents).values(data).returning();
  return agent!;
}

export async function updateAgent(
  agentId: string,
  data: {
    name?: string;
    role?: string;
    icon?: string;
    modelTier?: "powerful" | "fast";
    config?: Record<string, unknown>;
    monthlyBudgetTokens?: number;
  },
) {
  const [updated] = await db
    .update(agents)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(agents.id, agentId))
    .returning();
  return updated ?? null;
}

export async function getAgentsByOrgId(orgId: string) {
  return db
    .select({
      id: agents.id,
      squadId: agents.squadId,
      name: agents.name,
      role: agents.role,
      icon: agents.icon,
      modelTier: agents.modelTier,
      runtimeType: agents.runtimeType,
      monthlyBudgetTokens: agents.monthlyBudgetTokens,
      budgetUsedTokens: agents.budgetUsedTokens,
      status: agents.status,
      config: agents.config,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
      squadName: squads.name,
      squadIcon: squads.icon,
    })
    .from(agents)
    .innerJoin(squads, eq(agents.squadId, squads.id))
    .where(eq(squads.orgId, orgId));
}

export async function deleteAgent(agentId: string) {
  await db.delete(agents).where(eq(agents.id, agentId));
}

export async function updateAgentBudget(agentId: string, tokensUsed: number) {
  const [updated] = await db
    .update(agents)
    .set({
      budgetUsedTokens: sql`${agents.budgetUsedTokens} + ${tokensUsed}`,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId))
    .returning();
  return updated ?? null;
}
