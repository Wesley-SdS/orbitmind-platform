import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGitHub, getRepoFromConfig } from "@/lib/integrations/github-helpers";

const toggleSchema = z.object({
  enable: z.boolean(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
): Promise<Response> {
  try {
    const { agentId } = await params;
    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const result = await resolveGitHub();
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const repo = getRepoFromConfig(result.config);
    if (!repo) {
      return NextResponse.json({ error: "Nenhum repositorio configurado." }, { status: 400 });
    }

    const workflowId = parseInt(agentId, 10);
    if (isNaN(workflowId)) {
      return NextResponse.json({ error: "ID de workflow invalido." }, { status: 400 });
    }

    await result.github.toggleWorkflow(repo.owner, repo.repo, workflowId, parsed.data.enable);

    return NextResponse.json({
      success: true,
      message: parsed.data.enable ? "Workflow habilitado." : "Workflow desabilitado.",
    });
  } catch (error) {
    console.error("[github/agents/toggle] Error:", error);
    return NextResponse.json({ error: "Erro ao alternar workflow." }, { status: 500 });
  }
}
