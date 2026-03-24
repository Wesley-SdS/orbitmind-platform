import { createAdapter } from "@orbitmind/engine";
import type { ProviderConfig } from "@orbitmind/engine";
import { getDefaultLlmProvider } from "@/lib/db/queries/llm-providers";
import { createMessage, getMessagesByConversationId, getMessagesBySquadId } from "@/lib/db/queries/messages";
import { getSquadsByOrgId, getSquadWithAgents, createSquad, updateSquad } from "@/lib/db/queries/squads";
import { createAgent, getAgentsBySquadId } from "@/lib/db/queries/agents";
import { createAuditLog } from "@/lib/db/queries/audit-logs";
import { ARCHITECT_AGENT, ARCHITECT_SQUAD_ID } from "./architect-agent";
import type { ArchitectConversationState } from "./architect-state";
import { detectIntent } from "./architect-state";
import {
  setActionConversationId,
  handleCreateTasks, handleViewTasks, handleMoveTask, handleDeleteTask,
  handlePauseSquad, handleActivateSquad, handleDuplicateSquad, handleExportSquad,
  handleChangeModel, handleChangeBudget, handleViewAgents,
  handleInstallSkill, handleRunPipeline, handleActionSelectSquad,
} from "./architect-actions";

const architectStates = new Map<string, ArchitectConversationState>();

export function getArchitectState(orgId: string) {
  return architectStates.get(orgId);
}

export function clearArchitectState(orgId: string, conversationId?: string) {
  if (conversationId) {
    architectStates.delete(conversationId);
  } else {
    // Clear all states for this org (legacy)
    for (const [key, val] of architectStates) {
      if (val.orgId === orgId) architectStates.delete(key);
    }
  }
}

async function ensureArchitectSquad(orgId: string) {
  const { getSquadById } = await import("@/lib/db/queries/squads");
  const existing = await getSquadById(ARCHITECT_SQUAD_ID);
  if (!existing) {
    const { db } = await import("@/lib/db");
    const { squads } = await import("@/lib/db/schema");
    await db.insert(squads).values({
      id: ARCHITECT_SQUAD_ID,
      orgId,
      name: "Arquiteto",
      code: "system-architect",
      description: "Canal do Arquiteto para criar e gerenciar squads",
      icon: "🧠",
      status: "active",
      config: { isSystem: true },
    }).onConflictDoNothing();
  }
}

export async function handleArchitectMessage(
  orgId: string,
  userId: string,
  userMessage: string,
  conversationId?: string,
): Promise<void> {
  const squadId = ARCHITECT_SQUAD_ID;
  const stateKey = conversationId || orgId;
  await ensureArchitectSquad(orgId);
  let state = architectStates.get(stateKey);

  if (!state) {
    state = conversationId
      ? await recoverStateFromConversation(orgId, squadId, conversationId)
      : await recoverStateFromHistory(orgId, squadId);
    architectStates.set(stateKey, state);
  }

  // Set global conversationId for message tagging
  _currentConversationId = conversationId;
  setActionConversationId(conversationId);

  const llmProvider = await getDefaultLlmProvider(orgId);
  if (!llmProvider) {
    await sendArchitectMessage(squadId, "Antes de criar um squad, configure seu provedor de IA em **Settings > Provedores de IA**.");
    return;
  }

  const providerConfig: ProviderConfig = {
    provider: llmProvider.provider,
    authMethod: llmProvider.authMethod,
    credential: llmProvider.credential,
    defaultModel: llmProvider.defaultModel || "",
  };

  // If in active flow (discovery/design/edit), continue that flow
  if (state.phase === "discovery") {
    await handleDiscovery(state, squadId, userMessage, providerConfig);
  } else if (state.phase === "design") {
    await handleDesignApproval(state, squadId, userMessage, providerConfig);
  } else if (state.phase === "list-action") {
    await handleListAction(state, squadId, orgId, userMessage, providerConfig);
  } else if (state.phase === "edit-select") {
    await handleEditSelect(state, squadId, userMessage, providerConfig);
  } else if (state.phase === "edit-modify") {
    await handleEditModify(state, squadId, userMessage, providerConfig);
  } else if (state.phase === "edit-confirm") {
    await handleEditConfirm(state, squadId, userMessage, providerConfig);
  } else if (state.phase === "delete-confirm") {
    await handleDeleteConfirm(state, squadId, userMessage);
  } else if (state.phase === "action-select-squad") {
    await handleActionSelectSquad(state, userMessage, providerConfig);
  } else {
    // Idle or complete — detect intent
    const intent = detectIntent(userMessage);

    switch (intent) {
      case "create":
        state.phase = "discovery";
        state.discoveryStep = 0;
        state.discovery = {};
        state.proposedDesign = undefined;
        await handleDiscovery(state, squadId, userMessage, providerConfig);
        break;

      case "edit":
        await startEditFlow(state, squadId, orgId, userMessage, providerConfig);
        break;

      case "list":
        await handleList(state, squadId, orgId);
        break;

      case "delete":
        await startDeleteFlow(state, squadId, orgId, userMessage);
        break;

      case "create-tasks":
        await handleCreateTasks(state, userMessage, providerConfig);
        break;
      case "view-tasks":
        await handleViewTasks(state, userMessage);
        break;
      case "move-task":
        await handleMoveTask(state, userMessage);
        break;
      case "delete-task":
        await handleDeleteTask(state, userMessage);
        break;
      case "pause-squad":
        await handlePauseSquad(state, userMessage);
        break;
      case "activate-squad":
        await handleActivateSquad(state, userMessage);
        break;
      case "duplicate-squad":
        await handleDuplicateSquad(state, userMessage);
        break;
      case "export-squad":
        await handleExportSquad(state, userMessage);
        break;
      case "change-model":
        await handleChangeModel(state, userMessage);
        break;
      case "change-budget":
        await handleChangeBudget(state, userMessage);
        break;
      case "view-agents":
        await handleViewAgents(state, userMessage);
        break;
      case "install-skill":
        await handleInstallSkill(state, userMessage);
        break;
      case "run-pipeline":
        await handleRunPipeline(state, userMessage);
        break;

      case "general":
      default:
        // Use LLM to handle general message with context
        await handleGeneral(state, squadId, orgId, userMessage, providerConfig);
        break;
    }
  }

  architectStates.set(stateKey, state);
}

