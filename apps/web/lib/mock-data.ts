import type { ChatMessage } from "@orbitmind/shared";

export const MOCK_SQUADS = [
  {
    id: "sq-1",
    name: "Agencia de Marketing Digital",
    code: "marketing-agency",
    description: "Squad completo de marketing digital que pesquisa mercado, define estrategia, cria conteudo, produz design visual, revisa qualidade e publica em redes sociais.",
    icon: "🚀",
    status: "active" as const,
    agentCount: 7,
    taskCount: 10,
    config: {
      budget: { monthlyTokens: 2_000_000, warningThreshold: 0.8, pauseThreshold: 1.0 },
    },
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "sq-2",
    name: "Dev Team Backend",
    code: "dev-backend",
    description: "Squad de desenvolvimento backend com code review automatizado, testes e deploy.",
    icon: "💻",
    status: "active" as const,
    agentCount: 4,
    taskCount: 6,
    config: {
      budget: { monthlyTokens: 1_500_000, warningThreshold: 0.8, pauseThreshold: 1.0 },
    },
    createdAt: new Date("2026-03-10"),
  },
  {
    id: "sq-3",
    name: "Suporte ao Cliente",
    code: "support-team",
    description: "Squad de atendimento e suporte com triagem automatica e respostas inteligentes.",
    icon: "🎧",
    status: "paused" as const,
    agentCount: 3,
    taskCount: 4,
    config: {
      budget: { monthlyTokens: 500_000, warningThreshold: 0.8, pauseThreshold: 1.0 },
    },
    createdAt: new Date("2026-03-15"),
  },
];

export const MOCK_AGENTS = [
  { id: "ag-1", squadId: "sq-1", name: "Ana Insights", role: "Pesquisadora de mercado", icon: "🔍", modelTier: "fast" as const, status: "idle" as const, budgetUsedTokens: 45_000, monthlyBudgetTokens: 285_714 },
  { id: "ag-2", squadId: "sq-1", name: "Sofia Strategy", role: "Estrategista", icon: "🧠", modelTier: "powerful" as const, status: "working" as const, budgetUsedTokens: 120_000, monthlyBudgetTokens: 285_714 },
  { id: "ag-3", squadId: "sq-1", name: "Carlos Copy", role: "Copywriter", icon: "✍️", modelTier: "powerful" as const, status: "working" as const, budgetUsedTokens: 180_000, monthlyBudgetTokens: 285_714 },
  { id: "ag-4", squadId: "sq-1", name: "Diana Design", role: "Designer", icon: "🎨", modelTier: "powerful" as const, status: "idle" as const, budgetUsedTokens: 30_000, monthlyBudgetTokens: 285_714 },
  { id: "ag-5", squadId: "sq-1", name: "Samuel SEO", role: "Analista SEO", icon: "📊", modelTier: "fast" as const, status: "idle" as const, budgetUsedTokens: 15_000, monthlyBudgetTokens: 285_714 },
  { id: "ag-6", squadId: "sq-1", name: "Vera Review", role: "Revisora de qualidade", icon: "✅", modelTier: "powerful" as const, status: "idle" as const, budgetUsedTokens: 78_000, monthlyBudgetTokens: 285_714 },
  { id: "ag-7", squadId: "sq-1", name: "Paula Post", role: "Publicadora", icon: "📤", modelTier: "fast" as const, status: "idle" as const, budgetUsedTokens: 8_000, monthlyBudgetTokens: 285_714 },
];

