import { createAdapter } from "@orbitmind/engine";
import type { ProviderConfig } from "@orbitmind/engine";
import { getDefaultLlmProvider } from "@/lib/db/queries/llm-providers";
import { createMessage, getMessagesByConversationId, getMessagesBySquadId } from "@/lib/db/queries/messages";
import { getSquadsByOrgId, getSquadWithAgents, createSquad, updateSquad } from "@/lib/db/queries/squads";
import { createAgent, getAgentsBySquadId } from "@/lib/db/queries/agents";
import { createAuditLog } from "@/lib/db/queries/audit-logs";
import { getOrganizationById, updateOrganization } from "@/lib/db/queries/organizations";
import { getIntegrationsByOrgId } from "@/lib/db/queries/integrations";
import { getTopMemories } from "@/lib/db/queries/squad-memories";
import { ARCHITECT_AGENT, ARCHITECT_SQUAD_ID } from "./architect-agent";
import type { ArchitectConversationState } from "./architect-state";
import { detectIntent } from "./architect-state";
import {
  setActionConversationId,
  handleCreateTasks, handleViewTasks, handleMoveTask, handleDeleteTask,
  handlePauseSquad, handleActivateSquad, handleDuplicateSquad, handleExportSquad,
  handleChangeModel, handleChangeBudget, handleViewAgents,
  handleInstallSkill, handleRunPipeline, handleActionSelectSquad,
  handleGuideIntegration, handleConfigSkill, handleSkillSelect, handleSkillConfig, handleSkillConfirm,
} from "./architect-actions";
import {
  setPipelineConversationId,
  handleListPipelineAgents, handleShowAgentDetail,
  handleEditAgent, handleConfirmPipelineEdit, handleConfirmPipelineCreate,
  handleToggleAgent, handleTriggerAgent, handleShowRuns, handleCreateAgent,
} from "./architect-pipeline-actions";

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

  // ── Company Wizard: coleta contexto da empresa antes de qualquer ação ──
  const org = await getOrganizationById(orgId);
  const companyCtx = org?.companyContext as Record<string, unknown> | null;

  if (org && (!companyCtx || !companyCtx.name) && !state.wizardStep) {
    state.wizardStep = 1;
    await sendArchitectMessage(squadId,
      "Bem-vindo ao OrbitMind! Antes de criarmos seu primeiro squad, preciso conhecer sua empresa. São 5 perguntas rápidas!\n\n**1/5 — Como se chama sua empresa ou projeto?**",
    );
    architectStates.set(stateKey, state);
    return;
  }

  if (state.wizardStep && state.wizardStep >= 1 && state.wizardStep <= 5) {
    await handleCompanyWizard(state, squadId, userMessage);
    architectStates.set(stateKey, state);
    return;
  }

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
  } else if (state.phase === "naming") {
    await handleNaming(state, squadId, userMessage);
  } else if (state.phase === "design") {
    await handleDesignApproval(state, squadId, userMessage, providerConfig);
  } else if (state.phase === "list-action") {
    await handleListAction(state, squadId, orgId, userMessage, providerConfig);
  } else if (state.phase === "edit-select") {
    await handleEditSelect(state, squadId, userMessage, providerConfig);
  } else if (state.phase === "edit-modify") {
    await handleEditModify(state, squadId, userMessage, providerConfig);
  } else if (state.phase === "edit-confirm") {
    // Route pipeline confirms vs squad confirms
    const pendingType = (state.pendingChanges as Record<string, unknown> | undefined)?.type;
    if (pendingType === "edit-agent") {
      setPipelineConversationId(conversationId);
      await handleConfirmPipelineEdit(state, userMessage);
    } else if (pendingType === "create-agent") {
      setPipelineConversationId(conversationId);
      await handleConfirmPipelineCreate(state);
    } else {
      await handleEditConfirm(state, squadId, userMessage, providerConfig);
    }
  } else if (state.phase === "delete-confirm") {
    await handleDeleteConfirm(state, squadId, userMessage);
  } else if (state.phase === "action-select-squad") {
    await handleActionSelectSquad(state, userMessage, providerConfig);
  } else if (state.phase === "skill-select") {
    await handleSkillSelect(state, userMessage);
  } else if (state.phase === "skill-config") {
    await handleSkillConfig(state, userMessage);
  } else if (state.phase === "skill-confirm") {
    await handleSkillConfirm(state, userMessage);
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
      case "guide-integration":
        await handleGuideIntegration(state, userMessage);
        break;
      case "config-skill":
        await handleConfigSkill(state, userMessage);
        break;
      case "run-pipeline":
        await handleRunPipeline(state, userMessage);
        break;

      // Pipeline / Esteira management
      case "pipeline-list":
        setPipelineConversationId(conversationId);
        await handleListPipelineAgents(state);
        break;
      case "pipeline-edit":
        setPipelineConversationId(conversationId);
        await handleEditAgent(state, userMessage, providerConfig);
        break;
      case "pipeline-create":
        setPipelineConversationId(conversationId);
        await handleCreateAgent(state, userMessage, providerConfig);
        break;
      case "pipeline-toggle":
        setPipelineConversationId(conversationId);
        await handleToggleAgent(state, userMessage);
        break;
      case "pipeline-trigger":
        setPipelineConversationId(conversationId);
        await handleTriggerAgent(state, userMessage);
        break;
      case "pipeline-runs":
        setPipelineConversationId(conversationId);
        await handleShowRuns(state, userMessage);
        break;
      case "pipeline-detail":
        setPipelineConversationId(conversationId);
        await handleShowAgentDetail(state, userMessage);
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

// ===================== COMPANY WIZARD =====================

async function handleCompanyWizard(
  state: ArchitectConversationState,
  squadId: string,
  userMessage: string,
) {
  if (!state.wizardData) state.wizardData = {};

  const sectorOptions: Record<string, string> = {
    "1": "Marketing Digital", "2": "SaaS / Tecnologia", "3": "E-commerce",
    "4": "Educação", "5": "Saúde", "6": "Financeiro",
  };
  const audienceOptions: Record<string, string> = {
    "1": "Empresas B2B", "2": "Consumidores (B2C)",
    "3": "Empreendedores / startups", "4": "Ambos (B2B e B2C)",
  };
  const toneOptions: Record<string, string> = {
    "1": "Profissional", "2": "Casual", "3": "Técnico",
    "4": "Divertido", "5": "Inspirador", "6": "Provocativo",
  };

  switch (state.wizardStep) {
    case 1:
      state.wizardData.name = userMessage.trim();
      await sendArchitectMessage(squadId,
        `Ótimo, **${state.wizardData.name}**!\n\n**2/5 — Qual o setor de atuação?**\n\n1. Marketing Digital\n2. SaaS / Tecnologia\n3. E-commerce\n4. Educação\n5. Saúde\n6. Financeiro\n7. Outro (descreva)`,
      );
      state.wizardStep = 2;
      break;

    case 2:
      state.wizardData.sector = sectorOptions[userMessage.trim()] || userMessage.trim();
      await sendArchitectMessage(squadId,
        `**3/5 — Quem é seu público-alvo principal?**\n\n1. Empresas B2B\n2. Consumidores (B2C)\n3. Empreendedores / startups\n4. Ambos (B2B e B2C)\n5. Outro (descreva)`,
      );
      state.wizardStep = 3;
      break;

    case 3:
      state.wizardData.audience = audienceOptions[userMessage.trim()] || userMessage.trim();
      await sendArchitectMessage(squadId,
        `**4/5 — Qual tom de comunicação você prefere?**\n\n1. Profissional\n2. Casual\n3. Técnico\n4. Divertido\n5. Inspirador\n6. Provocativo`,
      );
      state.wizardStep = 4;
      break;

    case 4:
      state.wizardData.tone = toneOptions[userMessage.trim()] || userMessage.trim();
      await sendArchitectMessage(squadId,
        `**5/5 — Principais concorrentes ou referências?** (opcional)\n\nDigite nomes de empresas ou perfis, ou "pular" se preferir.`,
      );
      state.wizardStep = 5;
      break;

    case 5: {
      const skip = ["pular", "skip", "nao", "não", "nenhum", ""].includes(userMessage.trim().toLowerCase());
      state.wizardData.competitors = skip ? null : userMessage.trim();

      // Salvar no banco
      await updateOrganization(state.orgId, {
        companyContext: state.wizardData as Record<string, unknown>,
      });

      // Montar resumo
      const summary = [
        `**Empresa:** ${state.wizardData.name}`,
        `**Setor:** ${state.wizardData.sector}`,
        `**Público:** ${state.wizardData.audience}`,
        `**Tom:** ${state.wizardData.tone}`,
        state.wizardData.competitors ? `**Referências:** ${state.wizardData.competitors}` : null,
      ].filter(Boolean).join("\n");

      await sendArchitectMessage(squadId,
        `Pronto! Agora conheço sua empresa.\n\n${summary}\n\nTodos os squads e agentes vão usar essas informações para personalizar o conteúdo.\n\nQuer criar seu primeiro squad? É só me dizer o que precisa!`,
      );

      // Limpar wizard state
      delete state.wizardStep;
      delete state.wizardData;
      state.phase = "idle";
      break;
    }
  }
}

// ===================== CONTEXT BUILDERS =====================

function buildCompanyPrompt(companyCtx: Record<string, unknown> | null): string {
  if (!companyCtx?.name) return "";
  return `
## Contexto da empresa do usuário
- Empresa: ${companyCtx.name}
- Setor: ${companyCtx.sector}
- Público: ${companyCtx.audience}
- Tom: ${companyCtx.tone}
${companyCtx.competitors ? `- Referências: ${companyCtx.competitors}` : ""}

Use essas informações para personalizar todo conteúdo e recomendações.`;
}

function buildIntegrationPrompt(integrations: Array<{ integrationId: string; status: string | null; enabledCapabilities: string[] | null }>): string {
  const connected = integrations.filter(i => i.status === "active");
  if (connected.length > 0) {
    return `
## Integrações conectadas na organização
${connected.map(i => `- **${i.integrationId}**: ${i.enabledCapabilities?.join(", ") || "conectado"}`).join("\n")}

Você pode sugerir ações usando essas integrações. Exemplos:
- Se GitHub está conectado: "Posso criar uma issue no GitHub para isso"
- Se Slack está conectado: "Vou notificar no Slack quando o pipeline terminar"
- Se Jira está conectado: "Posso sincronizar essas tasks com o Jira"`;
  }
  return `
## Integrações
Nenhuma integração conectada. Quando relevante, sugira ao usuário conectar ferramentas em Settings > Integrações para:
- GitHub/GitLab para esteira de desenvolvimento
- Slack/Discord para notificações
- Jira/Linear/Asana para sincronizar tasks`;
}

async function buildOrgContext(orgId: string): Promise<{ companyPrompt: string; integrationPrompt: string }> {
  const org = await getOrganizationById(orgId);
  const companyCtx = org?.companyContext as Record<string, unknown> | null;
  const integrations = await getIntegrationsByOrgId(orgId);
  return {
    companyPrompt: buildCompanyPrompt(companyCtx),
    integrationPrompt: buildIntegrationPrompt(integrations),
  };
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

  const { companyPrompt, integrationPrompt } = await buildOrgContext(state.orgId);

  const history = await getHistory(squadId, 30);
  const conversationMessages = history.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
  conversationMessages.push({ role: "user", content: userMessage });

  const systemPrompt = `${ARCHITECT_AGENT.systemPrompt}
${companyPrompt}
${integrationPrompt}

## Instruções — Fase Discovery
Você está coletando informações para montar um squad novo.
Perguntas já feitas: ${state.discoveryStep}. Máximo: 5.

Baseado no HISTÓRICO da conversa, faça UMA das ações:

### Se falta informação (max 5 perguntas):
Faça a PRÓXIMA pergunta DIFERENTE das anteriores.
Se o usuário respondeu com número ("1","2"), interprete como seleção da opção.

### Se já tem info SUFICIENTE (ou 4+ perguntas):
Monte o design com bloco JSON:

\`\`\`json:squad-design
{"ready":true,"name":"...","code":"...","description":"...","icon":"emoji","performanceMode":"high ou economic","agents":[{"id":"id-kebab","name":"Nome Aliterativo","role":"Função","icon":"emoji","modelTier":"powerful ou fast","execution":"inline ou subagent","description":"1 frase"}],"pipeline":[{"step":1,"name":"...","type":"agent","agentId":"id"},{"step":2,"name":"Aprovação","type":"checkpoint"}],"skills":["web_search","web_fetch"]}
\`\`\`

Depois apresente visualmente com emojis, equipe numerada e pipeline.
Pergunte: "Posso **criar agora**, ou quer **ajustar**?"

## REGRAS
- UMA pergunta por vez, DIFERENTE das anteriores
- Todo squad TEM Reviewer
- Nomes aliterativos, letras iniciais diferentes

## Skills disponíveis para o campo "skills" do design
- "web_search" — pesquisa web
- "web_fetch" — fetch de URLs
- "instagram_publisher" — publicação no Instagram (requer integração)
- "linkedin_publisher" — publicação no LinkedIn (requer integração)
- "blotato_publisher" — publicação multi-plataforma
- "canva_designer" — criação de artes/design
- "apify_scraper" — scraping/pesquisa de concorrentes
- "image_fetcher" — busca de imagens

## IMPORTANTE sobre publicação em redes sociais
Se o usuário mencionar publicação em Instagram, LinkedIn ou qualquer rede social:
1. INCLUA as skills correspondentes (instagram_publisher, linkedin_publisher, etc.) no campo "skills"
2. CRIE um agente DEDICADO para publicação/distribuição (ex: "Paulo Publisher") separado do agente de criação de conteúdo
3. No pipeline, a etapa de publicação deve vir APÓS a revisão/aprovação`;

  const result = await adapter.chat(conversationMessages, systemPrompt);
  const design = extractDesignJson(result.output);

  if (design) {
    state.proposedDesign = design;
    state.phase = "naming";
    const display = stripJsonFromOutput(result.output);
    await sendArchitectMessageWithMeta(squadId, display, {
      agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true,
      proposedDesign: design,
    });
    // Ask the user to name the squad — use LLM for creative suggestions
    const nameAdapter = createAdapter({ name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} }, providerConfig);
    const nameResult = await nameAdapter.chat([{
      role: "user",
      content: `Você é o Arquiteto do OrbitMind. O usuário acabou de aprovar o design de um squad.\n\nDesign:\n- Nome provisório: ${design.name}\n- Descrição: ${design.description}\n- Agentes: ${design.agents.map(a => a.name + " (" + a.role + ")").join(", ")}\n\nSugira 3 nomes criativos e profissionais em português para esse squad. Os nomes devem ser curtos (2-4 palavras), memoráveis e refletir a função do squad.\n\nResponda EXATAMENTE neste formato (sem mais nada):\n**Como você quer chamar esse squad?**\n\nAlgumas sugestões:\n1. **Nome 1**\n2. **Nome 2**\n3. **Nome 3**\n\nVocê pode escolher uma dessas ou digitar o nome que preferir!`,
    }]);
    // Store suggestions in state for number selection
    const sugMatches = [...nameResult.output.matchAll(/\d+\.\s+\*\*(.+?)\*\*/g)];
    state.nameSuggestions = sugMatches.map(m => m[1]!);
    await sendArchitectMessage(squadId, nameResult.output);
  } else {
    state.discoveryStep++;
    if (!state.discovery.purpose) state.discovery.purpose = userMessage;
    await sendArchitectMessage(squadId, result.output);
  }
}

