export type ArchitectPhase =
  | "idle"
  | "discovery"
  | "naming"
  | "design"
  | "list-action"
  | "edit-select"
  | "edit-modify"
  | "edit-confirm"
  | "delete-confirm"
  | "action-select-squad"
  | "skill-select"
  | "skill-config"
  | "skill-confirm"
  | "complete";

export interface ArchitectConversationState {
  phase: ArchitectPhase;
  orgId: string;
  discoveryStep: number;
  discovery: {
    purpose?: string;
    audience?: string;
    performanceMode?: "high" | "economic";
    targetFormats?: string[];
    customRequirements?: string;
  };
  proposedDesign?: {
    name: string;
    code: string;
    description: string;
    icon: string;
    performanceMode: string;
    agents: Array<{
      id: string;
      name: string;
      role: string;
      icon: string;
      modelTier: "powerful" | "fast";
      execution: "inline" | "subagent";
      description: string;
    }>;
    pipeline: Array<{
      step: number;
      name: string;
      type: "agent" | "checkpoint";
      agentId?: string;
    }>;
    skills: string[];
  };
  nameSuggestions?: string[];
  createdSquadId?: string;
  editSquadId?: string;
  editSquadName?: string;
  pendingChanges?: Record<string, unknown>;
  deleteSquadId?: string;
  deleteSquadName?: string;
  // For action-select-squad: what to do after selecting
  pendingAction?: string;
  pendingActionMessage?: string;
  // Skill configuration wizard
  skillConfigId?: string;
  skillConfigStep?: number;
  skillConfigValues?: Record<string, string>;
  // Company wizard
  wizardStep?: number;
  wizardData?: {
    name?: string;
    sector?: string;
    audience?: string;
    tone?: string;
    competitors?: string | null;
  };
}

export type UserIntent =
  | "create" | "edit" | "list" | "delete" | "status"
  | "create-tasks" | "move-task" | "delete-task" | "view-tasks"
  | "pause-squad" | "activate-squad"
  | "change-model" | "change-budget"
  | "view-agents" | "duplicate-squad" | "export-squad"
  | "install-skill" | "guide-integration" | "config-skill"
  | "run-pipeline"
  | "pipeline-list" | "pipeline-edit" | "pipeline-create"
  | "pipeline-toggle" | "pipeline-trigger"
  | "pipeline-runs" | "pipeline-detail"
  | "general";

