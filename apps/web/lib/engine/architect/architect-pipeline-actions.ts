/**
 * Architect Pipeline Actions — Gerenciamento da esteira GitHub via chat
 *
 * Actions: list agents, edit agent, create agent, toggle, trigger, show runs, show detail
 */

import { createAdapter } from "@orbitmind/engine";
import type { ProviderConfig } from "@orbitmind/engine";
import { getIntegrationByType, updateIntegration } from "@/lib/db/queries/integrations";
import { createMessage } from "@/lib/db/queries/messages";
import { GitHubIntegration, type ImportedAgent } from "@/lib/integrations/actions/github";
import { ARCHITECT_SQUAD_ID } from "./architect-agent";
import type { ArchitectConversationState } from "./architect-state";

let _convId: string | undefined;

export function setPipelineConversationId(id: string | undefined) {
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

async function getGitHub(orgId: string): Promise<{ github: GitHubIntegration; owner: string; repo: string; branch: string } | null> {
  const integration = await getIntegrationByType(orgId, "github");
  if (!integration || integration.status !== "active") return null;

  const config = (integration.config as Record<string, unknown>) ?? {};
  const owner = config.organization as string | undefined;
  const repo = config.repository as string | undefined;
  if (!owner || !repo) return null;

  const github = new GitHubIntegration(orgId);
  return { github, owner, repo, branch: (config.branch as string) ?? "main" };
}

// ── List Pipeline Agents ──

export async function handleListPipelineAgents(state: ArchitectConversationState) {
  const gh = await getGitHub(state.orgId);
  if (!gh) {
    await sendMsg("Nenhum repositorio conectado. Va em **Integracoes → GitHub** e conecte um repo primeiro.");
    state.phase = "idle";
    return;
  }

  const agents = await gh.github.importPipeline(gh.owner, gh.repo);

  let response = `**Esteira: ${gh.owner}/${gh.repo}**\n\n`;
  response += `${agents.length} agentes encontrados:\n\n`;

  const roleIcons: Record<string, string> = {
    developer: "🔧", reviewer: "🔍", autofix: "🔄", architect: "🏛️",
    designer: "🎨", docs: "📝", ideator: "💡", taskmaster: "📋",
    qa: "🧪", release: "🚀", rebase: "🔀", "project-sync": "📌",
    general: "⚙️",
  };

  for (const agent of agents) {
    const statusIcon = agent.state === "active" ? "🟢" : "⚪";
    const icon = roleIcons[agent.role] ?? "⚙️";
    const runInfo = agent.lastRun
      ? `Ultimo run: ${agent.lastRun.conclusion === "success" ? "✅" : agent.lastRun.conclusion === "failure" ? "❌" : "⏳"} ${agent.lastRun.duration ? `(${agent.lastRun.duration}s)` : ""}`
      : "Nenhum run";
    response += `${statusIcon} ${icon} **${agent.displayName}** (${agent.role})\n`;
    response += `   Workflow: \`${agent.workflowPath}\`\n`;
    if (agent.skillPath) response += `   Skill: \`${agent.skillPath}\`\n`;
    response += `   ${runInfo}\n\n`;
  }

  response += "Posso **editar**, **habilitar/desabilitar**, **disparar**, ou **criar novos agentes**. O que precisa?";
  await sendMsg(response);
  state.phase = "idle";
}

// ── Show Agent Detail ──

export async function handleShowAgentDetail(state: ArchitectConversationState, userMessage: string) {
  const gh = await getGitHub(state.orgId);
  if (!gh) { await sendMsg("GitHub nao conectado."); state.phase = "idle"; return; }

  const agents = await gh.github.importPipeline(gh.owner, gh.repo);
  const agent = identifyAgent(userMessage, agents);
  if (!agent) {
    await sendMsg("Qual agente? " + agents.map((a) => a.displayName).join(", "));
    state.phase = "idle";
    return;
  }

  let response = `**${agent.displayName}** (${agent.role})\n\n`;
  response += `- Workflow: \`${agent.workflowPath}\`\n`;
  response += `- Status: ${agent.state === "active" ? "🟢 Ativo" : "⚪ Desabilitado"}\n`;

  if (agent.skillPath) {
    response += `- Skill: \`${agent.skillPath}\`\n\n`;
    response += `**Conteudo do skill file:**\n\n\`\`\`markdown\n${agent.skillContent.slice(0, 2000)}\n\`\`\``;
    if (agent.skillContent.length > 2000) response += "\n\n*(conteudo truncado)*";
  } else {
    response += "\n*Sem skill file associado.*";
  }

  await sendMsg(response);
  state.phase = "idle";
}

// ── Edit Agent ──

export async function handleEditAgent(state: ArchitectConversationState, userMessage: string, providerConfig: ProviderConfig) {
  const gh = await getGitHub(state.orgId);
  if (!gh) { await sendMsg("GitHub nao conectado."); state.phase = "idle"; return; }

  const agents = await gh.github.importPipeline(gh.owner, gh.repo);
  const agent = identifyAgent(userMessage, agents);
  if (!agent) {
    await sendMsg("Qual agente quer editar? " + agents.map((a) => a.displayName).join(", "));
    state.phase = "idle";
    return;
  }

  if (!agent.skillContent) {
    await sendMsg(`O agente **${agent.displayName}** nao tem skill file. Quer que eu crie um?`);
    state.phase = "idle";
    return;
  }

  // Use LLM to generate edit
  const adapter = createAdapter(
    { name: "Architect", role: "architect", config: {} },
    providerConfig,
  );

  const result = await adapter.chat([{
    role: "user",
    content: `O usuario pediu: "${userMessage}"

Arquivo atual (${agent.skillPath}):
\`\`\`markdown
${agent.skillContent}
\`\`\`

Edite o arquivo conforme o pedido do usuario. Retorne APENAS o conteudo novo do arquivo, sem explicacoes, sem code fences.`,
  }]);

  const newContent = result.output.replace(/^```\w*\n/, "").replace(/\n```$/, "").trim();

  // Store pending edit
  state.pendingChanges = {
    type: "edit-agent",
    agentName: agent.displayName,
    skillPath: agent.skillPath,
    skillSha: agent.skillSha,
    newContent,
    originalContent: agent.skillContent,
  };

  // Show diff
  const diffLines = simpleDiff(agent.skillContent, newContent);
  await sendMsg(
    `Alteracao proposta para **${agent.displayName}** (\`${agent.skillPath}\`):\n\n\`\`\`diff\n${diffLines}\n\`\`\`\n\nConfirma? Responda **sim** para fazer o commit ou **nao** para cancelar.`,
  );
  state.phase = "edit-confirm";
}

// ── Confirm Edit ──

export async function handleConfirmPipelineEdit(state: ArchitectConversationState, userMessage: string) {
  const lower = userMessage.toLowerCase();
  const isYes = /\b(sim|yes|confirma|ok|pode|go|faz|faça)\b/.test(lower);

  if (!isYes) {
    await sendMsg("Edicao cancelada.");
    state.pendingChanges = undefined;
    state.phase = "idle";
    return;
  }

  const changes = state.pendingChanges as Record<string, string> | undefined;
  if (!changes || changes.type !== "edit-agent") {
    await sendMsg("Nenhuma edicao pendente.");
    state.phase = "idle";
    return;
  }

  const gh = await getGitHub(state.orgId);
  if (!gh) { await sendMsg("GitHub nao conectado."); state.phase = "idle"; return; }

  await gh.github.createOrUpdateFile(
    gh.owner, gh.repo,
    changes.skillPath!,
    changes.newContent!,
    `feat(agent): update ${changes.agentName} via OrbitMind Architect`,
    changes.skillSha || undefined,
  );

  state.pendingChanges = undefined;
  await sendMsg(`✅ **${changes.agentName}** atualizado!\n\nCommit feito no repo \`${gh.owner}/${gh.repo}\`. A alteracao ja esta ativa para o proximo trigger.`);
  state.phase = "idle";
}

// ── Toggle Agent ──

export async function handleToggleAgent(state: ArchitectConversationState, userMessage: string) {
  const gh = await getGitHub(state.orgId);
  if (!gh) { await sendMsg("GitHub nao conectado."); state.phase = "idle"; return; }

  const agents = await gh.github.importPipeline(gh.owner, gh.repo);
  const agent = identifyAgent(userMessage, agents);
  if (!agent) {
    await sendMsg("Qual agente? " + agents.map((a) => `${a.displayName} (${a.state})`).join(", "));
    state.phase = "idle";
    return;
  }

  const enable = agent.state !== "active";
  await gh.github.toggleWorkflow(gh.owner, gh.repo, agent.workflowId, enable);

  const action = enable ? "habilitado" : "desabilitado";
  await sendMsg(`✅ **${agent.displayName}** ${action}!`);
  state.phase = "idle";
}

// ── Trigger Agent ──

export async function handleTriggerAgent(state: ArchitectConversationState, userMessage: string) {
  const gh = await getGitHub(state.orgId);
  if (!gh) { await sendMsg("GitHub nao conectado."); state.phase = "idle"; return; }

  const agents = await gh.github.importPipeline(gh.owner, gh.repo);
  const agent = identifyAgent(userMessage, agents);
  if (!agent) {
    await sendMsg("Qual agente quer disparar? " + agents.map((a) => a.displayName).join(", "));
    state.phase = "idle";
    return;
  }

  if (agent.state !== "active") {
    await sendMsg(`O agente **${agent.displayName}** esta desabilitado. Habilite primeiro.`);
    state.phase = "idle";
    return;
  }

  await gh.github.triggerWorkflow(gh.owner, gh.repo, agent.workflowId, gh.branch);
  await sendMsg(`▶️ **${agent.displayName}** disparado!\n\nO workflow sera executado na branch \`${gh.branch}\`. Acompanhe em **/pipeline**.`);
  state.phase = "idle";
}

// ── Show Runs ──

export async function handleShowRuns(state: ArchitectConversationState, userMessage: string) {
  const gh = await getGitHub(state.orgId);
  if (!gh) { await sendMsg("GitHub nao conectado."); state.phase = "idle"; return; }

  const agents = await gh.github.importPipeline(gh.owner, gh.repo);
  const agent = identifyAgent(userMessage, agents);

  const runs = agent
    ? await gh.github.listWorkflowRuns(gh.owner, gh.repo, agent.workflowId)
    : await gh.github.listWorkflowRuns(gh.owner, gh.repo);

  const runList = runs.data?.workflow_runs ?? [];
  if (runList.length === 0) {
    await sendMsg(agent ? `Nenhum run encontrado para **${agent.displayName}**.` : "Nenhum run encontrado.");
    state.phase = "idle";
    return;
  }

  let response = agent ? `**Runs de ${agent.displayName}:**\n\n` : `**Runs recentes (${gh.owner}/${gh.repo}):**\n\n`;

  for (const run of runList.slice(0, 10)) {
    const icon = run.conclusion === "success" ? "✅" : run.conclusion === "failure" ? "❌" : run.status === "in_progress" ? "⏳" : "⚪";
    const duration = run.run_started_at && run.updated_at
      ? Math.round((new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()) / 1000)
      : null;
    const durationStr = duration ? `(${duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m`})` : "";
    const date = new Date(run.run_started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    response += `${icon} #${run.id} — ${run.conclusion ?? run.status} ${durationStr} — ${date}\n`;
  }

  await sendMsg(response);
  state.phase = "idle";
}

