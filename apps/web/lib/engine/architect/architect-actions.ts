/**
 * Architect Actions — All capabilities beyond squad CRUD
 *
 * Tasks: create, move, delete, view
 * Squad: pause, activate, duplicate, export, run
 * Agent: change model, change budget, view
 * Skills: install, guide, configure via chat
 */

import { createAdapter } from "@orbitmind/engine";
import type { ProviderConfig } from "@orbitmind/engine";
import { SKILL_REGISTRY, getSkillById } from "@orbitmind/engine";
import type { SkillDefinition } from "@orbitmind/engine";
import { getSquadsByOrgId, getSquadWithAgents, createSquad, updateSquad } from "@/lib/db/queries/squads";
import { getAgentsBySquadId, createAgent, updateAgent } from "@/lib/db/queries/agents";
import { getTasksBySquadId, createTask, updateTask, deleteTask } from "@/lib/db/queries/tasks";
import { getSkillsByOrgId, installSkill, updateSkill } from "@/lib/db/queries/skills";
import { createAuditLog } from "@/lib/db/queries/audit-logs";
import { createMessage, getMessagesByConversationId, getMessagesBySquadId } from "@/lib/db/queries/messages";
import { ARCHITECT_AGENT, ARCHITECT_SQUAD_ID } from "./architect-agent";
import type { ArchitectConversationState } from "./architect-state";

let _convId: string | undefined;

export function setActionConversationId(id: string | undefined) {
  _convId = id;
}

async function sendMsg(content: string) {
  const metadata: Record<string, unknown> = { agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true };
  if (_convId) metadata.conversationId = _convId;
  const msg = await createMessage({ squadId: ARCHITECT_SQUAD_ID, agentId: null, content, role: "agent", metadata });
  try {
    const { wsManager } = await import("@/lib/realtime/ws-manager");
    wsManager.broadcastToSquad(ARCHITECT_SQUAD_ID, { type: "CHAT_MESSAGE", message: { ...msg, createdAt: msg.createdAt.toISOString() } });
  } catch { /* */ }
}

/** Resolve which squad the user is referring to */
async function resolveSquad(state: ArchitectConversationState, userMessage: string): Promise<{ id: string; name: string } | null> {
  // If we have an editSquadId from a previous flow, use it
  if (state.editSquadId) return { id: state.editSquadId, name: state.editSquadName ?? "" };
  if (state.createdSquadId) return { id: state.createdSquadId, name: state.proposedDesign?.name ?? "" };

  const squads = await getSquadsByOrgId(state.orgId);
  if (squads.length === 0) return null;
  if (squads.length === 1) return { id: squads[0]!.id, name: squads[0]!.name };

  // Try match by name or number
  const lower = userMessage.toLowerCase();
  const numMatch = userMessage.match(/\b(\d+)\b/);
  const num = numMatch ? parseInt(numMatch[1]!) : NaN;
  if (!isNaN(num) && num >= 1 && num <= squads.length) return { id: squads[num - 1]!.id, name: squads[num - 1]!.name };
  const byName = squads.find((s) => lower.includes(s.name.toLowerCase()));
  if (byName) return { id: byName.id, name: byName.name };

  return null;
}

// ===================== TASKS =====================

