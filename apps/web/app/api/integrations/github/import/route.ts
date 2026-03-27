import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getIntegrationByType, updateIntegration } from "@/lib/db/queries/integrations";
import { createSquad } from "@/lib/db/queries/squads";
import { getAgentsBySquadId, createAgent } from "@/lib/db/queries/agents";
import { GitHubIntegration } from "@/lib/integrations/actions/github";

const importSchema = z.object({
  organization: z.string().min(1),
  repository: z.string().min(1),
  branch: z.string().default("main"),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos.", details: parsed.error.flatten() }, { status: 400 });
    }

    const { organization, repository, branch } = parsed.data;

    const integration = await getIntegrationByType(session.user.orgId, "github");
    if (!integration || integration.status !== "active") {
      return NextResponse.json({ error: "GitHub nao conectado." }, { status: 404 });
    }

    const github = new GitHubIntegration(session.user.orgId);
    const agents = await github.importPipeline(organization, repository);

    // Salvar config com repo selecionado + agentes importados
    const existingConfig = (integration.config as Record<string, unknown>) ?? {};
    const importedAgents = agents.map((a) => ({
      workflowId: a.workflowId,
      name: a.name,
      displayName: a.displayName,
      role: a.role,
      workflowPath: a.workflowPath,
      skillPath: a.skillPath,
      state: a.state,
    }));

    // Fix 4: Criar squad + agents no DB do OrbitMind
    let linkedSquadId = existingConfig.linkedSquadId as string | undefined;

    if (!linkedSquadId) {
      const squad = await createSquad({
        orgId: session.user.orgId,
        name: `${organization}/${repository}`,
        code: `gh-${repository}-${Date.now().toString(36)}`,
        description: `Esteira de desenvolvimento do repositorio ${organization}/${repository}`,
        icon: "🏭",
        config: { autonomy: "autonomous", performanceMode: "high", source: "github_import" },
      });
      linkedSquadId = squad.id;
    }

    // Criar agentes no squad (evitar duplicatas por workflowId)
    const existingAgents = await getAgentsBySquadId(linkedSquadId);
    const ROLE_ICONS: Record<string, string> = {
      developer: "🔧", reviewer: "🔍", autofix: "🔄", architect: "🏛️",
      designer: "🎨", docs: "📝", ideator: "💡", taskmaster: "📋",
      qa: "🧪", release: "🚀", rebase: "🔀", "project-sync": "📌",
      general: "⚙️",
    };

    for (const imported of importedAgents) {
      const alreadyExists = existingAgents.some((a) =>
        (a.config as Record<string, unknown>)?.workflowId === imported.workflowId
        || a.name === imported.displayName,
      );
      if (!alreadyExists) {
        await createAgent({
          squadId: linkedSquadId,
          name: imported.displayName,
          role: imported.role,
          icon: ROLE_ICONS[imported.role] ?? "⚙️",
          config: {
            workflowId: imported.workflowId,
            workflowPath: imported.workflowPath,
            skillPath: imported.skillPath,
            source: "github_import",
          },
        });
      }
    }

    await updateIntegration(integration.id, {
      config: {
        ...existingConfig,
        organization,
        repository,
        branch,
        importedAgents,
        linkedSquadId,
        importedAt: new Date().toISOString(),
      },
      lastSyncAt: new Date(),
    });

    return NextResponse.json({
      agents,
      summary: {
        total: agents.length,
        active: agents.filter((a) => a.state === "active").length,
        withSkillFile: agents.filter((a) => a.skillPath).length,
        withLastRun: agents.filter((a) => a.lastRun).length,
      },
    });
  } catch (error) {
    console.error("[github/import] Error:", error);
    return NextResponse.json({ error: "Erro ao importar pipeline." }, { status: 500 });
  }
}