// ===================== DISCOVERY (create) =====================

async function handleDiscovery(
  state: ArchitectConversationState,
  squadId: string,
  userMessage: string,
  providerConfig: ProviderConfig,
) {
  const adapter = createAdapter(
    { name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} },
    providerConfig,
  );

  const history = await getHistory(squadId, 30);
  const conversationMessages = history.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
  conversationMessages.push({ role: "user", content: userMessage });

  const systemPrompt = `${ARCHITECT_AGENT.systemPrompt}

## Instrucoes — Fase Discovery
Voce esta coletando informacoes para montar um squad novo.
Perguntas ja feitas: ${state.discoveryStep}. Maximo: 5.

Baseado no HISTORICO da conversa, faca UMA das acoes:

### Se falta informacao (max 5 perguntas):
Faca a PROXIMA pergunta DIFERENTE das anteriores.
Se o usuario respondeu com numero ("1","2"), interprete como selecao da opcao.

### Se ja tem info SUFICIENTE (ou 4+ perguntas):
Monte o design com bloco JSON:

\`\`\`json:squad-design
{"ready":true,"name":"...","code":"...","description":"...","icon":"emoji","performanceMode":"high ou economic","agents":[{"id":"id-kebab","name":"Nome Aliterativo","role":"Funcao","icon":"emoji","modelTier":"powerful ou fast","execution":"inline ou subagent","description":"1 frase"}],"pipeline":[{"step":1,"name":"...","type":"agent","agentId":"id"},{"step":2,"name":"Aprovacao","type":"checkpoint"}],"skills":["web_search","web_fetch"]}
\`\`\`

Depois apresente visualmente com emojis, equipe numerada e pipeline.
Pergunte: "Posso **criar agora**, ou quer **ajustar**?"

## REGRAS
- UMA pergunta por vez, DIFERENTE das anteriores
- Todo squad TEM Reviewer
- Nomes aliterativos, letras iniciais diferentes`;

  const result = await adapter.chat(conversationMessages, systemPrompt);
  const design = extractDesignJson(result.output);

  if (design) {
    state.proposedDesign = design;
    state.phase = "design";
    const display = stripJsonFromOutput(result.output);
    await sendArchitectMessageWithMeta(squadId, display, {
      agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true,
      proposedDesign: design,
    });
  } else {
    state.discoveryStep++;
    if (!state.discovery.purpose) state.discovery.purpose = userMessage;
    await sendArchitectMessage(squadId, result.output);
  }
}