// ── Create Agent ──

export async function handleCreateAgent(state: ArchitectConversationState, userMessage: string, providerConfig: ProviderConfig) {
  const gh = await getGitHub(state.orgId);
  if (!gh) { await sendMsg("GitHub nao conectado."); state.phase = "idle"; return; }

  const adapter = createAdapter(
    { name: "Architect", role: "architect", config: {} },
    providerConfig,
  );

  const result = await adapter.chat([{
    role: "user",
    content: `O usuario pediu: "${userMessage}"

Crie um novo agente para a esteira de desenvolvimento GitHub Actions + Claude Code.
O agente precisa de dois arquivos:
1. Workflow YAML (.github/workflows/{nome}.yml)
2. Skill file (.claude/commands/{nome}.md)

Retorne APENAS um JSON valido (sem code fences):
{"workflowName":"nome.yml","workflowContent":"conteudo YAML","skillName":"orbit-nome.md","skillContent":"conteudo MD","description":"descricao curta"}`,
  }]);

  let agentFiles;
  try {
    const jsonStr = result.output.replace(/^```\w*\n/, "").replace(/\n```$/, "").trim();
    agentFiles = JSON.parse(jsonStr);
  } catch {
    await sendMsg("Nao consegui gerar os arquivos do agente. Tente descrever com mais detalhes.");
    state.phase = "idle";
    return;
  }

  state.pendingChanges = {
    type: "create-agent",
    ...agentFiles,
  };

  await sendMsg(
    `Vou criar o agente **${agentFiles.description}**:\n\n` +
    `📄 Workflow: \`.github/workflows/${agentFiles.workflowName}\`\n` +
    `📄 Skill: \`.claude/commands/${agentFiles.skillName}\`\n\n` +
    `Confirma? Responda **sim** para criar os arquivos no repo.`,
  );
  state.phase = "edit-confirm";
}

