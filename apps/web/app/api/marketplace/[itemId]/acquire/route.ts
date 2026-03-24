import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { marketplaceItems, marketplaceAcquisitions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createSquad } from "@/lib/db/queries/squads";
import { createAgent } from "@/lib/db/queries/agents";

const acquireSchema = z.object({
  squadId: z.string().uuid().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const { itemId } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = acquireSchema.safeParse(body);

    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, itemId)).limit(1);
    if (!item) return NextResponse.json({ error: "Item nao encontrado." }, { status: 404 });

    const orgId = session.user.orgId;

    if (item.type === "agent") {
      const squadId = parsed.data?.squadId;
      if (!squadId) return NextResponse.json({ error: "squadId obrigatorio para agente." }, { status: 400 });

      const config = item.agentConfig as Record<string, unknown> ?? {};
      const agent = await createAgent({
        squadId,
        name: item.name,
        role: String(config.role ?? item.description),
        icon: item.icon,
        modelTier: (config.modelTier as "powerful" | "fast") ?? "powerful",
        runtimeType: "claude-code",
        config,
        monthlyBudgetTokens: 500_000,
      });

      await db.update(marketplaceItems).set({ installs: sql`${marketplaceItems.installs} + 1` }).where(eq(marketplaceItems.id, itemId));
      await db.insert(marketplaceAcquisitions).values({ orgId, itemId, squadId });

      return NextResponse.json({ success: true, agentId: agent.id });
    }

    if (item.type === "squad") {
      const squadConfig = item.squadConfig as Record<string, unknown> ?? {};
      const agents = (squadConfig.agents as Array<Record<string, unknown>>) ?? [];

      const squad = await createSquad({
        orgId,
        name: item.name,
        code: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        description: item.description,
        icon: item.icon,
        config: squadConfig,
      });

      for (const a of agents) {
        await createAgent({
          squadId: squad.id,
          name: String(a.name),
          role: String(a.role),
          icon: String(a.icon ?? "🤖"),
          modelTier: (a.modelTier as "powerful" | "fast") ?? "powerful",
          runtimeType: "claude-code",
          config: a,
          monthlyBudgetTokens: 500_000,
        });
      }

      await db.update(marketplaceItems).set({ installs: sql`${marketplaceItems.installs} + 1` }).where(eq(marketplaceItems.id, itemId));
      await db.insert(marketplaceAcquisitions).values({ orgId, itemId, createdSquadId: squad.id });

      return NextResponse.json({ success: true, squadId: squad.id });
    }

    return NextResponse.json({ error: "Tipo invalido." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
