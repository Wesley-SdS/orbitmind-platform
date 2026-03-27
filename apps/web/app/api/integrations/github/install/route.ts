import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGitHub, getRepoFromConfig } from "@/lib/integrations/github-helpers";
import { installPipeline } from "@/lib/integrations/templates/pipeline-installer";
import { getAvailableTemplates } from "@/lib/integrations/templates/pipeline-installer";

const installSchema = z.object({
  agents: z.array(z.string()).optional(),
  skipExisting: z.boolean().default(true),
});

/** POST — instalar esteira no repo configurado */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const parsed = installSchema.safeParse(body);
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

    const branch = (result.config.branch as string) ?? "main";
    const installResult = await installPipeline(
      result.github, repo.owner, repo.repo,
      { agents: parsed.data.agents, branch, skipExisting: parsed.data.skipExisting },
    );

    return NextResponse.json(installResult);
  } catch (error) {
    console.error("[github/install] Error:", error);
    return NextResponse.json({ error: "Erro ao instalar esteira." }, { status: 500 });
  }
}

/** GET — listar templates disponiveis */
export async function GET(): Promise<Response> {
  return NextResponse.json(getAvailableTemplates());
}