// ===================== DESIGN APPROVAL =====================

async function handleDesignApproval(
  state: ArchitectConversationState,
  squadId: string,
  userMessage: string,
  providerConfig: ProviderConfig,
) {
  const lower = userMessage.toLowerCase();
  const approve = ["criar", "cria", "aprovar", "sim", "ok", "pode criar", "manda", "bora", "perfeito", "show", "gostei", "confirmar", "yes", "go"];
  const reject = ["cancelar", "cancela", "desistir", "parar"];

  const isApprove = approve.some((kw) => lower.includes(kw));
  const isReject = reject.some((kw) => lower.includes(kw));

  if (isApprove && !isReject) {
    if (!state.proposedDesign) {
      await sendArchitectMessage(squadId, "Nao tenho um design pronto. Me descreva o que voce precisa!");
      state.phase = "idle";
      return;
    }
    await sendArchitectMessage(squadId, "Criando seu squad...");
    try {
      const created = await buildSquadFromDesign(state);
      state.createdSquadId = created.id;
      state.phase = "idle";
      const d = state.proposedDesign!;
      await sendArchitectMessage(squadId,
        `**Squad "${d.name}" criado com sucesso!**\n\n${d.agents.length} agentes configurados\n${d.pipeline.length} etapas no pipeline\n\nVoce ja pode encontra-lo na aba **Squads** ou selecionar aqui no chat.\n\nO que mais posso fazer? Posso **editar** esse squad, **criar outro**, ou **listar** seus squads.`
      );
      try {
        const { wsManager } = await import("@/lib/realtime/ws-manager");
        wsManager.broadcastToOrg(state.orgId, { type: "SQUAD_CREATED", squadId: created.id });
      } catch { /* WS */ }
    } catch (error) {
      await sendArchitectMessage(squadId, `Ops, algo deu errado: ${error instanceof Error ? error.message : "Erro"}\n\nQuer tentar novamente?`);
    }
  } else if (isReject) {
    state.phase = "idle";
    await sendArchitectMessage(squadId, "Cancelei a criacao. O que mais posso fazer?");
  } else {
    // Adjustment — use LLM
    const adapter = createAdapter({ name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} }, providerConfig);
    const result = await adapter.chat([{
      role: "user",
      content: `${ARCHITECT_AGENT.systemPrompt}\n\nDesign atual:\n${JSON.stringify(state.proposedDesign, null, 2)}\n\nPedido: "${userMessage}"\n\nAjuste o design e re-apresente com bloco \`\`\`json:squad-design\n{...}\n\`\`\` + apresentacao visual. Pergunte se quer criar ou ajustar mais.`,
    }]);
    const newDesign = extractDesignJson(result.output);
    if (newDesign) state.proposedDesign = newDesign;
    const display = stripJsonFromOutput(result.output);
    await sendArchitectMessageWithMeta(squadId, display, {
      agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true,
      proposedDesign: state.proposedDesign,
    });
  }
}

// ===================== LIST =====================

async function handleList(state: ArchitectConversationState, squadId: string, orgId: string) {
  const squads = await getSquadsByOrgId(orgId);

  if (squads.length === 0) {
    await sendArchitectMessage(squadId, "Voce ainda nao tem squads. Quer **criar** um agora?");
    return;
  }

  const lines = squads.map((s, i) =>
    `${i + 1}. ${s.icon} **${s.name}** — ${s.status === "active" ? "Ativo" : s.status === "paused" ? "Pausado" : s.status}\n   ${s.agentCount} agentes · ${s.taskCount} tasks`
  );

  // Stay in list-action phase to capture next response (number or action)
  state.phase = "list-action";

  await sendArchitectMessage(squadId,
    `**Seus Squads:**\n\n${lines.join("\n\n")}\n\nResponda com o **numero** para selecionar, ou diga o que quer fazer: **editar**, **criar novo** ou **deletar**.`
  );
}