export async function handleCreateTasks(state: ArchitectConversationState, userMessage: string, providerConfig: ProviderConfig) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) {
    const squads = await getSquadsByOrgId(state.orgId);
    if (squads.length === 0) { await sendMsg("Você não tem squads. Crie um primeiro!"); return; }
    state.phase = "action-select-squad";
    state.pendingAction = "create-tasks";
    state.pendingActionMessage = userMessage;
    const lines = squads.map((s, i) => `${i + 1}. ${s.icon} **${s.name}** — ${s.agentCount} agentes`);
    await sendMsg(`Para qual squad devo criar as tasks?\n\n${lines.join("\n")}`);
    return;
  }

  const agents = await getAgentsBySquadId(squad.id);
  if (agents.length === 0) { await sendMsg(`Squad "${squad.name}" não tem agentes. Adicione agentes primeiro.`); return; }

  // Use LLM to generate tasks based on agents
  const adapter = createAdapter({ name: ARCHITECT_AGENT.name, role: ARCHITECT_AGENT.role, config: {} }, providerConfig);
  const agentList = agents.map((a) => `- ${a.icon} ${a.name}: ${a.role}`).join("\n");

  const result = await adapter.chat([{
    role: "user",
    content: `Gere tasks para o squad "${squad.name}" baseado nos agentes:

${agentList}

Retorne APENAS um JSON:
\`\`\`json:tasks
[
  {"title": "Título da task", "description": "Descrição", "priority": "p0|p1|p2|p3", "type": "feature|content|research|review", "agentName": "Nome do agente responsável"}
]
\`\`\`

Regras:
- 2-4 tasks por agente
- Prioridades variadas (pelo menos 1 p0 e 1 p1)
- Tipos variados
- Descrições com 1-2 frases explicando o que fazer
- Tasks em português brasileiro
- Status: todas "ready"`,
  }]);

  const jsonMatch = result.output.match(/```(?:json:tasks|json)\n([\s\S]*?)\n```/) ||
    result.output.match(/\[([\s\S]*?)\]/);

  let tasksCreated = 0;
  if (jsonMatch) {
    try {
      const raw = jsonMatch[1]!.startsWith("[") ? jsonMatch[1]! : `[${jsonMatch[1]}]`;
      const taskDefs = JSON.parse(raw) as Array<{ title: string; description: string; priority: string; type: string; agentName: string }>;

      for (const t of taskDefs) {
        const agent = agents.find((a) => a.name.toLowerCase().includes(t.agentName.toLowerCase().split(" ")[0]!));
        await createTask({
          squadId: squad.id,
          title: t.title,
          description: t.description,
          priority: (t.priority as "p0" | "p1" | "p2" | "p3") || "p2",
          type: (t.type as "feature" | "content" | "research" | "review") || "feature",
          status: "ready",
          assignedAgentId: agent?.id,
        });
        tasksCreated++;
      }
    } catch (e) {
      console.error("[Architect] Failed to parse tasks JSON:", e);
    }
  }

  if (tasksCreated > 0) {
    await sendMsg(`**${tasksCreated} tasks criadas para "${squad.name}"!**\n\nAs tasks estão no board como "Ready". Acesse **/board** para visualizar.`);
    await createAuditLog({ orgId: state.orgId, squadId: squad.id, action: "tasks.batch-created", actorType: "system", actorId: "system-architect", metadata: { count: tasksCreated } });
  } else {
    await sendMsg("Não consegui gerar as tasks. Tente descrever mais especificamente o que cada agente deve fazer.");
  }
  state.phase = "idle";
}

export async function handleViewTasks(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) {
    const squads = await getSquadsByOrgId(state.orgId);
    if (squads.length === 0) { await sendMsg("Você não tem squads."); return; }
    if (squads.length === 1) {
      const tasks = await getTasksBySquadId(squads[0]!.id);
      await formatAndSendTasks(squads[0]!.name, tasks);
      return;
    }
    state.phase = "action-select-squad";
    state.pendingAction = "view-tasks";
    const lines = squads.map((s, i) => `${i + 1}. ${s.icon} **${s.name}**`);
    await sendMsg(`De qual squad?\n\n${lines.join("\n")}`);
    return;
  }

  const tasks = await getTasksBySquadId(squad.id);
  await formatAndSendTasks(squad.name, tasks);
  state.phase = "idle";
}

async function formatAndSendTasks(squadName: string, tasks: Array<{ title: string; status: string; priority: string; assignedAgentId: string | null }>) {
  if (tasks.length === 0) { await sendMsg(`**${squadName}** não tem tasks. Quer que eu crie?`); return; }

  const byStatus: Record<string, typeof tasks> = {};
  for (const t of tasks) { (byStatus[t.status] ??= []).push(t); }

  const statusLabels: Record<string, string> = { backlog: "Backlog", ready: "Ready", in_progress: "Em Progresso", in_review: "Em Revisão", done: "Concluído", blocked: "Bloqueado" };
  const lines: string[] = [`**Board de ${squadName}** (${tasks.length} tasks)\n`];

  for (const [status, items] of Object.entries(byStatus)) {
    lines.push(`**${statusLabels[status] ?? status}** (${items.length})`);
    for (const t of items) {
      lines.push(`- [${t.priority.toUpperCase()}] ${t.title}`);
    }
    lines.push("");
  }

  await sendMsg(lines.join("\n"));
}

export async function handleMoveTask(state: ArchitectConversationState, userMessage: string) {
  // Parse: "mova task X para Done"
  const statusMap: Record<string, string> = {
    backlog: "backlog", ready: "ready", "em progresso": "in_progress", "in progress": "in_progress",
    "em revisão": "in_review", "in review": "in_review", done: "done", concluido: "done", pronto: "done",
    bloqueado: "blocked", blocked: "blocked",
  };

  let targetStatus: string | undefined;
  for (const [keyword, status] of Object.entries(statusMap)) {
    if (userMessage.toLowerCase().includes(keyword)) { targetStatus = status; break; }
  }

  if (!targetStatus) {
    await sendMsg("Para qual status? (backlog, ready, em progresso, em revisão, done, bloqueado)");
    return;
  }

  // Try to find the task by title fragment
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad? Especifique o nome."); return; }

  const tasks = await getTasksBySquadId(squad.id);
  const lower = userMessage.toLowerCase();
  const matched = tasks.find((t) => lower.includes(t.title.toLowerCase().slice(0, 20)));

  if (matched) {
    await updateTask(matched.id, { status: targetStatus as "backlog" | "ready" | "in_progress" | "in_review" | "done" | "blocked" });
    await sendMsg(`**Task movida!**\n"${matched.title}" → **${targetStatus}**`);
  } else {
    await sendMsg(`Não encontrei essa task. As tasks do squad "${squad.name}":\n${tasks.map((t) => `- ${t.title} (${t.status})`).join("\n")}`);
  }
  state.phase = "idle";
}

