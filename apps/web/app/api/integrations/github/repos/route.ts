import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { GitHubIntegration } from "@/lib/integrations/actions/github";

const querySchema = z.object({
  org: z.string().min(1, "Parametro 'org' obrigatorio.").max(100),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({ org: searchParams.get("org") });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Parametro invalido." }, { status: 400 });
    }
    const { org } = parsed.data;

    const github = new GitHubIntegration(session.user.orgId);

    // Tentar como org primeiro, se falhar busca como usuario pessoal
    const orgRepos = await github.listOrgRepos(org);
    if (orgRepos.success) {
      return NextResponse.json(orgRepos.data);
    }

    // Fallback: listar repos do usuario e filtrar pelo owner
    const userRepos = await github.listRepos();
    const filtered = (userRepos.data ?? []).filter(
      (r) => r.full_name.split("/")[0]?.toLowerCase() === org.toLowerCase(),
    );
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar repositorios." }, { status: 500 });
  }
}
