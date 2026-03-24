/**
 * Architect Actions — All capabilities beyond squad CRUD
 *
 * Tasks: create, move, delete, view
 * Squad: pause, activate, duplicate, export, run
 * Agent: change model, change budget, view
 * Skills: install
 */

import { createAdapter } from "@orbitmind/engine";
import type { ProviderConfig } from "@orbitmind/engine";
import { getSquadsByOrgId, getSquadWithAgents, createSquad, updateSquad } from "@/lib/db/queries/squads";
import { getAgentsBySquadId, createAgent, updateAgent } from "@/lib/db/queries/agents";
import { getTasksBySquadId, createTask, updateTask, deleteTask } from "@/lib/db/queries/tasks";
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
    if (squads.length === 0) { await sendMsg("Voce nao tem squads. Crie um primeiro!"); return; }
    state.phase = "action-select-squad";
    state.pendingAction = "create-tasks";
    state.pendingActionMessage = userMessage;
    const lines = squads.map((s, i) => `${i + 1}. ${s.icon} **${s.name}** — ${s.agentCount} agentes`);
    await sendMsg(`Para qual squad devo criar as tasks?\n\n${lines.join("\n")}`);
    return;
  }

  const agents = await getAgentsBySquadId(squad.id);
  if (agents.length === 0) { await sendMsg(`Squad "${squad.name}" nao tem agentes. Adicione agentes primeiro.`); return; }

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
  {"title": "Titulo da task", "description": "Descricao", "priority": "p0|p1|p2|p3", "type": "feature|content|research|review", "agentName": "Nome do agente responsavel"}
]
\`\`\`

Regras:
- 2-4 tasks por agente
- Prioridades variadas (pelo menos 1 p0 e 1 p1)
- Tipos variados
- Descricoes com 1-2 frases explicando o que fazer
- Tasks em portugues brasileiro
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
    await sendMsg(`**${tasksCreated} tasks criadas para "${squad.name}"!**\n\nAs tasks estao no board como "Ready". Acesse **/board** para visualizar.`);
    await createAuditLog({ orgId: state.orgId, squadId: squad.id, action: "tasks.batch-created", actorType: "system", actorId: "system-architect", metadata: { count: tasksCreated } });
  } else {
    await sendMsg("Nao consegui gerar as tasks. Tente descrever mais especificamente o que cada agente deve fazer.");
  }
  state.phase = "idle";
}

export async function handleViewTasks(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) {
    const squads = await getSquadsByOrgId(state.orgId);
    if (squads.length === 0) { await sendMsg("Voce nao tem squads."); return; }
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
  if (tasks.length === 0) { await sendMsg(`**${squadName}** nao tem tasks. Quer que eu crie?`); return; }

  const byStatus: Record<string, typeof tasks> = {};
  for (const t of tasks) { (byStatus[t.status] ??= []).push(t); }

  const statusLabels: Record<string, string> = { backlog: "Backlog", ready: "Ready", in_progress: "Em Progresso", in_review: "Em Revisao", done: "Concluido", blocked: "Bloqueado" };
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
    "em revisao": "in_review", "in review": "in_review", done: "done", concluido: "done", pronto: "done",
    bloqueado: "blocked", blocked: "blocked",
  };

  let targetStatus: string | undefined;
  for (const [keyword, status] of Object.entries(statusMap)) {
    if (userMessage.toLowerCase().includes(keyword)) { targetStatus = status; break; }
  }

  if (!targetStatus) {
    await sendMsg("Para qual status? (backlog, ready, em progresso, em revisao, done, bloqueado)");
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
    await sendMsg(`Nao encontrei essa task. As tasks do squad "${squad.name}":\n${tasks.map((t) => `- ${t.title} (${t.status})`).join("\n")}`);
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
    await sendMsg(`Nao encontrei. Tasks do squad:\n${tasks.map((t) => `- ${t.title}`).join("\n")}`);
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
  if (!original) { await sendMsg("Squad nao encontrado."); return; }

  const newSquad = await createSquad({
    orgId: state.orgId,
    name: `${original.name} (copia)`,
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
  if (!data) { await sendMsg("Squad nao encontrado."); return; }

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
    await sendMsg(`Qual modelo? Opcoes:\n- **powerful** (Opus/Sonnet — mais inteligente)\n- **fast** (Haiku — mais rapido e economico)\n\n${agent.name} atualmente usa: **${agent.modelTier}**`);
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
  await sendMsg(`**Budget atualizado!**\n${agent.icon} ${agent.name}: **${(tokens / 1000).toFixed(0)}k tokens/mes**`);
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
  if (agents.length === 0) { await sendMsg(`**${squadName}** nao tem agentes.`); return; }

  const lines = [`**Agentes de ${squadName}** (${agents.length})\n`];
  for (const a of agents) {
    const budgetPct = a.monthlyBudgetTokens ? Math.round(((a.budgetUsedTokens ?? 0) / a.monthlyBudgetTokens) * 100) : 0;
    lines.push(`${a.icon} **${a.name}** — ${a.role}`);
    lines.push(`  Modelo: ${a.modelTier} · Status: ${a.status} · Budget: ${budgetPct}%`);
  }
  await sendMsg(lines.join("\n"));
}

export async function handleInstallSkill(state: ArchitectConversationState, userMessage: string) {
  await sendMsg("Para configurar skills, acesse **Settings > Skills** no menu lateral.\n\nLa voce pode ativar:\n- 📸 Instagram Publisher\n- 💼 LinkedIn Publisher\n- 🌐 Blotato (multi-plataforma)\n- 🎨 Canva Designer\n- 🕷️ Apify Scraper\n- 🖼️ Image Fetcher");
  state.phase = "idle";
}

export async function handleRunPipeline(state: ArchitectConversationState, userMessage: string) {
  const squad = await resolveSquad(state, userMessage);
  if (!squad) { await sendMsg("Qual squad quer executar?"); return; }
  await sendMsg(`**Execucao de pipeline ainda nao implementada.**\n\nO squad "${squad.name}" tem o pipeline configurado, mas a execucao automatica sera ativada em breve.\n\nPor enquanto, voce pode conversar diretamente com os agentes do squad no chat.`);
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
    await sendMsg("Nao encontrei esse squad. Tente pelo numero ou nome.");
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