export async function handleDeleteTask(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad?"); return; }

  const tasks = await getTasksBySquadId(squad.id);
  const lower = userMessage.toLowerCase();
  const matched = tasks.find((t) => lower.includes(t.title.toLowerCase().slice(0, 20)));

  if (matched) {
    await deleteTask(matched.id);
    await sendMsg(`**Task deletada:** "${matched.title}"`);
  } else {
    await sendMsg(`Não encontrei. Tasks do squad:\n${tasks.map((t) => `- ${t.title}`).join("\n")}`);
  }
  state.phase = "idle";
}

// ===================== SQUAD MANAGEMENT =====================

export async function handlePauseSquad(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad quer pausar?"); return; }
  await updateSquad(squad.id, { status: "paused" });
  await sendMsg(`**Squad "${squad.name}" pausado.** Para reativar, diga "ativar ${squad.name}".`);
  state.phase = "idle";
}

export async function handleActivateSquad(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad quer ativar?"); return; }
  await updateSquad(squad.id, { status: "active" });
  await sendMsg(`**Squad "${squad.name}" ativado!**`);
  state.phase = "idle";
}

export async function handleDuplicateSquad(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad quer duplicar?"); return; }

  const original = await getSquadWithAgents(squad.id);
  if (!original) { await sendMsg("Squad não encontrado."); return; }

  const newSquad = await createSquad({
    orgId: state.orgId,
    name: `${original.name} (cópia)`,
    code: `${original.code}-copy-${Date.now().toString(36)}`,
    description: original.description ?? undefined,
    icon: original.icon ?? undefined,
    config: original.config as Record<string, unknown>,
  });

  for (const agent of original.agents) {
    await createAgent({
      squadId: newSquad.id,
      name: agent.name,
      role: agent.role,
      icon: agent.icon ?? undefined,
      modelTier: agent.modelTier,
      runtimeType: agent.runtimeType,
      config: agent.config as Record<string, unknown>,
      monthlyBudgetTokens: agent.monthlyBudgetTokens ?? undefined,
    });
  }

  await sendMsg(`**Squad duplicado!**\n"${newSquad.name}" criado com ${original.agents.length} agentes.`);
  state.phase = "idle";
}

export async function handleExportSquad(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad quer exportar?"); return; }

  const data = await getSquadWithAgents(squad.id);
  if (!data) { await sendMsg("Squad não encontrado."); return; }

  const yaml = {
    name: data.name,
    code: data.code,
    icon: data.icon,
    description: data.description,
    config: data.config,
    agents: data.agents.map((a) => ({
      name: a.name,
      role: a.role,
      icon: a.icon,
      modelTier: a.modelTier,
      runtimeType: a.runtimeType,
    })),
  };

  await sendMsg(`**Config do squad "${data.name}":**\n\n\`\`\`json\n${JSON.stringify(yaml, null, 2)}\n\`\`\``);
  state.phase = "idle";
}

// ===================== AGENT CONFIG =====================

export async function handleChangeModel(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad?"); return; }

  const agents = await getAgentsBySquadId(squad.id);
  const lower = userMessage.toLowerCase();

  // Find agent mentioned
  const agent = agents.find((a) => lower.includes(a.name.toLowerCase().split(" ")[0]!.toLowerCase()));
  if (!agent) {
    await sendMsg(`Qual agente? Agentes do squad:\n${agents.map((a) => `- ${a.icon} ${a.name} (${a.modelTier})`).join("\n")}`);
    return;
  }

  // Detect target model
  const newTier = lower.includes("haiku") || lower.includes("fast") || lower.includes("rapido")
    ? "fast"
    : lower.includes("opus") || lower.includes("sonnet") || lower.includes("powerful") || lower.includes("poderoso")
      ? "powerful"
      : null;

  if (!newTier) {
    await sendMsg(`Qual modelo? Opções:\n- **powerful** (Opus/Sonnet — mais inteligente)\n- **fast** (Haiku — mais rápido e econômico)\n\n${agent.name} atualmente usa: **${agent.modelTier}**`);
    return;
  }

  await updateAgent(agent.id, { modelTier: newTier });
  await sendMsg(`**Modelo atualizado!**\n${agent.icon} ${agent.name}: ${agent.modelTier} → **${newTier}**`);
  state.phase = "idle";
}

