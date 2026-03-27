import { NextResponse } from "next/server";
import { resolveGitHub, getRepoFromConfig } from "@/lib/integrations/github-helpers";

export async function GET(): Promise<Response> {
  try {
    const result = await resolveGitHub();
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const repo = getRepoFromConfig(result.config);
    if (!repo) {
      return NextResponse.json({ error: "Nenhum repositorio configurado." }, { status: 400 });
    }

    const agents = await result.github.importPipeline(repo.owner, repo.repo);
    return NextResponse.json(agents);
  } catch (error) {
    console.error("[github/agents] Error:", error);
    return NextResponse.json({ error: "Erro ao listar agentes." }, { status: 500 });
  }
}
