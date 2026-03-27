import { NextResponse } from "next/server";
import { resolveGitHub, getRepoFromConfig } from "@/lib/integrations/github-helpers";

export async function GET(req: Request): Promise<Response> {
  try {
    const result = await resolveGitHub();
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const repo = getRepoFromConfig(result.config);
    if (!repo) {
      return NextResponse.json({ error: "Nenhum repositorio configurado." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const rawWorkflowId = searchParams.get("workflowId");
    let workflowIdNum: number | undefined;
    if (rawWorkflowId) {
      workflowIdNum = parseInt(rawWorkflowId, 10);
      if (isNaN(workflowIdNum)) {
        return NextResponse.json({ error: "workflowId deve ser numerico." }, { status: 400 });
      }
    }

    const runs = await result.github.listWorkflowRuns(
      repo.owner, repo.repo,
      workflowIdNum,
    );

    return NextResponse.json(runs.data);
  } catch (error) {
    console.error("[github/runs] Error:", error);
    return NextResponse.json({ error: "Erro ao listar runs." }, { status: 500 });
  }
}
