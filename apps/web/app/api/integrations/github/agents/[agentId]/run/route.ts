import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGitHub, getRepoFromConfig } from "@/lib/integrations/github-helpers";

const runSchema = z.object({
  ref: z.string().default("main"),
  inputs: z.record(z.string()).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
): Promise<Response> {
  try {
    const { agentId } = await params;
    const body = await req.json();
    const parsed = runSchema.safeParse(body);
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

    const branch = (result.config.branch as string) ?? parsed.data.ref;
    await result.github.triggerWorkflow(repo.owner, repo.repo, workflowId, branch, parsed.data.inputs);

    return NextResponse.json({
      success: true,
      message: "Workflow disparado com sucesso.",
    });
  } catch (error) {
    console.error("[github/agents/run] Error:", error);
    return NextResponse.json({ error: "Erro ao disparar workflow." }, { status: 500 });
  }
}