export async function handleChangeBudget(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad?"); return; }

  const agents = await getAgentsBySquadId(squad.id);
  const lower = userMessage.toLowerCase();

  const agent = agents.find((a) => lower.includes(a.name.toLowerCase().split(" ")[0]!.toLowerCase()));
  if (!agent) {
    await sendMsg(`Qual agente?\n${agents.map((a) => `- ${a.icon} ${a.name} (${((a.monthlyBudgetTokens ?? 0) / 1000).toFixed(0)}k tokens)`).join("\n")}`);
    return;
  }

  // Extract number from message
  const numMatch = userMessage.match(/(\d[\d.,]*)\s*(k|m|mil|milhao|milhões)?/i);
  if (!numMatch) {
    await sendMsg(`Qual o novo limite? Ex: "500k tokens" ou "1M tokens"\n\n${agent.name} atual: **${((agent.monthlyBudgetTokens ?? 0) / 1000).toFixed(0)}k tokens**`);
    return;
  }

  let tokens = parseFloat(numMatch[1]!.replace(",", "."));
  const unit = (numMatch[2] ?? "").toLowerCase();
  if (unit === "k" || unit === "mil") tokens *= 1000;
  if (unit === "m" || unit === "milhao" || unit === "milhões") tokens *= 1_000_000;

  await updateAgent(agent.id, { monthlyBudgetTokens: Math.round(tokens) });
  await sendMsg(`**Budget atualizado!**\n${agent.icon} ${agent.name}: **${(tokens / 1000).toFixed(0)}k tokens/mês**`);
  state.phase = "idle";
}

export async function handleViewAgents(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) {
    const squads = await getSquadsByOrgId(state.orgId);
    if (squads.length === 1) {
      const agents = await getAgentsBySquadId(squads[0]!.id);
      await formatAndSendAgents(squads[0]!.name, agents);
      return;
    }
    await sendMsg("Qual squad?");
    return;
  }

  const agents = await getAgentsBySquadId(squad.id);
  await formatAndSendAgents(squad.name, agents);
  state.phase = "idle";
}

async function formatAndSendAgents(squadName: string, agents: Array<{ icon: string | null; name: string; role: string; modelTier: string; status: string; monthlyBudgetTokens: number | null; budgetUsedTokens: number | null }>) {
  if (agents.length === 0) { await sendMsg(`**${squadName}** não tem agentes.`); return; }

  const lines = [`**Agentes de ${squadName}** (${agents.length})\n`];
  for (const a of agents) {
    const budgetPct = a.monthlyBudgetTokens ? Math.round(((a.budgetUsedTokens ?? 0) / a.monthlyBudgetTokens) * 100) : 0;
    lines.push(`${a.icon} **${a.name}** — ${a.role}`);
    lines.push(`  Modelo: ${a.modelTier} · Status: ${a.status} · Budget: ${budgetPct}%`);
  }
  await sendMsg(lines.join("\n"));
}

export async function handleInstallSkill(state: ArchitectConversationState, userMessage: string) {
  // Check which skills are already installed
  const installed = await getSkillsByOrgId(state.orgId);
  const installedIds = new Set(installed.map(s => s.skillId));

  const lines = SKILL_REGISTRY.map((s, i) => {
    const status = installedIds.has(s.id)
      ? (installed.find(x => x.skillId === s.id)?.isActive ? "✅ Ativo" : "⏸️ Inativo")
      : "⚪ Não configurado";
    return `${i + 1}. ${s.icon} **${s.name}** — ${status}`;
  });

  await sendMsg(
    `**Skills disponíveis:**\n\n${lines.join("\n")}\n\n` +
    `Responda com o **número** ou **nome** da skill para configurar, ou diga "guia instagram" para um passo a passo.`,
  );
  state.phase = "skill-select";
}

// ===================== INTEGRATION GUIDE =====================

