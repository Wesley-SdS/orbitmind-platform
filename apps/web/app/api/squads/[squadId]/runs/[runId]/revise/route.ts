import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPipelineRunByRunIdAndSquad, updatePipelineRun } from "@/lib/db/queries/pipeline-runs";
import { approveCheckpoint } from "@/lib/engine/checkpoint-manager";
import { broadcastSquad, OFFICE_EVENTS } from "@/lib/realtime/broadcast";

const reviseSchema = z.object({
  feedback: z.string().trim().min(3, "Diga o que precisa ser ajustado.").max(4000),
});

/**
 * "Devolver para ajustes": o checkpoint libera o pipeline, que volta à etapa
 * que gerou a entrega com o feedback no prompt e para de novo neste checkpoint.
 */
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
    const pipelineRun = await getPipelineRunByRunIdAndSquad(runId, squadId);
    if (!pipelineRun || pipelineRun.orgId !== session.user.orgId) {
      return NextResponse.json({ error: "Pipeline run nao encontrado." }, { status: 404 });
    }
    if (pipelineRun.status !== "waiting_approval") {
      return NextResponse.json({ error: "Pipeline run nao esta aguardando aprovacao." }, { status: 400 });
    }

    const parsed = reviseSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados invalidos." }, { status: 400 });
    }

    const resolved = approveCheckpoint(runId, JSON.stringify({ action: "revise", feedback: parsed.data.feedback }));
    if (!resolved) {
      await updatePipelineRun(runId, { status: "cancelled", completedAt: new Date() });
      return NextResponse.json(
        { error: "Checkpoint expirou (servidor reiniciou). Execute o pipeline novamente." },
        { status: 409 },
      );
    }

    await updatePipelineRun(runId, { status: "running", pausedAt: null, checkpointStepId: null });
    void broadcastSquad(squadId, { type: OFFICE_EVENTS.CHECKPOINT_RESOLVED, runId, decision: "revise" });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
