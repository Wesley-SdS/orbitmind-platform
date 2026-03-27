import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubIntegration } from "@/lib/integrations/actions/github";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const github = new GitHubIntegration(session.user.orgId);

    // Buscar orgs + usuario pessoal em paralelo
    const [orgsResult, reposResult] = await Promise.all([
      github.listOrganizations(),
      github.listRepos(),
    ]);

    // Inferir o username pessoal do primeiro repo
    const repos = reposResult.data ?? [];
    const personalLogin = repos.length > 0 ? repos[0]!.full_name.split("/")[0] : null;

    const orgs = (orgsResult.data ?? []).map((o) => ({
      login: o.login,
      avatar_url: o.avatar_url,
      type: "org" as const,
    }));

    // Adicionar conta pessoal no inicio
    const result = personalLogin
      ? [{ login: personalLogin, avatar_url: "", type: "user" as const }, ...orgs]
      : orgs;

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar organizacoes." }, { status: 500 });
  }
}