// ── Confirm Create ──

export async function handleConfirmPipelineCreate(state: ArchitectConversationState) {
  const changes = state.pendingChanges as Record<string, string> | undefined;
  if (!changes || changes.type !== "create-agent") {
    await sendMsg("Nenhuma criacao pendente.");
    state.phase = "idle";
    return;
  }

  const gh = await getGitHub(state.orgId);
  if (!gh) { await sendMsg("GitHub nao conectado."); state.phase = "idle"; return; }

  await gh.github.createOrUpdateFile(
    gh.owner, gh.repo,
    `.github/workflows/${changes.workflowName}`,
    changes.workflowContent!,
    `feat: add ${changes.workflowName} agent via OrbitMind`,
  );

  await gh.github.createOrUpdateFile(
    gh.owner, gh.repo,
    `.claude/commands/${changes.skillName}`,
    changes.skillContent!,
    `feat: add ${changes.skillName} skill via OrbitMind`,
  );

  state.pendingChanges = undefined;
  await sendMsg(
    `✅ Agente criado!\n\n` +
    `- Workflow: \`.github/workflows/${changes.workflowName}\`\n` +
    `- Skill: \`.claude/commands/${changes.skillName}\`\n\n` +
    `Ambos ja estao no repo. O agente sera ativado no proximo trigger.`,
  );
  state.phase = "idle";
}