const INTEGRATION_GUIDES: Record<string, string> = {
  "instagram": `## 📸 Como integrar com o Instagram

**Requisitos:**
- Conta Instagram **Business** ou **Creator** (não pode ser pessoal)
- Conta conectada a uma **Facebook Page**

**Passo a passo:**

### 1. Criar app no Facebook Developers
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Clique em **"Criar App"** → tipo **"Business"**
3. Dê um nome (ex: "OrbitMind Publisher") e crie

### 2. Adicionar Instagram Graph API
1. No painel do app, vá em **"Adicionar Produto"**
2. Encontre **"Instagram Graph API"** e clique **"Configurar"**

### 3. Gerar Token de Acesso
1. Vá em **Graph API Explorer** (menu "Ferramentas")
2. Selecione seu app no dropdown
3. Clique **"Gerar Token de Acesso"**
4. Marque as permissões:
   - \`instagram_basic\`
   - \`instagram_content_publish\`
   - \`pages_show_list\`
   - \`pages_read_engagement\`
5. Autorize e copie o **token gerado**

### 4. Obter seu Instagram User ID
1. No Graph API Explorer, faça: \`GET /me/accounts\`
2. Copie o **Page ID** da sua página
3. Faça: \`GET /{PAGE_ID}?fields=instagram_business_account\`
4. O valor de \`instagram_business_account.id\` é seu **INSTAGRAM_USER_ID**

### 5. Gerar Token de Longa Duração (60 dias)
No Graph API Explorer:
\`\`\`
GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SEU_TOKEN}
\`\`\`

### 6. Configurar no OrbitMind
Você precisa de dois valores:
- **INSTAGRAM_USER_ID**: o ID obtido no passo 4
- **INSTAGRAM_ACCESS_TOKEN**: o token de longa duração do passo 5

Quer que eu **configure agora** com esses dados? Basta me passar o User ID e o Token!`,

  "linkedin": `## 💼 Como integrar com o LinkedIn

**Passo a passo:**

### 1. Criar app no LinkedIn Developers
1. Acesse [linkedin.com/developers](https://www.linkedin.com/developers/)
2. Clique em **"Create App"**
3. Preencha nome, logotipo e associe a uma Company Page
4. Crie o app

### 2. Solicitar produtos
1. Na aba **"Products"** do seu app, solicite:
   - **"Share on LinkedIn"** — para publicar posts
   - **"Sign In with LinkedIn using OpenID Connect"** — para autenticação
2. Aguarde aprovação (geralmente automática)

### 3. Configurar OAuth
1. Na aba **"Auth"**, anote o **Client ID** e **Client Secret**
2. Em **"Redirect URLs"**, adicione uma URL (ex: \`https://seusite.com/callback\`)

### 4. Obter Token de Acesso
Abra no navegador (substitua os valores):
\`\`\`
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URL}&scope=openid%20w_member_social
\`\`\`
1. Autorize o app
2. Você será redirecionado com um \`code\` na URL
3. Troque o code por token via POST:
\`\`\`
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code={CODE}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&redirect_uri={REDIRECT_URL}
\`\`\`
4. Copie o **access_token** da resposta

### 5. Obter seu Author URN
Com o token, faça:
\`\`\`
GET https://api.linkedin.com/v2/userinfo
Authorization: Bearer {SEU_TOKEN}
\`\`\`
O campo \`sub\` é seu ID → Author URN: \`urn:li:person:{sub}\`

### 6. Configurar no OrbitMind
Você precisa de dois valores:
- **LINKEDIN_ACCESS_TOKEN**: o token obtido no passo 4
- **LINKEDIN_AUTHOR_URN**: o URN obtido no passo 5 (\`urn:li:person:...\`)

Quer que eu **configure agora**? Basta me passar o Token e o Author URN!`,

  "blotato": `## 🌐 Como integrar com o Blotato (Multi-plataforma)

O Blotato é a opção mais simples — publica em **Instagram, LinkedIn, Twitter, TikTok e YouTube** com uma única integração.

**Passo a passo:**

### 1. Criar conta no Blotato
1. Acesse [app.blotato.com](https://app.blotato.com)
2. Crie uma conta gratuita

### 2. Conectar suas redes sociais
1. No painel, conecte cada rede que quiser usar:
   - Instagram, LinkedIn, Twitter/X, TikTok, YouTube
2. Autorize cada uma

### 3. Gerar API Key
1. Vá em **Settings > API Keys**
2. Clique em **"Generate New Key"**
3. Copie a chave gerada

### 4. Configurar no OrbitMind
Você precisa de apenas UM valor:
- **BLOTATO_API_KEY**: a chave gerada no passo 3

Quer que eu **configure agora**? Basta me passar a API Key!`,

  "canva": `## 🎨 Como integrar com o Canva

**Passo a passo:**

### 1. Acessar o Portal de Desenvolvedor
1. Acesse [canva.com/developers](https://www.canva.com/developers/)
2. Crie um novo app

### 2. Configurar OAuth
1. Configure as permissões do app
2. Gere um token de acesso OAuth

### 3. Configurar no OrbitMind
Você precisa de:
- **CANVA_ACCESS_TOKEN**: o token OAuth gerado

Quer que eu **configure agora**? Basta me passar o Token!`,

  "apify": `## 🕷️ Como integrar com o Apify (Web Scraping)

**Passo a passo:**

### 1. Criar conta no Apify
1. Acesse [console.apify.com](https://console.apify.com)
2. Crie uma conta (plano gratuito disponível)

### 2. Obter API Token
1. Vá em **Settings > Integrations**
2. Copie seu **API Token**

### 3. Configurar no OrbitMind
Você precisa de:
- **APIFY_API_TOKEN**: o token copiado

Quer que eu **configure agora**? Basta me passar o Token!`,
};

