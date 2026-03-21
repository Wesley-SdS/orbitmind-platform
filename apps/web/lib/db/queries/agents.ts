import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";

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
