import { z } from "zod";

// ──────────────────────────────────────────────
// Squad YAML Validation
// ──────────────────────────────────────────────

export const agentDefinitionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "Agent ID must be kebab-case alphanumeric"),
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(10),
  custom: z.string().min(1),
});

export const budgetConfigSchema = z.object({
  monthly_tokens: z.number().positive(),
  warning_threshold: z.number().min(0).max(1).default(0.8),
  pause_threshold: z.number().min(0).max(1).default(1.0),
}).refine(
  (data) => data.warning_threshold < data.pause_threshold,
  { message: "warning_threshold must be less than pause_threshold" },
);

export const squadYamlSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().regex(/^[a-z0-9-]+$/, "Code must be kebab-case"),
  description: z.string().min(1),
  icon: z.string().min(1).max(10),
  version: z.string().default("1.0.0"),
  organization: z.string().optional(),
  budget: budgetConfigSchema.optional(),
  performance_mode: z.enum(["alta-performance", "econômico"]).default("alta-performance"),
  skills: z.array(z.string()).default([]),
  data: z.array(z.string()).default([]),
  agents: z.array(agentDefinitionSchema).min(2, "A squad needs at least 2 agents"),
  pipeline: z.object({
    entry: z.string().min(1),
  }),
  output_dir: z.string().default("output/"),
});

// ──────────────────────────────────────────────
// Pipeline Step Validation
// ──────────────────────────────────────────────

export const pipelineStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  agent: z.string().optional(),
  type: z.enum(["agent", "checkpoint", "ci"]).optional(),
  execution: z.enum(["inline", "subagent"]).optional(),
  model_tier: z.enum(["powerful", "fast"]).default("powerful"),
  file: z.string().optional(),
  outputFile: z.string().optional(),
  skills: z.array(z.string()).optional(),
  depends_on: z.array(z.string()).optional(),
  parallel_with: z.array(z.string()).optional(),
  condition: z.string().optional(),
  message: z.string().optional(),
  options: z.array(z.string()).optional(),
});

export const pipelineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(pipelineStepSchema).min(1),
});

// ──────────────────────────────────────────────
// Skill Definition Validation
// ──────────────────────────────────────────────

export const skillDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["mcp", "script", "hybrid", "prompt"]),
  version: z.string().default("1.0.0"),
  categories: z.array(z.string()).default([]),
  mcp: z.object({
    server_name: z.string(),
    command: z.string(),
    args: z.array(z.string()),
    transport: z.enum(["stdio", "http"]).default("stdio"),
  }).optional(),
  script: z.object({
    path: z.string(),
    runtime: z.enum(["node", "python", "bash"]),
    invoke: z.string(),
    dependencies: z.array(z.string()).default([]),
  }).optional(),
  env: z.array(z.string()).default([]),
});

// ──────────────────────────────────────────────
// State Validation
// ──────────────────────────────────────────────

export const agentStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  status: z.enum(["idle", "working", "delivering", "done", "checkpoint"]),
  deliverTo: z.string().nullable(),
  desk: z.object({
    col: z.number().int().positive(),
    row: z.number().int().positive(),
  }),
});

export const squadStateSchema = z.object({
  squad: z.string(),
  executionId: z.string().optional(),
  status: z.enum(["idle", "running", "completed", "checkpoint", "failed"]),
  step: z.object({
    current: z.number().int().min(0),
    total: z.number().int().positive(),
    label: z.string(),
  }),
  agents: z.array(agentStateSchema),
  handoff: z.object({
    from: z.string(),
    to: z.string(),
    message: z.string(),
    completedAt: z.string(),
  }).nullable(),
  startedAt: z.string().nullable(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
});

// ──────────────────────────────────────────────
// Type Exports
// ──────────────────────────────────────────────

export type SquadYaml = z.infer<typeof squadYamlSchema>;
export type ValidatedPipelineStep = z.infer<typeof pipelineStepSchema>;
export type Pipeline = z.infer<typeof pipelineSchema>;
export type ValidatedSkillDefinition = z.infer<typeof skillDefinitionSchema>;
export type ValidatedAgentState = z.infer<typeof agentStateSchema>;
export type ValidatedSquadState = z.infer<typeof squadStateSchema>;