// Handle response after listing squads
async function handleListAction(state: ArchitectConversationState, squadId: string, orgId: string, userMessage: string, providerConfig: ProviderConfig) {
  const squads = await getSquadsByOrgId(orgId);
  const lower = userMessage.toLowerCase();

  // Check if it's an action keyword
  const intent = detectIntent(userMessage);
  if (intent === "create") {
    state.phase = "discovery";
    state.discoveryStep = 0;
    state.discovery = {};
    await handleDiscovery(state, squadId, userMessage, providerConfig);
    return;
  }
  if (intent === "delete") {
    state.phase = "idle";
    await startDeleteFlow(state, squadId, orgId, userMessage);
    return;
  }

  // Try to match squad by number (anywhere in message) or name
  const numMatch = userMessage.match(/\b(\d+)\b/);
  const num = numMatch ? parseInt(numMatch[1]!) : NaN;
  const matched = !isNaN(num) && num >= 1 && num <= squads.length
    ? squads[num - 1]
    : squads.find((s) => lower.includes(s.name.toLowerCase()));

  if (matched) {
    // Selected a squad — enter edit mode with it as context
    state.editSquadId = matched.id;
    state.editSquadName = matched.name;
    state.phase = "edit-modify";

    // Check if message also contains an edit action
    const editWords = ["adicionar", "remover", "mudar", "trocar", "alterar", "agente"];
    if (editWords.some(w => lower.includes(w))) {
      await handleEditModify(state, squadId, userMessage, providerConfig);
    } else {
      await showSquadForEdit(squadId, matched.id, matched.name);
    }
  } else if (intent === "edit") {
    state.phase = "idle";
    await startEditFlow(state, squadId, orgId, userMessage, providerConfig);
  } else {
    // Unclear — go back to idle and let general handler take it
    state.phase = "idle";
    await handleGeneral(state, squadId, orgId, userMessage, providerConfig);
  }
}

// ===================== EDIT FLOW =====================

async function startEditFlow(state: ArchitectConversationState, squadId: string, orgId: string, userMessage: string, providerConfig: ProviderConfig) {
  const squads = await getSquadsByOrgId(orgId);

  if (squads.length === 0) {
    await sendArchitectMessage(squadId, "Voce nao tem squads para editar. Quer **criar** um?");
    return;
  }

  // Try to match squad from message
  const lower = userMessage.toLowerCase();
  const matched = squads.find((s) => lower.includes(s.name.toLowerCase()) || lower.includes(s.code));

  const editWords = ["adicionar", "remover", "mudar", "trocar", "alterar", "quem vai", "falta", "cadê", "cade", "agente que", "agente para", "agente de"];
  const hasEditRequest = editWords.some(w => lower.includes(w));

  // Resolve which squad to edit
  const target = matched ?? (squads.length === 1 ? squads[0]! : null);

  if (target) {
    state.editSquadId = target.id;
    state.editSquadName = target.name;
    state.phase = "edit-modify";

    if (hasEditRequest) {
      // User already said what to change — skip "O que voce quer mudar?" and process directly
      await handleEditModify(state, squadId, userMessage, providerConfig);
    } else {
      // Just asked to edit, show current state
      await showSquadForEdit(squadId, target.id, target.name);
    }
  } else {
    // Multiple squads, none mentioned — list and ask
    state.phase = "edit-select";
    // Save the original edit request so we can process it after squad selection
    state.discovery.customRequirements = hasEditRequest ? userMessage : undefined;
    const lines = squads.map((s, i) => `${i + 1}. ${s.icon} **${s.name}** — ${s.agentCount} agentes`);
    await sendArchitectMessage(squadId, `Qual squad voce quer editar?\n\n${lines.join("\n")}\n\nResponda com o numero ou nome.`);
  }
}

async function showSquadForEdit(chatSquadId: string, squadId: string, squadName: string) {
  const agents = await getAgentsBySquadId(squadId);
  const agentLines = agents.map((a, i) => `${i + 1}. ${a.icon} **${a.name}** — ${a.role} (${a.modelTier})`);

  await sendArchitectMessage(chatSquadId,
    `**${squadName}** — Estado atual:\n\n**Agentes (${agents.length}):**\n${agentLines.join("\n")}\n\nO que voce quer mudar?`
  );
}

async function handleEditSelect(state: ArchitectConversationState, squadId: string, userMessage: string, providerConfig: ProviderConfig) {
  const squads = await getSquadsByOrgId(state.orgId);
  const _numMatch = userMessage.match(/\b(\d+)\b/);
  const num = _numMatch ? parseInt(_numMatch[1]!) : NaN;
  const matched = !isNaN(num) && num >= 1 && num <= squads.length
    ? squads[num - 1]
    : squads.find((s) => userMessage.toLowerCase().includes(s.name.toLowerCase()));

  if (!matched) {
    await sendArchitectMessage(squadId, "Nao encontrei esse squad. Tente pelo numero ou nome.");
    return;
  }

  state.editSquadId = matched.id;
  state.editSquadName = matched.name;
  state.phase = "edit-modify";

  // If there was a saved edit request from before squad selection, process it now
  const savedRequest = state.discovery.customRequirements;
  if (savedRequest) {
    state.discovery.customRequirements = undefined;
    await handleEditModify(state, squadId, savedRequest, providerConfig);
  } else {
    await showSquadForEdit(squadId, matched.id, matched.name);
  }
}