export const MOCK_TASKS = [
  { id: "tk-1", squadId: "sq-1", title: "Pesquisar tendencias de IA para Q2 2026", status: "done" as const, priority: "p1" as const, type: "research" as const, assignedAgentId: "ag-1" },
  { id: "tk-2", squadId: "sq-1", title: "Definir estrategia de conteudo mensal", status: "in_progress" as const, priority: "p0" as const, type: "feature" as const, assignedAgentId: "ag-2" },
  { id: "tk-3", squadId: "sq-1", title: "Escrever post LinkedIn sobre automacao", status: "in_progress" as const, priority: "p1" as const, type: "content" as const, assignedAgentId: "ag-3" },
  { id: "tk-4", squadId: "sq-1", title: "Criar carrossel Instagram - 5 slides", status: "ready" as const, priority: "p2" as const, type: "content" as const, assignedAgentId: "ag-4" },
  { id: "tk-5", squadId: "sq-1", title: "Otimizar SEO do blog post sobre IA", status: "backlog" as const, priority: "p2" as const, type: "review" as const, assignedAgentId: "ag-5" },
  { id: "tk-6", squadId: "sq-1", title: "Revisar copy do email marketing", status: "in_review" as const, priority: "p1" as const, type: "review" as const, assignedAgentId: "ag-6" },
  { id: "tk-7", squadId: "sq-1", title: "Publicar conteudo nas redes sociais", status: "backlog" as const, priority: "p3" as const, type: "feature" as const, assignedAgentId: "ag-7" },
  { id: "tk-8", squadId: "sq-1", title: "Analisar metricas da campanha anterior", status: "done" as const, priority: "p2" as const, type: "research" as const, assignedAgentId: "ag-1" },
  { id: "tk-9", squadId: "sq-1", title: "Criar brief para campanha de lancamento", status: "ready" as const, priority: "p0" as const, type: "content" as const, assignedAgentId: "ag-2" },
  { id: "tk-10", squadId: "sq-1", title: "Escrever artigo blog sobre produtividade", status: "backlog" as const, priority: "p3" as const, type: "content" as const, assignedAgentId: "ag-3" },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  { id: "msg-1", squadId: "sq-1", senderId: "u-1", content: "Ola equipe! Precisamos criar conteudo sobre IA para o proximo mes.", role: "user", metadata: {}, createdAt: "2026-03-21T10:00:00Z" },
  { id: "msg-2", squadId: "sq-1", agentId: "ag-1", content: "Entendido! Vou comecar pesquisando as principais tendencias de IA para Q2 2026. Foco em automacao empresarial e agentes autonomos.", role: "agent", metadata: {}, createdAt: "2026-03-21T10:00:05Z" },
  { id: "msg-3", squadId: "sq-1", agentId: "ag-2", content: "Com base na pesquisa da Ana, recomendo 3 pilares:\n\n1. **IA no dia a dia** - casos praticos\n2. **Squads autonomos** - como funcionam\n3. **ROI da automacao** - numeros reais\n\nVamos criar um calendario editorial?", role: "agent", metadata: {}, createdAt: "2026-03-21T10:01:00Z" },
  { id: "msg-4", squadId: "sq-1", senderId: "u-1", content: "Perfeito! Comecem pelo post do LinkedIn sobre automacao.", role: "user", metadata: {}, createdAt: "2026-03-21T10:02:00Z" },
  { id: "msg-5", squadId: "sq-1", agentId: "ag-3", content: "Ja estou trabalhando no draft do post. Focando em dados concretos e storytelling. Envio o rascunho em breve!", role: "agent", metadata: {}, createdAt: "2026-03-21T10:02:30Z" },
  { id: "msg-6", squadId: "sq-1", content: "Pipeline iniciado: Marketing Campaign Q2", role: "system", metadata: { type: "pipeline_start" }, createdAt: "2026-03-21T10:03:00Z" },
  { id: "msg-7", squadId: "sq-1", agentId: "ag-3", content: "Rascunho pronto! Titulo: **'5 Maneiras que Agentes de IA Estao Transformando Marketing em 2026'**.\n\nDestaques:\n- Dados de mercado atualizados\n- 3 cases reais\n- CTA para demo do OrbitMind\n\nRevisem e aprovem para eu seguir para o design.", role: "agent", metadata: {}, createdAt: "2026-03-21T10:05:00Z" },
  { id: "msg-8", squadId: "sq-1", agentId: "ag-5", content: "Vou verificar o SEO do rascunho.\n\n**Keywords primarias:** agentes IA, automacao marketing, squads IA\n**Score inicial:** 78/100\n\nSugestoes:\n- Adicionar keyword no H2\n- Incluir meta description\n- Melhorar densidade de keywords", role: "agent", metadata: {}, createdAt: "2026-03-21T10:06:00Z" },
  { id: "msg-9", squadId: "sq-1", agentId: "ag-6", content: "Revisao completa! Copy esta excelente. Sugeri 3 ajustes menores no CTA. Aprovado para publicacao apos ajustes.", role: "agent", metadata: {}, createdAt: "2026-03-21T10:07:00Z" },
  { id: "msg-10", squadId: "sq-1", content: "Checkpoint: aprovacao necessaria para publicacao", role: "system", metadata: { type: "checkpoint" }, createdAt: "2026-03-21T10:08:00Z" },
];

export const MOCK_EXECUTIONS = [
  { id: "ex-1", squadId: "sq-1", agentId: "ag-1", step: "research", status: "completed" as const, tokensUsed: 12500, estimatedCost: 25, durationMs: 45000, startedAt: "2026-03-21T10:00:00Z" },
  { id: "ex-2", squadId: "sq-1", agentId: "ag-2", step: "strategy", status: "completed" as const, tokensUsed: 8200, estimatedCost: 82, durationMs: 32000, startedAt: "2026-03-21T10:01:00Z" },
  { id: "ex-3", squadId: "sq-1", agentId: "ag-3", step: "copywriting", status: "completed" as const, tokensUsed: 15000, estimatedCost: 150, durationMs: 60000, startedAt: "2026-03-21T10:02:00Z" },
  { id: "ex-4", squadId: "sq-1", agentId: "ag-5", step: "seo", status: "completed" as const, tokensUsed: 5600, estimatedCost: 11, durationMs: 18000, startedAt: "2026-03-21T10:06:00Z" },
  { id: "ex-5", squadId: "sq-1", agentId: "ag-6", step: "review", status: "completed" as const, tokensUsed: 7800, estimatedCost: 78, durationMs: 25000, startedAt: "2026-03-21T10:07:00Z" },
  { id: "ex-6", squadId: "sq-1", agentId: "ag-3", step: "copywriting-v2", status: "running" as const, tokensUsed: 3200, estimatedCost: 32, durationMs: null, startedAt: "2026-03-21T10:10:00Z" },
];

export function getAgentById(id: string) {
  return MOCK_AGENTS.find((a) => a.id === id);
}

export function getAgentsBySquad(squadId: string) {
  return MOCK_AGENTS.filter((a) => a.squadId === squadId);
}

export function getTasksBySquad(squadId: string) {
  return MOCK_TASKS.filter((t) => t.squadId === squadId);
}

export function getMessagesBySquad(squadId: string) {
  return MOCK_MESSAGES.filter((m) => m.squadId === squadId);
}
