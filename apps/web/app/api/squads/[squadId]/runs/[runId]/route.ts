import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { executions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string; runId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const { squadId, runId } = await params;

    const steps = await db
      .select({
        id: executions.id,
        pipelineStep: executions.pipelineStep,
        agentId: executions.agentId,
        status: executions.status,
        tokensUsed: executions.tokensUsed,
        durationMs: executions.durationMs,
        startedAt: executions.startedAt,
        completedAt: executions.completedAt,
        error: executions.error,
      })
      .from(executions)
      .where(and(eq(executions.squadId, squadId), eq(executions.runId, runId)))
      .orderBy(executions.startedAt);

    return NextResponse.json(steps);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
