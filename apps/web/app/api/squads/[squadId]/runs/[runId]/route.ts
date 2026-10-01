import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { executions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getPipelineRunByRunIdAndSquad } from "@/lib/db/queries/pipeline-runs";
import { getSquadById } from "@/lib/db/queries/squads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string; runId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const { squadId, runId } = await params;

    const pipelineRun = await getPipelineRunByRunIdAndSquad(runId, squadId);
    if (pipelineRun && pipelineRun.orgId !== session.user.orgId) {
      return NextResponse.json({ error: "Execucao nao encontrada." }, { status: 404 });
    }

    const steps = await db
      .select({
        id: executions.id,
        pipelineStep: executions.pipelineStep,
        agentId: executions.agentId,
        status: executions.status,
        tokensUsed: executions.tokensUsed,
        estimatedCostCents: executions.estimatedCost,
        durationMs: executions.durationMs,
        startedAt: executions.startedAt,
        completedAt: executions.completedAt,
        error: executions.error,
      })
      .from(executions)
      .where(and(eq(executions.squadId, squadId), eq(executions.runId, runId)))
      .orderBy(executions.startedAt);

    // sem pipeline run, só devolve passos se o squad for da organização (checado pelas execuções)
    if (!pipelineRun && steps.length > 0) {
      const squad = await getSquadById(squadId);
      if (!squad || squad.orgId !== session.user.orgId) {
        return NextResponse.json({ error: "Execucao nao encontrada." }, { status: 404 });
      }
    }

    return NextResponse.json({
      steps,
      pipelineRun: pipelineRun
        ? {
            id: pipelineRun.id,
            runId: pipelineRun.runId,
            status: pipelineRun.status,
            currentStepIndex: pipelineRun.currentStepIndex,
            totalSteps: pipelineRun.totalSteps,
            checkpointStepId: pipelineRun.checkpointStepId,
            stepOutputs: pipelineRun.stepOutputs,
            startedAt: pipelineRun.startedAt,
            pausedAt: pipelineRun.pausedAt,
            completedAt: pipelineRun.completedAt,
            approvedBy: pipelineRun.approvedBy,
            approvedAt: pipelineRun.approvedAt,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
