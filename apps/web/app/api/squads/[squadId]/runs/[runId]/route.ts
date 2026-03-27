import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { executions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getPipelineRunByRunIdAndSquad } from "@/lib/db/queries/pipeline-runs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string; runId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const { squadId, runId } = await params;

    const [steps, pipelineRun] = await Promise.all([
      db
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
        .orderBy(executions.startedAt),
      getPipelineRunByRunIdAndSquad(runId, squadId),
    ]);

    return NextResponse.json({
      steps,
      pipelineRun: pipelineRun
        ? {
            id: pipelineRun.id,
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
