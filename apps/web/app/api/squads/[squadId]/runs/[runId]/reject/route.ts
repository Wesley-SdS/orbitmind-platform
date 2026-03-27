import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPipelineRunByRunIdAndSquad, updatePipelineRun } from "@/lib/db/queries/pipeline-runs";
import { rejectCheckpoint } from "@/lib/engine/checkpoint-manager";

export async function POST(
  _req: Request,
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

    const resolved = rejectCheckpoint(runId);
    if (!resolved) {
      return NextResponse.json(
        { error: "Nenhum checkpoint pendente encontrado na memoria do processo." },
        { status: 409 },
      );
    }

    await updatePipelineRun(runId, {
      status: "cancelled",
      completedAt: new Date(),
      pausedAt: null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
