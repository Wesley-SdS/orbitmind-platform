import { auth } from "@/lib/auth";
import { getIntegrationByType } from "@/lib/db/queries/integrations";
import { GitHubIntegration } from "./actions/github";

/**
 * Resolve a instancia de GitHubIntegration para o usuario autenticado.
 * Retorna { github, orgId, config } ou { error, status }.
 */
export async function resolveGitHub(): Promise<
  | { github: GitHubIntegration; orgId: string; config: Record<string, unknown>; integrationId: string }
  | { error: string; status: number }
> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Nao autenticado.", status: 401 };
  }

  const integration = await getIntegrationByType(session.user.orgId, "github");
  if (!integration || integration.status !== "active") {
    return { error: "GitHub nao conectado.", status: 404 };
  }

  const github = new GitHubIntegration(session.user.orgId);
  const config = (integration.config as Record<string, unknown>) ?? {};

  return { github, orgId: session.user.orgId, config, integrationId: integration.id };
}

/**
 * Extrai owner/repo da config da integracao GitHub.
 */
export function getRepoFromConfig(config: Record<string, unknown>): { owner: string; repo: string } | null {
  const org = config.organization as string | undefined;
  const repo = config.repository as string | undefined;
  if (!org || !repo) return null;
  return { owner: org, repo };
}
