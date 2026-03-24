// ──────────────────────────────────────────────
// Organization
// ──────────────────────────────────────────────

export type OrgPlan = "free" | "pro" | "enterprise";
export type UserRole = "owner" | "admin" | "member" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  logoUrl: string | null;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────
// Squad
// ──────────────────────────────────────────────

export type SquadStatus = "active" | "paused" | "archived";

export interface SquadConfig {
  name: string;
  code: string;
  description: string;
  icon: string;
  version: string;
  performanceMode: "alta-performance" | "econômico";
  budget?: BudgetConfig;
  skills: string[];
  data: string[];
  agents: AgentDefinition[];
  pipeline: { entry: string };
}

export interface BudgetConfig {
  monthlyTokens: number;
  warningThreshold: number;
  pauseThreshold: number;
}

// ──────────────────────────────────────────────
// Agent
// ──────────────────────────────────────────────

export type ModelTier = "powerful" | "fast";
export type RuntimeType = "claude-code" | "codex" | "custom";
export type AgentStatus = "idle" | "working" | "paused";
export type AgentExecutionStatus = "idle" | "working" | "delivering" | "done" | "checkpoint";

export interface AgentTask {
  id: string;
  name: string;
  order: number;
  input: string;
  output: string;
  process: string[];
  outputFormat?: string;
  outputExample?: string;
  qualityCriteria: string[];
  vetoConditions: string[];
}

export interface AgentPersona {
  role: string;
  identity: string;
  communicationStyle: string;
}

export interface AgentDeepConfig {
  persona?: AgentPersona;
  principles?: string[];
  operationalFramework?: { process: string[]; decisionCriteria: string[] };
  voiceGuidance?: {
    alwaysUse: Array<{ term: string; reason: string }>;
    neverUse: Array<{ term: string; reason: string }>;
    toneRules: string[];
  };
  outputExamples?: string[];
  antiPatterns?: { neverDo: Array<{ mistake: string; reason: string }>; alwaysDo: Array<{ practice: string; reason: string }> };
  qualityCriteria?: string[];
  integration?: { readsFrom: string[]; writesTo: string[]; triggers: string[]; dependsOn: string[] };
}

export interface AgentDefinition {
  id: string;
  name: string;
  icon: string;
  custom: string;
  tasks?: AgentTask[];
  deepConfig?: AgentDeepConfig;
}

export interface AgentState {
  id: string;
  name: string;
  icon: string;
  status: AgentExecutionStatus;
  deliverTo: string | null;
  desk: { col: number; row: number };
}

// ──────────────────────────────────────────────
// Task
// ──────────────────────────────────────────────

export type TaskStatus = "backlog" | "ready" | "in_progress" | "in_review" | "done" | "blocked";
export type TaskPriority = "p0" | "p1" | "p2" | "p3";
export type TaskType = "feature" | "fix" | "content" | "research" | "review";

// ──────────────────────────────────────────────
// Execution
// ──────────────────────────────────────────────

export type ExecutionStatus = "running" | "completed" | "failed" | "cancelled";

// ──────────────────────────────────────────────
// State (real-time)
// ──────────────────────────────────────────────

export type SquadRunStatus = "idle" | "running" | "completed" | "checkpoint" | "failed";

export interface SquadState {
  squad: string;
  executionId: string;
  status: SquadRunStatus;
  step: {
    current: number;
    total: number;
    label: string;
  };
  agents: AgentState[];
  handoff: Handoff | null;
  budget?: BudgetSnapshot;
  metrics?: MetricsSnapshot;
  startedAt: string | null;
  updatedAt: string;
  completedAt: string | null;
}

export interface Handoff {
  from: string;
  to: string;
  message: string;
  completedAt: string;
}

export interface BudgetSnapshot {
  totalTokens: number;
  usedTokens: number;
  estimatedCost: number;
  perAgent: Record<string, { tokens: number; cost: number }>;
}

export interface MetricsSnapshot {
  stepsCompleted: number;
  stepsRemaining: number;
  avgStepDuration: number;
  estimatedCompletion: string | null;
}

// ──────────────────────────────────────────────
// Pipeline
// ──────────────────────────────────────────────

export type StepType = "agent" | "checkpoint" | "ci";
export type ExecutionMode = "inline" | "subagent";

export interface PipelineStep {
  id: string;
  name: string;
  agent?: string;
  type?: StepType;
  execution?: ExecutionMode;
  modelTier?: ModelTier;
  file?: string;
  outputFile?: string;
  skills?: string[];
  dependsOn?: string[];
  parallelWith?: string[];
  condition?: string;
  message?: string;
  options?: string[];
  // Veto conditions
  vetoConditions?: string[];
  maxVetoRetries?: number;
  // Review loops
  onReject?: string;
  maxReviewCycles?: number;
  // Format injection (platform best practices)
  format?: string;
}

export interface RunContext {
  runId: string;
  startedAt: string;
  outputs: Map<string, RunStepOutput>;
}

export interface RunStepOutput {
  stepId: string;
  agentId: string;
  version: number;
  content: string;
  timestamp: string;
  vetoed: boolean;
  reviewFeedback?: string;
}

export interface PipelineDefinition {
  name: string;
  description?: string;
  steps: PipelineStep[];
}

// ──────────────────────────────────────────────
// Skill
// ──────────────────────────────────────────────

export type SkillType = "mcp" | "script" | "hybrid" | "prompt";

export interface SkillDefinition {
  name: string;
  description: string;
  type: SkillType;
  version: string;
  categories: string[];
  mcp?: {
    serverName: string;
    command: string;
    args: string[];
    transport: "stdio" | "http";
  };
  script?: {
    path: string;
    runtime: "node" | "python" | "bash";
    invoke: string;
    dependencies: string[];
  };
  env: string[];
  instructions: string;
}

// ──────────────────────────────────────────────
// Integration
// ──────────────────────────────────────────────

export type IntegrationTier = "premium" | "generic";
export type IntegrationStatus = "active" | "inactive" | "error" | "disconnected";

// ──────────────────────────────────────────────
// Audit
// ──────────────────────────────────────────────

export type ActorType = "user" | "agent" | "system";

export interface AuditEvent {
  action: string;
  actorType: ActorType;
  actorId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

// ──────────────────────────────────────────────
// WebSocket Messages
// ──────────────────────────────────────────────

export type WsMessage =
  | { type: "SNAPSHOT"; squads: SquadConfig[]; activeStates: Record<string, SquadState> }
  | { type: "SQUAD_UPDATE"; squad: string; state: SquadState }
  | { type: "SQUAD_INACTIVE"; squad: string }
  | { type: "CHAT_MESSAGE"; squadId: string; message: ChatMessage };

export interface ChatMessage {
  id: string;
  squadId: string;
  senderId?: string;
  agentId?: string;
  content: string;
  role: "user" | "agent" | "system";
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Message Role
// ──────────────────────────────────────────────

export type MessageRole = "user" | "agent" | "system";
