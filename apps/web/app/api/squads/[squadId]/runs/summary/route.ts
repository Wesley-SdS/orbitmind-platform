import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAdapter } from "@orbitmind/engine";
import type { ProviderConfig } from "@orbitmind/engine";
import { getDefaultLlmProvider } from "@/lib/db/queries/llm-providers";
import { getOrganizationById } from "@/lib/db/queries/organizations";

const schema = z.object({
  stepOutputs: z.record(z.object({
    agentName: z.string(),
    agentIcon: z.string(),
    content: z.string(),
    completedAt: z.string(),
  })),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId } = await params;
    const orgId = session.user.orgId;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const llmProvider = await getDefaultLlmProvider(orgId);
    if (!llmProvider) {
      return NextResponse.json({ error: "Nenhum provedor de IA configurado." }, { status: 400 });
    }

    const org = await getOrganizationById(orgId);
    const companyCtx = org?.companyContext as Record<string, unknown> | null;

    const providerConfig: ProviderConfig = {
      provider: llmProvider.provider,
      defaultModel: llmProvider.defaultModel || "",
    };

    const adapter = createAdapter(
      { name: "Resumo", role: "summarizer", config: {} },
      providerConfig,
    );

    // Build conversation from all step outputs
    const outputs = Object.entries(parsed.data.stepOutputs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([stepId, output]) =>
        `### ${output.agentName} (${stepId})\n${output.content}`
      )
      .join("\n\n---\n\n");

    let companyInfo = "";
    if (companyCtx?.name) {
      companyInfo = `\nEmpresa: ${companyCtx.name} (${companyCtx.sector}). Publico: ${companyCtx.audience}. Tom: ${companyCtx.tone}.`;
    }

    const prompt = `Voce e um assistente executivo. Analise os outputs de todos os agentes do pipeline abaixo e gere um RESUMO EXECUTIVO conciso.${companyInfo}

## Outputs dos agentes:

${outputs}

## Instrucoes:
1. Resuma o que foi decidido/produzido em cada etapa em 1-2 frases
2. Identifique o objetivo geral que esta sendo trabalhado
3. Destaque os pontos mais importantes e decisoes-chave
4. Liste proximos passos recomendados
5. Aponte riscos ou lacunas identificadas

Formato: use markdown com headers e bullets. Seja direto e pratico.`;

    const result = await adapter.chat([{ role: "user", content: prompt }]);

    return NextResponse.json({ summary: result.output, squadId });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
