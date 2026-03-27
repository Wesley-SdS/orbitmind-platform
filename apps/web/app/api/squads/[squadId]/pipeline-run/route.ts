import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLatestPipelineRun } from "@/lib/db/queries/pipeline-runs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const { squadId } = await params;
    const run = await getLatestPipelineRun(squadId);

    if (!run) return NextResponse.json(null);

    return NextResponse.json({
      runId: run.runId,
      status: run.status,
      checkpointStepId: run.checkpointStepId,
      stepOutputs: run.stepOutputs ?? {},
      currentStepIndex: run.currentStepIndex,
      totalSteps: run.totalSteps,
      startedAt: run.startedAt,
      pausedAt: run.pausedAt,
      completedAt: run.completedAt,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
