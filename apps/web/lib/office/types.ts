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
  /** Cor da camisa (0xRRGGBB). */
  color: number;
  hair: number;
  skin: number;
  modelTier?: string;
  monthlyBudgetTokens?: number | null;
  budgetUsedTokens?: number;
  /** Nome da etapa em execução (quando trabalhando). */
  currentStep?: string | null;
  currentStepStartedAt?: string | null;
}

export interface OfficeHandoff {
  fromId: string;
  toId: string;
  at: number;
}

export interface OfficeEvent {
  id: string;
  kind: "done" | "handoff" | "checkpoint" | "start" | "failed" | "info";
  text: string;
  at: number;
  agentId?: string;
}

export interface OfficePipelineInfo {
  runId: string | null;
  status: "idle" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  currentStepIndex: number;
  totalSteps: number;
  currentStepName: string | null;
  startedAt: string | null;
  checkpointStepId: string | null;
  checkpointStepName: string | null;
  checkpointType: string | null;
  checkpointAgentId: string | null;
  stepOutputs: Record<string, { agentName: string; agentIcon: string; content: string; completedAt: string }>;
  sourceStepOutput: string | null;
  /** Etapas do pipeline configuradas no squad, na ordem. */
  steps: Array<{ step: number; name: string; type: string; agentId?: string }>;
}
