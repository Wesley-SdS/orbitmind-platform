import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGitHub, getRepoFromConfig } from "@/lib/integrations/github-helpers";

/** GET — detalhes de um agente (skill file content) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentId: string }> },
): Promise<Response> {
  try {
    const { agentId } = await params;
    const result = await resolveGitHub();
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const repo = getRepoFromConfig(result.config);
    if (!repo) {
      return NextResponse.json({ error: "Nenhum repositorio configurado." }, { status: 400 });
    }

    const agents = await result.github.importPipeline(repo.owner, repo.repo);
    const agent = agents.find((a) => String(a.workflowId) === agentId || a.name === agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agente nao encontrado." }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("[github/agents/id] Error:", error);
    return NextResponse.json({ error: "Erro ao buscar agente." }, { status: 500 });
  }
}

const updateSchema = z.object({
  skillContent: z.string().optional(),
  workflowContent: z.string().optional(),
  commitMessage: z.string().min(1).max(200),
});

/** PUT — editar agente (update skill file e/ou workflow no repo) */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
): Promise<Response> {
  try {
    const { agentId } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
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

    const agents = await result.github.importPipeline(repo.owner, repo.repo);
    const agent = agents.find((a) => String(a.workflowId) === agentId || a.name === agentId);
    if (!agent) {
      return NextResponse.json({ error: "Agente nao encontrado." }, { status: 404 });
    }

    const results: string[] = [];
    let lastCommit: { sha?: string; html_url?: string } | undefined;

    // Update skill file
    if (parsed.data.skillContent && agent.skillPath) {
      const res = await result.github.createOrUpdateFile(
        repo.owner, repo.repo,
        agent.skillPath,
        parsed.data.skillContent,
        parsed.data.commitMessage,
        agent.skillSha || undefined,
      );
      lastCommit = (res.data as Record<string, unknown>)?.commit as typeof lastCommit;
      results.push(`Skill file atualizado: ${agent.skillPath}`);
    }

    // Update workflow file
    if (parsed.data.workflowContent) {
      const res = await result.github.createOrUpdateFile(
        repo.owner, repo.repo,
        agent.workflowPath,
        parsed.data.workflowContent,
        parsed.data.commitMessage,
        agent.workflowSha || undefined,
      );
      lastCommit = (res.data as Record<string, unknown>)?.commit as typeof lastCommit;
      results.push(`Workflow atualizado: ${agent.workflowPath}`);
    }

    return NextResponse.json({
      success: true,
      results,
      commit: lastCommit ? { sha: lastCommit.sha, url: lastCommit.html_url } : undefined,
    });
  } catch (error) {
    console.error("[github/agents/id PUT] Error:", error);
    return NextResponse.json({ error: "Erro ao atualizar agente." }, { status: 500 });
  }
}