export function detectIntent(message: string): UserIntent {
  const lower = message.toLowerCase();

  // Task operations
  if (/\b(cri\w* tasks?|gerar? tasks?|criar? todas? as? tasks?|tasks? para|monte? as? tasks?)\b/.test(lower)) return "create-tasks";
  if (/\b(mover? task|mova task|task.*para (done|pronto|conclu|backlog|progress|review))\b/.test(lower)) return "move-task";
  if (/\b(deletar? task|remover? task|excluir? task|apagar? task)\b/.test(lower)) return "delete-task";
  if (/\b(ver tasks?|mostrar? tasks?|board|kanban|quais tasks?|o que tem no board)\b/.test(lower)) return "view-tasks";

  // Squad management
  if (/\b(pausar?|pause)\b/.test(lower)) return "pause-squad";
  if (/\b(ativar?|reativar?|activate|resume)\b/.test(lower)) return "activate-squad";
  if (/\b(duplicar?|copiar? squad|clonar?)\b/.test(lower)) return "duplicate-squad";
  if (/\b(exportar?|export|yaml|json do squad)\b/.test(lower)) return "export-squad";
  if (/\b(rodar?|executar?|run|iniciar? pipeline|disparar?)\b/.test(lower)) return "run-pipeline";

  // Agent config
  if (/\b(mudar? modelo|trocar? modelo|modelo.*haiku|modelo.*opus|modelo.*sonnet|model tier)\b/.test(lower)) return "change-model";
  if (/\b(budget|orcamento|token.*limit|aumentar? budget|limite de token)\b/.test(lower)) return "change-budget";
  if (/\b(ver agentes?|mostrar? agentes?|quais agentes?|listar? agentes?)\b/.test(lower)) return "view-agents";

  // Pipeline / Esteira management
  if (/\b(mostre? os agentes da esteira|liste? os agentes|agentes do repo|agentes da esteira|mostre? a esteira|quais workflows|mostre? os workflows)\b/.test(lower)) return "pipeline-list";
  if (/\b(edite? o (reviewer|architect|developer|autofix|designer|docs|ideator|taskmaster|qa|release)|mais rigoroso|menos rigoroso)\b/.test(lower)) return "pipeline-edit";
  if (/\b(crie? um agente|novo agente|adicione? um workflow|crie? um workflow|novo workflow)\b/.test(lower)) return "pipeline-create";
  if (/\b(desabilite?|habilite?|pause? o|ative? o|desligue?|ligue?)\b.*\b(agente|workflow|esteira)\b/.test(lower)) return "pipeline-toggle";
  if (/\b(desabilite?|habilite?)\b.*\b(reviewer|architect|developer|autofix|designer|docs|ideator|taskmaster|qa|release)\b/.test(lower)) return "pipeline-toggle";
  if (/\b(rode? o|execute? o|dispare? o|trigger)\b.*\b(reviewer|architect|developer|autofix|designer|docs|ideator|taskmaster|qa|release|workflow|esteira|pipeline)\b/.test(lower)) return "pipeline-trigger";
  if (/\b(mostre? os runs|ultimo run|status do run|historico de runs)\b/.test(lower)) return "pipeline-runs";
  if (/\b(mostre? o skill|mostre? o prompt|como esta configurado|o que o \w+ faz)\b/.test(lower)) return "pipeline-detail";

  // Skills & Integrations
  if (/\b(configurar?|configur[ae]|instalar?|conectar?|ativar?|habilitar?)\b.*\b(instagram|linkedin|blotato|canva|apify)\b/.test(lower)) return "config-skill";
  if (/\b(instagram|linkedin|blotato|canva|apify)\b.*\b(configurar?|configur[ae]|instalar?|conectar?|ativar?|habilitar?)\b/.test(lower)) return "config-skill";
  if (/\b(como\s+(integr|conect|configur|public))\b.*\b(instagram|linkedin|rede|social)\b/.test(lower)) return "guide-integration";
  if (/\b(integra[çc][aã]o|integrar)\b.*\b(instagram|linkedin|rede|social|blotato)\b/.test(lower)) return "guide-integration";
  if (/\b(passo a passo|tutorial|como fa[çc]o|me ensina|me ajuda)\b.*\b(instagram|linkedin|publica|post)\b/.test(lower)) return "guide-integration";
  if (/\b(publicar|postar)\b.*\b(instagram|linkedin|rede)\b/.test(lower)) return "guide-integration";
  if (/\b(instalar? skill|adicionar? skill|configurar? skill)\b/.test(lower)) return "install-skill";

  // Squad CRUD
  if (/\b(deletar|delete|remover squad|excluir|apagar)\b/.test(lower)) return "delete";
  if (/\b(listar|liste|mostrar squads|mostre squads|quais squads|meus squads|ver squads)\b/.test(lower)) return "list";
  if (/\b(criar squad|crie squad|novo squad|montar squad|quero um squad|preciso de um squad)\b/.test(lower)) return "create";
  if (/\b(editar|edite|modificar|alterar|mudar|ajustar|trocar|atualizar|edit|update|quem vai|falta|cadê|cade)\b/.test(lower)) return "edit";
  if (/adicionar\b.*\bagente|remover\b.*\bagente|agente\b.*\b(a mais|novo|nova)/.test(lower)) return "edit";
  if (/\b(status|como esta|como tá|andamento|progresso)\b/.test(lower)) return "status";
  if (/\b(criar|crie|novo|nova|montar|monte|create|new)\b/.test(lower)) return "create";

  return "general";
}
