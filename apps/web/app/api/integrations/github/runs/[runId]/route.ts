import { NextResponse } from "next/server";
import { resolveGitHub, getRepoFromConfig } from "@/lib/integrations/github-helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> },
): Promise<Response> {
  try {
    const { runId } = await params;
    const result = await resolveGitHub();
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const repo = getRepoFromConfig(result.config);
    if (!repo) {
      return NextResponse.json({ error: "Nenhum repositorio configurado." }, { status: 400 });
    }

    const runIdNum = parseInt(runId, 10);
    if (isNaN(runIdNum)) {
      return NextResponse.json({ error: "ID de run invalido." }, { status: 400 });
    }

    const run = await result.github.getWorkflowRun(repo.owner, repo.repo, runIdNum);
    return NextResponse.json(run.data);
  } catch (error) {
    console.error("[github/runs/id] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar run." }, { status: 500 });
  }
}