/** Detect which skill the user is talking about */
function detectSkillFromMessage(message: string): SkillDefinition | null {
  const lower = message.toLowerCase();
  const skillKeywords: Record<string, string> = {
    "instagram": "instagram-publisher",
    "linkedin": "linkedin-publisher",
    "blotato": "blotato-publisher",
    "canva": "canva-designer",
    "apify": "apify-scraper",
    "image fetcher": "image-fetcher",
    "imagem": "image-fetcher",
  };

  for (const [keyword, skillId] of Object.entries(skillKeywords)) {
    if (lower.includes(keyword)) {
      return getSkillById(skillId) ?? null;
    }
  }
  return null;
}

/** Guide the user step-by-step on how to integrate */
export async function handleGuideIntegration(state: ArchitectConversationState, userMessage: string) {
  const lower = userMessage.toLowerCase();

  // Detect platform
  let platform: string | null = null;
  if (lower.includes("instagram")) platform = "instagram";
  else if (lower.includes("linkedin")) platform = "linkedin";
  else if (lower.includes("blotato")) platform = "blotato";
  else if (lower.includes("canva")) platform = "canva";
  else if (lower.includes("apify")) platform = "apify";

  if (platform && INTEGRATION_GUIDES[platform]) {
    await sendMsg(INTEGRATION_GUIDES[platform]!);
  } else {
    await sendMsg(
      `Posso te guiar passo a passo para integrar com:\n\n` +
      `1. 📸 **Instagram** — publicar fotos e carrosséis\n` +
      `2. 💼 **LinkedIn** — publicar posts e artigos\n` +
      `3. 🌐 **Blotato** — publicar em várias redes ao mesmo tempo\n` +
      `4. 🎨 **Canva** — criar designs automaticamente\n` +
      `5. 🕷️ **Apify** — scraping de perfis e sites\n\n` +
      `Qual integração você quer configurar?`,
    );
    state.phase = "skill-select";
    return;
  }
  state.phase = "idle";
}

/** Start configuring a skill directly via chat */
export async function handleConfigSkill(state: ArchitectConversationState, userMessage: string) {
  const skill = detectSkillFromMessage(userMessage);

  if (!skill) {
    // Ask which skill
    const installed = await getSkillsByOrgId(state.orgId);
    const installedIds = new Set(installed.map(s => s.skillId));

    const lines = SKILL_REGISTRY.filter(s => s.requiredConfig.length > 0).map((s, i) => {
      const status = installedIds.has(s.id)
        ? (installed.find(x => x.skillId === s.id)?.isActive ? "✅ Ativo" : "⏸️ Inativo")
        : "⚪ Não configurado";
      return `${i + 1}. ${s.icon} **${s.name}** — ${status}`;
    });

    await sendMsg(
      `Qual skill você quer configurar?\n\n${lines.join("\n")}\n\nResponda com o número ou nome.`,
    );
    state.phase = "skill-select";
    return;
  }

  await startSkillConfigWizard(state, skill);
}

/** Handle skill selection after listing */
export async function handleSkillSelect(state: ArchitectConversationState, userMessage: string) {
  const lower = userMessage.toLowerCase();

  // Check if it's a guide request
  if (/\b(guia|passo|tutorial|como)\b/.test(lower)) {
    state.phase = "idle";
    await handleGuideIntegration(state, userMessage);
    return;
  }

  // Try detect by name
  let skill = detectSkillFromMessage(userMessage);

  // Try detect by number
  if (!skill) {
    const numMatch = userMessage.match(/\b(\d+)\b/);
    const num = numMatch ? parseInt(numMatch[1]!) : NaN;
    const configurable = SKILL_REGISTRY.filter(s => s.requiredConfig.length > 0);
    if (!isNaN(num) && num >= 1 && num <= configurable.length) {
      skill = configurable[num - 1]!;
    }
  }

  if (!skill) {
    // Also try matching from the full registry by number
    const numMatch = userMessage.match(/\b(\d+)\b/);
    const num = numMatch ? parseInt(numMatch[1]!) : NaN;
    if (!isNaN(num) && num >= 1 && num <= SKILL_REGISTRY.length) {
      skill = SKILL_REGISTRY[num - 1]!;
    }
  }

  if (!skill) {
    await sendMsg("Não encontrei essa skill. Tente pelo número ou nome (ex: \"instagram\", \"linkedin\").");
    return;
  }

  if (skill.requiredConfig.length === 0) {
    // No config needed (e.g., image-fetcher)
    await installSkillForOrg(state, skill, {});
    await sendMsg(`${skill.icon} **${skill.name}** ativada! Não precisa de configuração.`);
    state.phase = "idle";
    return;
  }

  await startSkillConfigWizard(state, skill);
}