async function handleEditModify(state: ArchitectConversationState, squadId: string, userMessage: string, providerConfig: ProviderConfig) {
  const agents = await getAgentsBySquadId(state.editSquadId!);
  const adapter = createAdapter({ name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} }, providerConfig);

  const agentList = agents.map((a) => `- ${a.icon} ${a.name}: ${a.role} (${a.modelTier})`).join("\n");

  // Include conversation history for context
  const history = await getHistory(squadId, 15);
  const conversationMessages = history.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
  conversationMessages.push({ role: "user", content: userMessage });

  const result = await adapter.chat(conversationMessages, `${ARCHITECT_AGENT.systemPrompt}

## MODO: EDICAO DE SQUAD EXISTENTE
Voce esta EDITANDO o squad "${state.editSquadName}" (ID: ${state.editSquadId}).
NAO crie um squad novo. APENAS modifique o existente.

### Agentes atuais
${agentList}

## INSTRUCAO OBRIGATORIA
Voce DEVE gerar um bloco JSON com as mudancas. SEMPRE inclua o JSON, mesmo que precise fazer uma pergunta.
Se o pedido do usuario e claro, gere o JSON imediatamente.
Se precisar perguntar algo, pergunte E inclua o JSON com sua melhor interpretacao.

\`\`\`json:squad-edit
{
  "changes": [
    {"type": "add-agent", "data": {"name": "Nome Aliterativo", "role": "Funcao", "icon": "emoji", "modelTier": "powerful ou fast", "description": "1 frase"}},
    {"type": "remove-agent", "data": {"name": "Nome do agente a remover"}},
    {"type": "update-agent", "data": {"name": "Nome atual", "updates": {"role": "nova funcao"}}}
  ],
  "summary": "Resumo das mudancas"
}
\`\`\`

Depois do JSON, apresente visualmente:
- ➕ para adicoes, ➖ para remocoes, ✏️ para alteracoes
- Pergunte: "Aplicar essas mudancas ao squad ${state.editSquadName}?"

Regras: Nomes aliterativos, nunca remova Reviewer sem substituto, NAO crie squad novo.`);

  // Try to extract edit JSON
  const editMatch =
    result.output.match(/```json:squad-edit\n([\s\S]*?)\n```/) ||
    result.output.match(/```json\n([\s\S]*?"changes"[\s\S]*?)\n```/) ||
    result.output.match(/```\n([\s\S]*?"changes"[\s\S]*?)\n```/);

  if (editMatch) {
    try {
      const parsed = JSON.parse(editMatch[1]!);
      if (parsed.changes && Array.isArray(parsed.changes)) {
        state.pendingChanges = parsed;
        state.phase = "edit-confirm";
        console.log(`[Architect] Edit JSON parsed: ${parsed.changes.length} changes`);
      }
    } catch (e) {
      console.error("[Architect] Failed to parse edit JSON:", e);
    }
  } else {
    console.log("[Architect] No edit JSON found in LLM response, staying in edit-modify");
  }

  const display = result.output.replace(/```(?:json:squad-edit|json)?\n[\s\S]*?\n```\n?/g, "").trim();
  await sendArchitectMessage(squadId, display);
}

