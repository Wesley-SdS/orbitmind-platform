/**
 * Standard content pipeline template for marketing/social media squads.
 * The Architect uses this template when creating content-focused squads,
 * mapping agent roles to specific pipeline steps.
 */

export interface ContentPipelineStep {
  step: number;
  name: string;
  type: "agent" | "checkpoint-input" | "checkpoint-select" | "checkpoint-approve";
  agentRole?: string;   // Role name to map to actual agent
  format?: string;      // Best practice format to inject
  description: string;  // What this step does (for Architect/user)
  sourceStep?: number;  // For checkpoint-select: which step provides options
  checkpointFields?: Array<{ name: string; label: string; type: "text" | "textarea" | "select"; options?: string[] }>;
}

export const CONTENT_PIPELINE_TEMPLATE: ContentPipelineStep[] = [
  {
    step: 1,
    name: "Briefing",
    type: "checkpoint-input",
    description: "Usuário define o tema e período de pesquisa",
    checkpointFields: [
      { name: "topic", label: "Tema ou assunto", type: "textarea" },
      { name: "timePeriod", label: "Período de pesquisa", type: "select", options: ["últimas 24 horas", "última semana", "último mês", "últimos 3 meses"] },
      { name: "objective", label: "Objetivo do conteúdo (opcional)", type: "text" },
    ],
  },
  {
    step: 2,
    name: "Pesquisa de Tendências",
    type: "agent",
    agentRole: "researcher",
    format: "researching",
    description: "Pesquisa web por tendências e notícias relevantes no nicho, ranqueia por potencial viral",
  },
  {
    step: 3,
    name: "Seleção de Pauta",
    type: "checkpoint-select",
    description: "Usuário escolhe qual pauta/notícia desenvolver",
    sourceStep: 2,
  },
  {
    step: 4,
    name: "Geração de Ângulos",
    type: "agent",
    agentRole: "copywriter",
    description: "Gera 3-5 ângulos criativos diferentes para a pauta selecionada",
  },
  {
    step: 5,
    name: "Seleção de Ângulo",
    type: "checkpoint-select",
    description: "Usuário escolhe qual ângulo criativo seguir",
    sourceStep: 4,
  },
  {
    step: 6,
    name: "Criação de Conteúdo",
    type: "agent",
    agentRole: "copywriter",
    format: "copywriting",
    description: "Cria o conteúdo completo (texto, legendas, hashtags) usando o ângulo selecionado",
  },
  {
    step: 7,
    name: "Design Visual",
    type: "agent",
    agentRole: "designer",
    format: "image-design",
    description: "Busca/cria imagens e define identidade visual do post",
  },
  {
    step: 8,
    name: "Revisão de Qualidade",
    type: "agent",
    agentRole: "reviewer",
    format: "review",
    description: "Avalia qualidade do conteúdo e visual, pontua critérios, sugere melhorias",
  },
  {
    step: 9,
    name: "Aprovação Final",
    type: "checkpoint-approve",
    description: "Usuário revisa e aprova o conteúdo antes da publicação",
  },
  {
    step: 10,
    name: "Publicação",
    type: "agent",
    agentRole: "publisher",
    description: "Publica nas plataformas configuradas (Instagram, LinkedIn, etc.)",
  },
];

/**
 * Detect if a squad purpose is content/marketing related.
 */
export function isContentSquad(purpose: string): boolean {
  const keywords = [
    "marketing", "conteudo", "conteúdo", "social", "post", "instagram", "linkedin",
    "twitter", "tiktok", "youtube", "blog", "newsletter", "email", "publicação",
    "publicacao", "carrossel", "carousel", "stories", "reels", "agência", "agencia",
    "comunicação", "comunicacao", "mídia", "midia", "editorial", "redação", "redacao",
    "copy", "copywriting", "growth",
  ];
  const lower = purpose.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

/**
 * Map template agent roles to actual squad agents.
 * Returns a pipeline config with real agent IDs.
 */
export function mapTemplateToAgents(
  template: ContentPipelineStep[],
  agents: Array<{ id: string; name: string; role: string }>,
): Array<{ step: number; name: string; type: string; agentId?: string; format?: string; sourceStepId?: string; checkpointFields?: ContentPipelineStep["checkpointFields"] }> {
  const roleMap = new Map<string, string>();

  // Map roles to agents by matching role keywords
  const roleKeywords: Record<string, string[]> = {
    researcher: ["pesquisa", "research", "tendência", "tendencia", "insight", "alvo", "análise", "analise"],
    copywriter: ["conteúdo", "conteudo", "copy", "redação", "redacao", "texto", "criação", "criacao", "social"],
    designer: ["design", "visual", "arte", "criação visual", "criacao visual", "imagem"],
    reviewer: ["revisão", "revisao", "review", "qualidade", "veredito"],
    publisher: ["publicação", "publicacao", "publish", "social", "alcance", "post"],
  };

  for (const [role, keywords] of Object.entries(roleKeywords)) {
    const match = agents.find(a => {
      const lowerRole = a.role.toLowerCase();
      const lowerName = a.name.toLowerCase();
      return keywords.some(kw => lowerRole.includes(kw) || lowerName.includes(kw));
    });
    if (match) roleMap.set(role, match.id);
  }

  // Fallback: assign first available agent to unmatched roles
  const usedIds = new Set(roleMap.values());
  const availableAgents = agents.filter(a => !usedIds.has(a.id));

  return template.map(step => ({
    step: step.step,
    name: step.name,
    type: step.type,
    agentId: step.agentRole ? (roleMap.get(step.agentRole) ?? availableAgents[0]?.id) : undefined,
    format: step.format,
    sourceStepId: step.sourceStep ? `step-${step.sourceStep}` : undefined,
    checkpointFields: step.checkpointFields,
  }));
}