// ===================== NAMING =====================

async function handleNaming(
  state: ArchitectConversationState,
  squadId: string,
  userMessage: string,
) {
  const lower = userMessage.trim().toLowerCase();

  // If the user picks a number (1, 2, 3), map to the suggestion
  if (!state.proposedDesign) {
    state.phase = "idle";
    await sendArchitectMessage(squadId, "Não tenho um design pronto. Me descreva o que você precisa!");
    return;
  }

  let chosenName: string;
  const numberMatch = lower.match(/^(\d)$/);
  if (numberMatch && numberMatch[1] && state.nameSuggestions?.length) {
    const idx = parseInt(numberMatch[1], 10) - 1;
    chosenName = (idx >= 0 && idx < state.nameSuggestions.length)
      ? state.nameSuggestions[idx]!
      : userMessage.trim();
  } else {
    // User typed a custom name
    chosenName = userMessage.trim();
  }

  state.proposedDesign!.name = chosenName;
  state.phase = "design";

  await sendArchitectMessageWithMeta(squadId,
    `Ótimo! O squad vai se chamar **"${chosenName}"** ✨\n\nPosso **criar agora**, ou quer **ajustar** algo antes? Você também pode:\n- **Detalhar** as responsabilidades dos agentes\n- **Trocar o nome** de algum agente (ex: "troca o nome do revisor para X")`,
    {
      agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true,
      proposedDesign: state.proposedDesign,
    }
  );
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
      await sendArchitectMessage(squadId, "Não tenho um design pronto. Me descreva o que você precisa!");
      state.phase = "idle";
      return;
    }
    await sendArchitectMessage(squadId, "Criando seu squad...");
    try {
      const created = await buildSquadFromDesign(state);
      state.createdSquadId = created.id;
      state.phase = "idle";
      const d = state.proposedDesign!;
      // Check if the squad needs integrations to be configured
      const publishingSkills = (d.skills || []).filter(s =>
        s.includes("instagram") || s.includes("linkedin") || s.includes("blotato")
      );
      const skillNames: Record<string, string> = {
        instagram_publisher: "Instagram",
        linkedin_publisher: "LinkedIn",
        blotato_publisher: "Blotato (multi-plataforma)",
      };
      const integrationHint = publishingSkills.length > 0
        ? `\n\n**Próximo passo importante:** Para que a publicação funcione, você precisa configurar as integrações:\n${publishingSkills.map(s => `- **${skillNames[s] || s}** — diga "configurar ${(skillNames[s] || s).toLowerCase()}" para eu te guiar`).join("\n")}`
        : "";
      await sendArchitectMessage(squadId,
        `**Squad "${d.name}" criado com sucesso!**\n\n${d.agents.length} agentes configurados\n${d.pipeline.length} etapas no pipeline\n\nVocê já pode encontrá-lo na aba **Squads** ou selecionar aqui no chat.${integrationHint}\n\nO que mais posso fazer? Posso **editar** esse squad, **criar outro**, ou **listar** seus squads.`
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
    await sendArchitectMessage(squadId, "Cancelei a criação. O que mais posso fazer?");
  } else {
    const adapter = createAdapter({ name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} }, providerConfig);
    const isDetailRequest = /\b(detalh|explic|descrev|o que cada|responsabilidad|funcionalidad|papel de cada|quem faz o qu[eê]|como funciona)\b/i.test(lower);

    const isRenameRequest = /\b(troc|muda|renome|chama|nome d[oae])\b.*\b(agente|revis|brief|social|cria|estrat|conteud|multi)\b/i.test(lower)
      || /\b(agente|revis|brief|social|cria|estrat|conteud|multi)\b.*\b(troc|muda|renome|chama|nome)\b/i.test(lower);

    if (isDetailRequest && state.proposedDesign) {
      // Detail/explain — describe agents and pipeline without re-presenting JSON
      const result = await adapter.chat([{
        role: "user",
        content: `${ARCHITECT_AGENT.systemPrompt}\n\nDesign atual:\n${JSON.stringify(state.proposedDesign, null, 2)}\n\nO usuário pediu: "${userMessage}"\n\nDetalhe as responsabilidades de cada agente do squad, explicando:\n- O que cada agente faz especificamente\n- Por que esse agente é necessário no pipeline\n- Que tipo de output ele produz\n- Como ele se conecta com o próximo agente\n\nExplique também o fluxo completo do pipeline passo a passo.\n\nNÃO re-apresente o JSON do design. Apenas explique de forma clara e didática.\nNo final, pergunte se o usuário quer criar o squad, fazer ajustes, ou tem mais dúvidas.`,
      }]);
      const display = stripJsonFromOutput(result.output);
      await sendArchitectMessageWithMeta(squadId, display, {
        agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true,
        proposedDesign: state.proposedDesign,
      });
    } else if (isRenameRequest && state.proposedDesign) {
      // Rename agent — use LLM to interpret which agent and the new name
      const result = await adapter.chat([{
        role: "user",
        content: `${ARCHITECT_AGENT.systemPrompt}\n\nDesign atual:\n${JSON.stringify(state.proposedDesign, null, 2)}\n\nO usuário pediu: "${userMessage}"\n\nO usuário quer trocar o nome de um ou mais agentes do squad. Identifique qual agente ele quer renomear e qual o novo nome.\n\nResponda com o bloco JSON atualizado:\n\`\`\`json:squad-design\n{...design completo com o nome atualizado...}\n\`\`\`\n\nDepois apresente a equipe atualizada visualmente e confirme a mudança.\nPergunte se quer criar o squad ou ajustar mais.`,
      }]);
      const newDesign = extractDesignJson(result.output);
      if (newDesign) state.proposedDesign = newDesign;
      const display = stripJsonFromOutput(result.output);
      await sendArchitectMessageWithMeta(squadId, display, {
        agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true,
        proposedDesign: state.proposedDesign,
      });
    } else {
      // Adjustment — use LLM to modify the design
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
}

// ===================== LIST =====================

async function handleList(state: ArchitectConversationState, squadId: string, orgId: string) {
  const squads = await getSquadsByOrgId(orgId);

  if (squads.length === 0) {
    await sendArchitectMessage(squadId, "Você ainda não tem squads. Quer **criar** um agora?");
    return;
  }

  const lines = squads.map((s, i) =>
    `${i + 1}. ${s.icon} **${s.name}** — ${s.status === "active" ? "Ativo" : s.status === "paused" ? "Pausado" : s.status}\n   ${s.agentCount} agentes · ${s.taskCount} tasks`
  );

  // Stay in list-action phase to capture next response (number or action)
  state.phase = "list-action";

  await sendArchitectMessage(squadId,
    `**Seus Squads:**\n\n${lines.join("\n\n")}\n\nResponda com o **número** para selecionar, ou diga o que quer fazer: **editar**, **criar novo** ou **deletar**.`
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
    await sendArchitectMessage(squadId, "Você não tem squads para editar. Quer **criar** um?");
    return;
  }

  // Try to match squad from message
  const lower = userMessage.toLowerCase();
  const matched = squads.find((s) => lower.includes(s.name.toLowerCase()) || lower.includes(s.code));

  const editWords = ["adicionar", "remover", "mudar", "trocar", "alterar", "quem vai", "falta", "cadê", "cade", "agente que", "agente para", "agente de"];
  const hasEditRequest = editWords.some(w => lower.includes(w));

  // Resolve which squad to edit — prefer recent context (last edited or just created)
  const recentSquadId = state.editSquadId ?? state.createdSquadId;
  const recentContext = recentSquadId ? squads.find(s => s.id === recentSquadId) : null;
  const target = matched ?? recentContext ?? (squads.length === 1 ? squads[0]! : null);

  if (target) {
    state.editSquadId = target.id;
    state.editSquadName = target.name;
    state.phase = "edit-modify";

    if (hasEditRequest) {
      // User already said what to change — skip "O que você quer mudar?" and process directly
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
    await sendArchitectMessage(squadId, `Qual squad você quer editar?\n\n${lines.join("\n")}\n\nResponda com o número ou nome.`);
  }
}

async function showSquadForEdit(chatSquadId: string, squadId: string, squadName: string) {
  const agents = await getAgentsBySquadId(squadId);
  const agentLines = agents.map((a, i) => `${i + 1}. ${a.icon} **${a.name}** — ${a.role} (${a.modelTier})`);

  await sendArchitectMessage(chatSquadId,
    `**${squadName}** — Estado atual:\n\n**Agentes (${agents.length}):**\n${agentLines.join("\n")}\n\nO que você quer mudar?`
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
    await sendArchitectMessage(squadId, "Não encontrei esse squad. Tente pelo número ou nome.");
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

  const { companyPrompt } = await buildOrgContext(state.orgId);

  const result = await adapter.chat(conversationMessages, `${ARCHITECT_AGENT.systemPrompt}
${companyPrompt}

## MODO: EDIÇÃO DE SQUAD EXISTENTE
Você está EDITANDO o squad "${state.editSquadName}" (ID: ${state.editSquadId}).
NÃO crie um squad novo. APENAS modifique o existente.

### Agentes atuais
${agentList}

## INSTRUÇÃO OBRIGATÓRIA
Você DEVE gerar um bloco JSON com as mudanças. SEMPRE inclua o JSON, mesmo que precise fazer uma pergunta.
Se o pedido do usuário é claro, gere o JSON imediatamente.
Se precisar perguntar algo, pergunte E inclua o JSON com sua melhor interpretação.

\`\`\`json:squad-edit
{
  "changes": [
    {"type": "add-agent", "data": {"name": "Nome Aliterativo", "role": "Função", "icon": "emoji", "modelTier": "powerful ou fast", "description": "1 frase"}},
    {"type": "remove-agent", "data": {"name": "Nome do agente a remover"}},
    {"type": "update-agent", "data": {"name": "Nome atual", "updates": {"role": "nova função"}}}
  ],
  "summary": "Resumo das mudanças"
}
\`\`\`

Depois do JSON, apresente visualmente:
- ➕ para adições, ➖ para remoções, ✏️ para alterações
- Pergunte: "Aplicar essas mudanças ao squad ${state.editSquadName}?"

Regras: Nomes aliterativos, nunca remova Reviewer sem substituto, NÃO crie squad novo.`);

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
      await sendArchitectMessage(squadId, "Não tenho mudanças pendentes para aplicar. Descreva o que quer mudar no squad.");
      state.phase = "edit-modify";
      return;
    }

    await sendArchitectMessage(squadId, "Aplicando mudanças...");
    try {
      await applySquadChanges(state);
      state.phase = "idle";
      state.pendingChanges = undefined;
      console.log(`[Architect] Changes applied to squad ${state.editSquadId}: ${changes.length} changes`);
      await sendArchitectMessage(squadId, `**Mudanças aplicadas ao "${state.editSquadName}"!**\n\nO que mais posso fazer?`);
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
    await sendArchitectMessage(squadId, "Cancelei as mudanças. O que mais posso fazer?");
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
    await sendArchitectMessage(squadId, "Você não tem squads para deletar.");
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
        `**Deletar "${matched.name}"?** ${matched.agentCount} agentes serão arquivados.\n\n1. **Sim**\n2. **Cancelar**`
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
### Métricas do mês
- Squads ativos: ${metrics.squadsActive}
- Tasks completadas: ${metrics.tasksCompletedThisMonth}
- Execuções hoje: ${metrics.executionsToday}
- Custo estimado: R$ ${(metrics.estimatedCostCentsThisMonth / 100).toFixed(2)}`;
  } catch { /* metrics unavailable */ }

  const { companyPrompt, integrationPrompt } = await buildOrgContext(orgId);

  const adapter = createAdapter({ name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} }, providerConfig);
  const history = await getHistory(squadId, 15);
  const messages = history.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: userMessage });

  const result = await adapter.chat(messages, `${ARCHITECT_AGENT.systemPrompt}
${companyPrompt}
${integrationPrompt}

## Dados atuais da organização

### Squads (${squads.length})
${squads.map(s => `- ${s.icon} ${s.name} (${s.status}) — ${s.agentCount} agentes, ${s.taskCount} tasks`).join("\n") || "Nenhum squad criado"}
${metricsContext}

## Capacidades
Você pode:
- **Criar** squads novos
- **Editar** squads existentes (adicionar/remover agentes, mudar config)
- **Listar** squads
- **Deletar** squads

Responda de forma útil e sugira ações relevantes.`);

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