async function handleEditConfirm(state: ArchitectConversationState, squadId: string, userMessage: string, providerConfig: ProviderConfig) {
  const lower = userMessage.toLowerCase();
  const isApprove = ["aplicar", "sim", "ok", "confirmar", "yes", "go", "pode", "manda", "criar", "cria", "bora", "perfeito", "show"].some((kw) => lower.includes(kw));
  const isReject = ["cancelar", "nao", "desistir"].some((kw) => lower.includes(kw));

  if (isApprove) {
    const changes = (state.pendingChanges as { changes: unknown[] } | undefined)?.changes;
    if (!changes || changes.length === 0) {
      await sendArchitectMessage(squadId, "Nao tenho mudancas pendentes para aplicar. Descreva o que quer mudar no squad.");
      state.phase = "edit-modify";
      return;
    }

    await sendArchitectMessage(squadId, "Aplicando mudancas...");
    try {
      await applySquadChanges(state);
      state.phase = "idle";
      state.pendingChanges = undefined;
      console.log(`[Architect] Changes applied to squad ${state.editSquadId}: ${changes.length} changes`);
      await sendArchitectMessage(squadId, `**Mudancas aplicadas ao "${state.editSquadName}"!**\n\nO que mais posso fazer?`);
      try {
        const { wsManager } = await import("@/lib/realtime/ws-manager");
        wsManager.broadcastToOrg(state.orgId, { type: "SQUAD_UPDATED", squadId: state.editSquadId });
      } catch { /* WS */ }
    } catch (error) {
      console.error("[Architect] applySquadChanges error:", error);
      await sendArchitectMessage(squadId, `Erro ao aplicar: ${error instanceof Error ? error.message : "Erro"}`);
    }
  } else if (isReject) {
    state.phase = "idle";
    state.pendingChanges = undefined;
    await sendArchitectMessage(squadId, "Cancelei as mudancas. O que mais posso fazer?");
  } else {
    // More changes requested
    state.phase = "edit-modify";
    await handleEditModify(state, squadId, userMessage, providerConfig);
  }
}

async function applySquadChanges(state: ArchitectConversationState) {
  const changes = (state.pendingChanges as { changes: Array<{ type: string; data: Record<string, unknown> }> })?.changes;
  if (!changes) return;

  const { deleteAgent } = await import("@/lib/db/queries/agents");

  for (const change of changes) {
    switch (change.type) {
      case "add-agent":
        await createAgent({
          squadId: state.editSquadId!,
          name: String(change.data.name),
          role: String(change.data.role),
          icon: String(change.data.icon ?? "🤖"),
          modelTier: (change.data.modelTier as "powerful" | "fast") ?? "powerful",
          runtimeType: "claude-code",
          config: { description: change.data.description },
          monthlyBudgetTokens: 500_000,
        });
        break;

      case "remove-agent": {
        const agents = await getAgentsBySquadId(state.editSquadId!);
        const toRemove = agents.find((a) =>
          a.name.toLowerCase() === String(change.data.name).toLowerCase()
        );
        if (toRemove) {
          await deleteAgent(toRemove.id);
        }
        break;
      }

      case "update-squad":
        await updateSquad(state.editSquadId!, change.data as { name?: string; description?: string; icon?: string });
        break;
    }
  }

  await createAuditLog({
    orgId: state.orgId,
    squadId: state.editSquadId!,
    action: "squad.edited",
    actorType: "system",
    actorId: "system-architect",
    metadata: { changes: changes.length },
  });
}

// ===================== DELETE FLOW =====================

async function startDeleteFlow(state: ArchitectConversationState, squadId: string, orgId: string, userMessage: string) {
  const squads = await getSquadsByOrgId(orgId);
  if (squads.length === 0) {
    await sendArchitectMessage(squadId, "Voce nao tem squads para deletar.");
    return;
  }

  const lower = userMessage.toLowerCase();
  const matched = squads.find((s) => lower.includes(s.name.toLowerCase()));

  if (matched) {
    state.deleteSquadId = matched.id;
    state.deleteSquadName = matched.name;
    state.phase = "delete-confirm";
    await sendArchitectMessage(squadId,
      `**Tem certeza que quer deletar "${matched.name}"?**\n\n` +
      `Isso vai arquivar:\n- ${matched.agentCount} agentes\n- ${matched.taskCount} tasks\n\n` +
      `1. **Sim, deletar**\n2. **Cancelar**`
    );
  } else {
    const lines = squads.map((s, i) => `${i + 1}. ${s.icon} **${s.name}**`);
    state.phase = "delete-confirm";
    await sendArchitectMessage(squadId, `Qual squad quer deletar?\n\n${lines.join("\n")}`);
  }
}