/** Start the step-by-step config wizard for a skill */
async function startSkillConfigWizard(state: ArchitectConversationState, skill: SkillDefinition) {
  state.skillConfigId = skill.id;
  state.skillConfigStep = 0;
  state.skillConfigValues = {};
  state.phase = "skill-config";

  // Check if already installed
  const installed = await getSkillsByOrgId(state.orgId);
  const existing = installed.find(s => s.skillId === skill.id);
  const isReconfigure = existing?.isActive;

  const field = skill.requiredConfig[0]!;

  let intro = `${skill.icon} **Configurando ${skill.name}**`;
  if (isReconfigure) {
    intro += ` (reconfigurar)`;
  }
  intro += `\n\nPreciso de ${skill.requiredConfig.length} ${skill.requiredConfig.length === 1 ? "credencial" : "credenciais"}.\n\n`;
  intro += `**${field.label}**\n`;
  intro += `${field.helpText}\n\n`;
  intro += `Cole o valor aqui:`;

  await sendMsg(intro);
}

/** Handle config wizard step — user providing credentials */
export async function handleSkillConfig(state: ArchitectConversationState, userMessage: string) {
  if (!state.skillConfigId || state.skillConfigStep === undefined) {
    state.phase = "idle";
    return;
  }

  const skill = getSkillById(state.skillConfigId);
  if (!skill) {
    await sendMsg("Skill não encontrada. Tente novamente.");
    state.phase = "idle";
    return;
  }

  const fields = skill.requiredConfig;
  const currentStep = state.skillConfigStep;
  const currentField = fields[currentStep];

  if (!currentField) {
    state.phase = "idle";
    return;
  }

  // Handle cancel
  if (/\b(cancelar?|desistir|parar|sair)\b/.test(userMessage.toLowerCase())) {
    await sendMsg("Configuração cancelada. O que mais posso fazer?");
    state.skillConfigId = undefined;
    state.skillConfigStep = undefined;
    state.skillConfigValues = undefined;
    state.phase = "idle";
    return;
  }

  // Store the value
  const value = userMessage.trim();
  if (!value) {
    await sendMsg(`O valor não pode ser vazio. Cole o **${currentField.label}**:`);
    return;
  }

  if (!state.skillConfigValues) state.skillConfigValues = {};
  state.skillConfigValues[currentField.key] = value;

  // Move to next step
  const nextStep = currentStep + 1;

  if (nextStep < fields.length) {
    // More fields to collect
    state.skillConfigStep = nextStep;
    const nextField = fields[nextStep]!;
    await sendMsg(`✅ **${currentField.label}** salvo!\n\n**${nextField.label}**\n${nextField.helpText}\n\nCole o valor:`);
  } else {
    // All fields collected — show summary and ask to test/confirm
    state.phase = "skill-confirm";

    const summary = fields.map(f => {
      const val = state.skillConfigValues![f.key] ?? "";
      const masked = f.type === "password"
        ? val.slice(0, 6) + "..." + val.slice(-4)
        : val;
      return `- **${f.label}**: \`${masked}\``;
    }).join("\n");

    await sendMsg(
      `✅ Todas as credenciais coletadas!\n\n${summary}\n\n` +
      `O que quer fazer?\n` +
      `1. 🧪 **Testar conexão** (recomendado)\n` +
      `2. ✅ **Salvar e ativar** direto\n` +
      `3. ❌ **Cancelar**`,
    );
  }
}

/** Handle skill config confirmation — test, save, or cancel */
export async function handleSkillConfirm(state: ArchitectConversationState, userMessage: string) {
  if (!state.skillConfigId || !state.skillConfigValues) {
    state.phase = "idle";
    return;
  }

  const skill = getSkillById(state.skillConfigId);
  if (!skill) {
    await sendMsg("Skill não encontrada.");
    state.phase = "idle";
    return;
  }

  const lower = userMessage.toLowerCase();

  // Cancel
  if (/\b(cancelar?|3|desistir|não|nao)\b/.test(lower)) {
    await sendMsg("Configuração cancelada. O que mais posso fazer?");
    clearSkillState(state);
    return;
  }

  // Test connection
  if (/\b(testar?|teste|test|1|verificar?)\b/.test(lower)) {
    if (!skill.testConnection) {
      await sendMsg("Essa skill não suporta teste de conexão. Vou salvar diretamente...");
    } else {
      await sendMsg("🧪 Testando conexão...");
      try {
        const result = await skill.testConnection(state.skillConfigValues);
        if (result.ok) {
          await sendMsg(`✅ **Conexão bem-sucedida!** ${result.detail ?? ""}\n\nVou salvar e ativar a skill agora...`);
        } else {
          await sendMsg(
            `❌ **Falha na conexão:** ${result.detail ?? "Erro desconhecido"}\n\n` +
            `Verifique as credenciais e tente novamente. O que quer fazer?\n` +
            `1. 🔄 **Reconfigurar** (inserir novos valores)\n` +
            `2. ✅ **Salvar mesmo assim**\n` +
            `3. ❌ **Cancelar**`,
          );
          return;
        }
      } catch (error) {
        await sendMsg(
          `❌ **Erro ao testar:** ${error instanceof Error ? error.message : "Erro desconhecido"}\n\n` +
          `1. 🔄 **Reconfigurar**\n2. ✅ **Salvar mesmo assim**\n3. ❌ **Cancelar**`,
        );
        return;
      }
    }
    // Fall through to save
  }

  // Reconfigure
  if (/\b(reconfigurar?|refazer|novos valores|1)\b/.test(lower) && !/\b(testar?|test)\b/.test(lower)) {
    await startSkillConfigWizard(state, skill);
    return;
  }

  // Save (explicit "2" or "salvar" or after successful test)
  if (/\b(salvar?|2|ativar?|save|sim|ok|pode|go)\b/.test(lower) || /\b(testar?|test|1)\b/.test(lower)) {
    await saveAndActivateSkill(state, skill);
    return;
  }

  // Default: save
  await saveAndActivateSkill(state, skill);
}

