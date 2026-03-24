import { createAdapter } from "@orbitmind/engine";
import type { ProviderConfig } from "@orbitmind/engine";
import {
  createMessage,
  getMessagesBySquadId,
  getAgentsBySquadId,
  createExecution,
  updateExecution,
  updateAgentBudget,
  createAuditLog,
  getDefaultLlmProvider,
  recordLlmUsage,
} from "@/lib/db/queries";

interface ChatHandlerOptions {
  squadId: string;
  orgId: string;
  userId: string;
  userMessage: string;
}

export async function handleChatMessage(options: ChatHandlerOptions) {
  const { squadId, orgId, userId, userMessage } = options;

  // 1. Get LLM provider from database
  const llmProvider = await getDefaultLlmProvider(orgId);

  if (!llmProvider) {
    const sysMsg = await createMessage({
      squadId,
      content: "Nenhum provedor de IA configurado. Acesse **Settings > Provedores de IA** para configurar seu Claude, OpenAI ou Gemini.",
      role: "system",
      metadata: {},
    });
    broadcastMessage(squadId, sysMsg);
    return;
  }

  // 2. Select responding agent
  const agents = await getAgentsBySquadId(squadId);
  const respondingAgent = selectRespondingAgent(userMessage, agents);

  if (!respondingAgent) {
    const sysMsg = await createMessage({
      squadId,
      content: "Nenhum agente disponivel para responder. Verifique se o squad tem agentes configurados.",
      role: "system",
      metadata: {},
    });
    broadcastMessage(squadId, sysMsg);
    return;
  }

  // 3. Check budget
  if (
    respondingAgent.monthlyBudgetTokens &&
    (respondingAgent.budgetUsedTokens ?? 0) >= respondingAgent.monthlyBudgetTokens
  ) {
    const msg = await createMessage({
      squadId,
      content: `${respondingAgent.name} atingiu o limite de budget mensal (${(respondingAgent.budgetUsedTokens ?? 0).toLocaleString()}/${respondingAgent.monthlyBudgetTokens.toLocaleString()} tokens). Aumente o limite em Settings > Squad > Agentes.`,
      role: "system",
      metadata: {},
    });
    broadcastMessage(squadId, msg);
    return;
  }

  // 4. Show typing indicator
  broadcastTyping(squadId, respondingAgent.name);

  // 5. Create execution for tracking
  const execution = await createExecution({
    squadId,
    agentId: respondingAgent.id,
    pipelineStep: "chat-response",
    status: "running",
    inputData: { userMessage },
  });

  const startTime = Date.now();

  try {
    // 6. Get recent messages for context
    const recentMessages = await getMessagesBySquadId(squadId, undefined, 20);
    const conversationHistory = recentMessages.map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

    // 7. Create adapter using factory (provider-agnostic)
    const providerConfig: ProviderConfig = {
      provider: llmProvider.provider,
      authMethod: llmProvider.authMethod,
      credential: llmProvider.credential,
      defaultModel: llmProvider.defaultModel || "",
    };

    const adapter = createAdapter(
      {
        name: respondingAgent.name,
        role: respondingAgent.role,
        config: {
          ...(respondingAgent.config as Record<string, unknown> | null),
          modelTier: respondingAgent.modelTier,
        },
      },
      providerConfig,
    );

    const result = await adapter.chat(conversationHistory);

    // 8. Save agent response
    const agentMsg = await createMessage({
      squadId,
      agentId: respondingAgent.id,
      content: result.output,
      role: "agent",
      metadata: {
        tokensUsed: result.tokensUsed,
        costCents: result.costCents,
        provider: llmProvider.provider,
      },
    });

    // 9. Update execution
    await updateExecution(execution.id, {
      status: "completed",
      outputData: { response: result.output },
      tokensUsed: result.tokensUsed,
      estimatedCost: result.costCents,
      durationMs: Date.now() - startTime,
      completedAt: new Date(),
    });

    // 10. Update agent budget & provider usage
    await updateAgentBudget(respondingAgent.id, result.tokensUsed);
    await recordLlmUsage(llmProvider.id, result.tokensUsed, result.costCents);

    // 11. Broadcast response
    broadcastMessage(squadId, agentMsg);

    // 12. Audit log
    await createAuditLog({
      orgId,
      squadId,
      action: "agent.responded",
      actorType: "agent",
      actorId: respondingAgent.id,
      metadata: {
        tokensUsed: result.tokensUsed,
        costCents: result.costCents,
        provider: llmProvider.provider,
      },
    });
  } catch (error) {
    await updateExecution(execution.id, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      completedAt: new Date(),
      durationMs: Date.now() - startTime,
    });

    const errorMsg = await createMessage({
      squadId,
      content: `Erro ao processar: ${error instanceof Error ? error.message : "Erro desconhecido"}. Tente novamente.`,
      role: "system",
      metadata: {},
    });
    broadcastMessage(squadId, errorMsg);
  }
}

function selectRespondingAgent(
  message: string,
  agents: Array<{ id: string; name: string; role: string; [key: string]: unknown }>,
) {
  const lowerMsg = message.toLowerCase();

  const roleKeywords: Record<string, string[]> = {
    pesquisador: ["pesquise", "pesquisa", "busque", "encontre", "dados", "informacao", "tendencia", "mercado", "concorrente"],
    estrategist: ["estrategia", "plano", "planeje", "calendario", "kpi", "objetivo", "meta"],
    copywriter: ["escreva", "texto", "copy", "post", "artigo", "conteudo", "blog", "legenda", "caption", "redacao"],
    designer: ["design", "imagem", "visual", "banner", "arte", "criativo", "layout", "mockup"],
    seo: ["seo", "keyword", "hashtag", "palavra-chave", "rankeamento", "google", "busca"],
    revisor: ["revise", "review", "qualidade", "feedback", "correcao", "melhore"],
    publicador: ["publique", "publicar", "postar", "agendar", "schedule", "instagram", "linkedin", "twitter"],
  };

  for (const agent of agents) {
    const agentRole = (agent.role ?? "").toLowerCase();
    for (const [role, keywords] of Object.entries(roleKeywords)) {
      if (agentRole.includes(role) && keywords.some((kw) => lowerMsg.includes(kw))) {
        return agent;
      }
    }
  }

  return agents[0] ?? null;
}

async function broadcastMessage(
  squadId: string,
  message: { id: string; content: string; role: string; createdAt: Date; [key: string]: unknown },
) {
  try {
    const { wsManager } = await import("@/lib/realtime/ws-manager");
    wsManager.broadcastToSquad(squadId, {
      type: "CHAT_MESSAGE",
      message: { ...message, createdAt: message.createdAt.toISOString() },
    });
  } catch { /* WS not available */ }
}

async function broadcastTyping(squadId: string, agentName: string) {
  try {
    const { wsManager } = await import("@/lib/realtime/ws-manager");
    wsManager.broadcastToSquad(squadId, { type: "AGENT_TYPING", agentName });
  } catch { /* WS not available */ }
}