async function handleDeleteConfirm(state: ArchitectConversationState, squadId: string, userMessage: string) {
  const lower = userMessage.toLowerCase();

  if (!state.deleteSquadId) {
    // User is selecting which squad
    const squads = await getSquadsByOrgId(state.orgId);
    const _numMatch = userMessage.match(/\b(\d+)\b/);
  const num = _numMatch ? parseInt(_numMatch[1]!) : NaN;
    const matched = !isNaN(num) && num >= 1 && num <= squads.length ? squads[num - 1] : null;
    if (matched) {
      state.deleteSquadId = matched.id;
      state.deleteSquadName = matched.name;
      await sendArchitectMessage(squadId,
        `**Deletar "${matched.name}"?** ${matched.agentCount} agentes serao arquivados.\n\n1. **Sim**\n2. **Cancelar**`
      );
    } else {
      state.phase = "idle";
      await sendArchitectMessage(squadId, "Cancelado. O que mais posso fazer?");
    }
    return;
  }

  const isConfirm = ["sim", "1", "yes", "deletar", "confirmar"].some((kw) => lower.includes(kw));

  if (isConfirm) {
    await updateSquad(state.deleteSquadId, { status: "archived" });
    await createAuditLog({
      orgId: state.orgId,
      squadId: state.deleteSquadId,
      action: "squad.archived",
      actorType: "system",
      actorId: "system-architect",
      metadata: { squadName: state.deleteSquadName },
    });
    state.phase = "idle";
    await sendArchitectMessage(squadId, `**"${state.deleteSquadName}" foi arquivado.**\n\nO que mais posso fazer?`);
    try {
      const { wsManager } = await import("@/lib/realtime/ws-manager");
      wsManager.broadcastToOrg(state.orgId, { type: "SQUAD_DELETED", squadId: state.deleteSquadId });
    } catch { /* WS */ }
  } else {
    state.phase = "idle";
    await sendArchitectMessage(squadId, "Cancelado. O que mais posso fazer?");
  }
}

// ===================== GENERAL (LLM-routed) =====================

async function handleGeneral(state: ArchitectConversationState, squadId: string, orgId: string, userMessage: string, providerConfig: ProviderConfig) {
  // If the user just created a squad and is commenting about it, treat as edit intent
  if (state.createdSquadId) {
    state.editSquadId = state.createdSquadId;
    state.editSquadName = state.proposedDesign?.name;
    state.phase = "edit-modify";
    state.createdSquadId = undefined;
    await handleEditModify(state, squadId, userMessage, providerConfig);
    return;
  }

  // Generic — use LLM with full org context
  const squads = await getSquadsByOrgId(orgId);
  const { getDashboardMetrics } = await import("@/lib/db/queries/metrics");
  let metricsContext = "";
  try {
    const metrics = await getDashboardMetrics(orgId);
    metricsContext = `
### Metricas do mes
- Squads ativos: ${metrics.squadsActive}
- Tasks completadas: ${metrics.tasksCompletedThisMonth}
- Execucoes hoje: ${metrics.executionsToday}
- Custo estimado: R$ ${(metrics.estimatedCostCentsThisMonth / 100).toFixed(2)}`;
  } catch { /* metrics unavailable */ }

  const adapter = createAdapter({ name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} }, providerConfig);
  const history = await getHistory(squadId, 15);
  const messages = history.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: userMessage });

  const result = await adapter.chat(messages, `${ARCHITECT_AGENT.systemPrompt}

## Dados atuais da organizacao

### Squads (${squads.length})
${squads.map(s => `- ${s.icon} ${s.name} (${s.status}) — ${s.agentCount} agentes, ${s.taskCount} tasks`).join("\n") || "Nenhum squad criado"}
${metricsContext}

## Capacidades
Voce pode:
- **Criar** squads novos
- **Editar** squads existentes (adicionar/remover agentes, mudar config)
- **Listar** squads
- **Deletar** squads

Responda de forma util e sugira acoes relevantes.`);

  await sendArchitectMessage(squadId, result.output);
}

// ===================== Helpers =====================

// Global ref to current conversationId for message tagging
let _currentConversationId: string | undefined;

/** Get messages scoped to current conversation or full squad */
async function getHistory(squadId: string, limit = 30) {
  if (_currentConversationId) {
    return getMessagesByConversationId(squadId, _currentConversationId, limit);
  }
  return getMessagesBySquadId(squadId, undefined, limit);
}

async function sendArchitectMessage(squadId: string, content: string) {
  await sendArchitectMessageWithMeta(squadId, content, {
    agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true,
  });
}

async function sendArchitectMessageWithMeta(squadId: string, content: string, metadata: Record<string, unknown>) {
  if (_currentConversationId) {
    metadata.conversationId = _currentConversationId;
  }
  const msg = await createMessage({
    squadId, agentId: null, content, role: "agent", metadata,
  });
  try {
    const { wsManager } = await import("@/lib/realtime/ws-manager");
    wsManager.broadcastToSquad(squadId, {
      type: "CHAT_MESSAGE",
      message: { ...msg, createdAt: msg.createdAt.toISOString() },
    });
  } catch { /* WS */ }
}

