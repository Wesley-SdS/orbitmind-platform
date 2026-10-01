/**
 * Tipos compartilhados do escritório virtual (dados + renderer).
 */

export type OfficeAgentStatus = "idle" | "working" | "done" | "checkpoint" | "delivering";

/** Id reservado do avatar humano na cena. */
export const USER_ID = "__user__";

export const STATUS_LABELS: Record<OfficeAgentStatus, string> = {
  idle: "Disponível",
  working: "Trabalhando",
  done: "Concluído",
  checkpoint: "Checkpoint",
  delivering: "Entregando",
};

export type FloorType = "wood" | "carpet" | "tile" | "darkwood" | "parquet" | "stone";

/**
 * Aparência de um personagem (cores 0xRRGGBB). Como no kit visual: a camisa
 * indica o papel; cabelo e pele variam; o corpo é o mesmo para todos.
 */
export interface AvatarLook {
  shirt: number;
  hair: number;
  skin: number;
  /** Avatar humano: tag laranja e anel fixo no chão. */
  isUser?: boolean;
}

export interface OfficeRoom {
  id: string;
  name: string;
  /** Cor de destaque (etiquetas, minimapa). */
  accent: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floor: FloorType;
  /** Portas por lado, em tiles relativos ao início da parede: [a, b). */
  doors: Partial<Record<"n" | "s" | "e" | "w", [number, number]>>;
}

/** Um lugar onde um agente pode ficar: uma cadeira de mesa ou um ponto em pé. */
export interface OfficeSeat {
  roomId: string;
  /** Posição do agente (centro dos pés) em tiles. */
  x: number;
  y: number;
  /** Índice da mesa no `DESKS` da sala, quando é uma cadeira. */
  deskIndex?: number;
}

export interface OfficeAgent {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: OfficeAgentStatus;
  roomId: string;
  seat: OfficeSeat;
  look: AvatarLook;
  /** Cor da camisa (0xRRGGBB), atalho para `look.shirt`. */
  color: number;
  modelTier?: string;
  monthlyBudgetTokens?: number | null;
  budgetUsedTokens?: number;
  /** Nome da etapa em execução (quando trabalhando). */
  currentStep?: string | null;
  currentStepStartedAt?: string | null;
  /** Modelo que o agente usa (id do provedor, ex.: "claude-sonnet-4-6"). */
  model?: string | null;
  /** Custo deste agente na execução atual, em centavos de US$. */
  runCostCents?: number;
  /** Duração média das etapas já concluídas pelo agente (ms), para estimar o progresso. */
  avgStepMs?: number | null;
}

export interface OfficeHandoff {
  fromId: string;
  toId: string;
  at: number;
}

/**
 * Evento do feed. A frase é montada como no design: ator em negrito, ação e,
 * quando houver, o destinatário em negrito no fim ("Samuel SEO está levando o
 * relatório para Diana Design").
 */
export interface OfficeEvent {
  id: string;
  kind: "done" | "handoff" | "checkpoint" | "start" | "failed" | "info";
  /** Ação, sem o ator e sem o destinatário. */
  text: string;
  at: number;
  agentId?: string;
  actor?: string;
  target?: string;
  /** Texto da ação depois que o movimento terminou (handoff: "entregou" no lugar de "está levando"). */
  settledText?: string;
}

export interface OfficePipelineInfo {
  runId: string | null;
  status: "idle" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  currentStepIndex: number;
  totalSteps: number;
  currentStepName: string | null;
  startedAt: string | null;
  /** Quando o pipeline parou no checkpoint atual. */
  pausedAt?: string | null;
  checkpointStepId: string | null;
  checkpointStepName: string | null;
  checkpointType: string | null;
  checkpointAgentId: string | null;
  stepOutputs: Record<string, { agentName: string; agentIcon: string; content: string; completedAt: string }>;
  sourceStepOutput: string | null;
  /** Etapas do pipeline configuradas no squad, na ordem. */
  steps: Array<{ step: number; name: string; type: string; agentId?: string }>;
  /** Número sequencial da execução no squad (EXEC #42). */
  runNumber?: number | null;
  /** Nome da etapa que o checkpoint libera ("Aprovar e liberar Publicação"). */
  nextStepName?: string | null;
}