/** Save skill config to database */
async function saveAndActivateSkill(state: ArchitectConversationState, skill: SkillDefinition) {
  const values = state.skillConfigValues ?? {};

  // Separate config from secrets (password fields → secrets)
  const config: Record<string, string> = {};
  const secrets: Record<string, string> = {};
  for (const field of skill.requiredConfig) {
    if (field.type === "password") {
      secrets[field.key] = values[field.key] ?? "";
    } else {
      config[field.key] = values[field.key] ?? "";
    }
  }

  await installSkillForOrg(state, skill, config, secrets);

  await sendMsg(
    `✅ **${skill.icon} ${skill.name} configurada e ativada!**\n\n` +
    `A skill já está disponível para seus squads e agentes usarem.\n\n` +
    `O que mais posso fazer? Posso:\n` +
    `- Configurar outra integração\n` +
    `- Criar um squad que use essa skill\n` +
    `- Mostrar o passo a passo de outra plataforma`,
  );

  clearSkillState(state);
}

/** Install or update skill in the database */
async function installSkillForOrg(
  state: ArchitectConversationState,
  skill: SkillDefinition,
  config: Record<string, string>,
  secrets?: Record<string, string>,
) {
  const installed = await getSkillsByOrgId(state.orgId);
  const existing = installed.find(s => s.skillId === skill.id);

  if (existing) {
    await updateSkill(existing.id, state.orgId, {
      config,
      secrets: secrets && Object.keys(secrets).length > 0 ? secrets : undefined,
      isActive: true,
    });
  } else {
    await installSkill({
      orgId: state.orgId,
      skillId: skill.id,
      name: skill.name,
      type: skill.type as "mcp" | "script" | "api" | "prompt",
      config,
      secrets: secrets ?? {},
    });
  }

  await createAuditLog({
    orgId: state.orgId,
    squadId: ARCHITECT_SQUAD_ID,
    action: "skill.configured",
    actorType: "system",
    actorId: "system-architect",
    metadata: { skillId: skill.id, skillName: skill.name },
  });
}

/** Clear skill config state */
function clearSkillState(state: ArchitectConversationState) {
  state.skillConfigId = undefined;
  state.skillConfigStep = undefined;
  state.skillConfigValues = undefined;
  state.phase = "idle";
}

export async function handleRunPipeline(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad quer executar?"); return; }
  await sendMsg(`**Execução de pipeline ainda não implementada.**\n\nO squad "${squad.name}" tem o pipeline configurado, mas a execução automática será ativada em breve.\n\nPor enquanto, você pode conversar diretamente com os agentes do squad no chat.`);
  state.phase = "idle";
}

// ===================== ACTION SQUAD SELECT =====================

export async function handleActionSelectSquad(state: ArchitectConversationState, userMessage: string, providerConfig: ProviderConfig) {
  const squads = await getSquadsByOrgId(state.orgId);
  const numMatch = userMessage.match(/\b(\d+)\b/);
  const num = numMatch ? parseInt(numMatch[1]!) : NaN;
  const matched = !isNaN(num) && num >= 1 && num <= squads.length
    ? squads[num - 1]
    : squads.find((s) => userMessage.toLowerCase().includes(s.name.toLowerCase()));

  if (!matched) {
    await sendMsg("Não encontrei esse squad. Tente pelo número ou nome.");
    return;
  }

  state.editSquadId = matched.id;
  state.editSquadName = matched.name;
  const action = state.pendingAction;
  const actionMsg = state.pendingActionMessage ?? userMessage;
  state.pendingAction = undefined;
  state.pendingActionMessage = undefined;
  state.phase = "idle";

  // Route to the pending action
  switch (action) {
    case "create-tasks": await handleCreateTasks(state, actionMsg, providerConfig); break;
    case "view-tasks": await handleViewTasks(state, userMessage); break;
    default: await sendMsg(`Squad "${matched.name}" selecionado. O que quer fazer?`);
  }
}