async function recoverStateFromConversation(orgId: string, squadId: string, conversationId: string): Promise<ArchitectConversationState> {
  const history = await getMessagesByConversationId(squadId, conversationId, 50);

  for (let i = history.length - 1; i >= 0; i--) {
    const meta = history[i]!.metadata as Record<string, unknown> | null;
    if (meta?.proposedDesign) {
      return {
        phase: "design", orgId, discovery: {}, discoveryStep: 5,
        proposedDesign: meta.proposedDesign as ArchitectConversationState["proposedDesign"],
      };
    }
  }

  const userMsgCount = history.filter((m) => m.role === "user").length;
  return {
    phase: userMsgCount > 0 ? "idle" : "idle",
    orgId,
    discovery: { purpose: history.find((m) => m.role === "user")?.content },
    discoveryStep: userMsgCount,
  };
}

async function recoverStateFromHistory(orgId: string, squadId: string): Promise<ArchitectConversationState> {
  const history = await getHistory(squadId, 50);

  for (let i = history.length - 1; i >= 0; i--) {
    const meta = history[i]!.metadata as Record<string, unknown> | null;
    if (meta?.proposedDesign) {
      return {
        phase: "design",
        orgId,
        discovery: {},
        discoveryStep: 5,
        proposedDesign: meta.proposedDesign as ArchitectConversationState["proposedDesign"],
      };
    }
  }

  const userMsgCount = history.filter((m) => m.role === "user").length;
  return {
    phase: userMsgCount > 0 ? "idle" : "idle",
    orgId,
    discovery: { purpose: history.find((m) => m.role === "user")?.content },
    discoveryStep: userMsgCount,
  };
}

async function buildSquadFromDesign(state: ArchitectConversationState) {
  const design = state.proposedDesign!;
  const squad = await createSquad({
    orgId: state.orgId,
    name: design.name,
    code: design.code,
    description: design.description,
    icon: design.icon,
    config: { performanceMode: design.performanceMode, pipeline: design.pipeline, skills: design.skills },
  });

  for (const agentDef of design.agents) {
    await createAgent({
      squadId: squad.id,
      name: agentDef.name,
      role: agentDef.role,
      icon: agentDef.icon,
      modelTier: agentDef.modelTier,
      runtimeType: "claude-code",
      config: { execution: agentDef.execution, description: agentDef.description },
      monthlyBudgetTokens: 500_000,
    });
  }

  await createAuditLog({
    orgId: state.orgId, squadId: squad.id, action: "squad.created",
    actorType: "system", actorId: "system-architect",
    metadata: { method: "conversational", agentCount: design.agents.length },
  });

  return squad;
}

// ===================== JSON Extraction =====================

function extractDesignJson(output: string): ArchitectConversationState["proposedDesign"] | null {
  const fencedMatch =
    output.match(/```(?:json:squad-design|json)?\s*\n([\s\S]*?)\n\s*```/) ||
    output.match(/```\s*\n?(\{[\s\S]*?"agents"[\s\S]*?\})\n?\s*```/);

  if (fencedMatch) {
    try {
      const parsed = JSON.parse(fencedMatch[1]!);
      if (parsed.agents && Array.isArray(parsed.agents)) return parsed;
    } catch { /* */ }
  }

  const bareEnd = findBareJsonEnd(output.trimStart());
  if (bareEnd > 0) {
    const offset = output.length - output.trimStart().length;
    try {
      const parsed = JSON.parse(output.slice(offset, offset + bareEnd));
      if (parsed.agents && Array.isArray(parsed.agents)) return parsed;
    } catch { /* */ }
  }

  return null;
}

function stripJsonFromOutput(output: string): string {
  let cleaned = output.replace(/```(?:json:squad-design|json)?\s*\n[\s\S]*?\n\s*```\s*/g, "");
  const bareEnd = findBareJsonEnd(cleaned.trimStart());
  if (bareEnd > 0) {
    const offset = cleaned.length - cleaned.trimStart().length;
    cleaned = cleaned.slice(offset + bareEnd);
  }
  return cleaned.trim();
}

function findBareJsonEnd(text: string): number {
  if (!text.startsWith("{")) return 0;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
    if (depth === 0) return i + 1;
  }
  return 0;
}
