import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPipelineRunByRunIdAndSquad, updatePipelineRun } from "@/lib/db/queries/pipeline-runs";
import { approveCheckpoint } from "@/lib/engine/checkpoint-manager";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ squadId: string; runId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId, runId } = await params;
    const orgId = session.user.orgId;

    const pipelineRun = await getPipelineRunByRunIdAndSquad(runId, squadId);
    if (!pipelineRun || pipelineRun.orgId !== orgId) {
      return NextResponse.json({ error: "Pipeline run nao encontrado." }, { status: 404 });
    }

    if (pipelineRun.status !== "waiting_approval") {
      return NextResponse.json(
        { error: "Pipeline run nao esta aguardando aprovacao." },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const payload = body as { data?: Record<string, string>; selectedIndex?: number };

    let response = "continuar";
    if (payload.data) {
      response = JSON.stringify(payload.data);
    } else if (payload.selectedIndex !== undefined) {
      response = String(payload.selectedIndex);
    }

    const resolved = approveCheckpoint(runId, response);
    if (!resolved) {
      // Checkpoint was lost (server restarted). Mark as cancelled so user can re-run.
      await updatePipelineRun(runId, { status: "cancelled", completedAt: new Date() });
      return NextResponse.json(
        { error: "Checkpoint expirou (servidor reiniciou). Execute o pipeline novamente." },
        { status: 409 },
      );
    }

    await updatePipelineRun(runId, {
      status: "running",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      pausedAt: null,
      checkpointStepId: null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