// ── Helpers ──

function identifyAgent(message: string, agents: ImportedAgent[]): ImportedAgent | null {
  const lower = message.toLowerCase();

  // Match by role name
  const roleMatches: Record<string, string[]> = {
    reviewer: ["reviewer", "revisor", "review", "code review"],
    developer: ["developer", "implementor", "claude", "dev", "implementador"],
    autofix: ["autofix", "fix", "correcao"],
    architect: ["architect", "arquiteto", "prd"],
    designer: ["designer", "design", "ui", "ux"],
    docs: ["docs", "documentacao", "documentation"],
    ideator: ["ideator", "ideias", "ideas", "market"],
    taskmaster: ["taskmaster", "priorizacao", "prioridade"],
    qa: ["qa", "teste", "test", "quality"],
    release: ["release", "lancamento"],
    rebase: ["rebase"],
    "project-sync": ["project", "label", "board"],
  };

  for (const [role, keywords] of Object.entries(roleMatches)) {
    if (keywords.some((k) => lower.includes(k))) {
      const match = agents.find((a) => a.role === role);
      if (match) return match;
    }
  }

  // Match by display name
  for (const agent of agents) {
    if (lower.includes(agent.displayName.toLowerCase()) || lower.includes(agent.name.toLowerCase())) {
      return agent;
    }
  }

  return null;
}

function simpleDiff(original: string, modified: string): string {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");
  const lines: string[] = [];
  const max = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < max; i++) {
    const o = origLines[i];
    const m = modLines[i];
    if (o === m) {
      lines.push(`  ${o ?? ""}`);
    } else {
      if (o !== undefined) lines.push(`- ${o}`);
      if (m !== undefined) lines.push(`+ ${m}`);
    }
  }
  return lines.join("\n");
}
