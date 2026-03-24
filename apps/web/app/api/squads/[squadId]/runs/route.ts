import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { executions } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const { squadId } = await params;

    // Group executions by runId
    const runs = await db
      .select({
        runId: executions.runId,
        status: sql<string>`(ARRAY_AGG(${executions.status} ORDER BY ${executions.startedAt} DESC))[1]`,
        stepsCompleted: sql<number>`count(*)::int`,
        totalTokens: sql<number>`coalesce(sum(${executions.tokensUsed}), 0)::int`,
        totalCost: sql<number>`coalesce(sum(${executions.estimatedCost}), 0)::int`,
        startedAt: sql<string>`min(${executions.startedAt})`,
        completedAt: sql<string>`max(${executions.completedAt})`,
      })
      .from(executions)
      .where(eq(executions.squadId, squadId))
      .groupBy(executions.runId)
      .orderBy(desc(sql`min(${executions.startedAt})`))
      .limit(20);

    return NextResponse.json(runs);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
