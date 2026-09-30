// ──────────────────────────────────────────────
// Model Tiers
// ──────────────────────────────────────────────

export const MODEL_TIERS = {
  powerful: {
    "claude-code": "claude-opus-4-6",
    codex: "o3",
    custom: "powerful",
  },
  fast: {
    "claude-code": "claude-haiku-4-5-20251001",
    codex: "gpt-4o-mini",
    custom: "fast",
  },
} as const;

// ──────────────────────────────────────────────
// Budget
// ──────────────────────────────────────────────

export const BUDGET_DEFAULTS = {
  WARNING_THRESHOLD: 0.8,
  PAUSE_THRESHOLD: 1.0,
  FREE_MONTHLY_TOKENS: 100_000,
  PRO_MONTHLY_TOKENS: 1_000_000,
  ENTERPRISE_MONTHLY_TOKENS: 10_000_000,
} as const;

// ──────────────────────────────────────────────
// Plan Limits
// ──────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: { squads: 1, agents: 3, executionsPerMonth: 100 },
  pro: { squads: 5, agents: 15, executionsPerMonth: 1_000 },
  enterprise: { squads: Infinity, agents: Infinity, executionsPerMonth: 10_000 },
} as const;

// ──────────────────────────────────────────────
// Native Skills
// ──────────────────────────────────────────────

export const NATIVE_SKILLS = ["web_search", "web_fetch"] as const;

// ──────────────────────────────────────────────
// Agent Status Colors (for UI)
// ──────────────────────────────────────────────

export const AGENT_STATUS_COLORS = {
  idle: "#94a3b8",
  working: "#3b82f6",
  delivering: "#f59e0b",
  done: "#22c55e",
  checkpoint: "#a855f7",
} as const;

// ──────────────────────────────────────────────
// Task Priority Labels
// ──────────────────────────────────────────────

export const PRIORITY_LABELS = {
  p0: "Critical",
  p1: "High",
  p2: "Medium",
  p3: "Low",
} as const;

// ──────────────────────────────────────────────
// Handoff Animation Duration (ms)
// ──────────────────────────────────────────────

export const HANDOFF_DELAY_MS = 3000;

// ──────────────────────────────────────────────
// Quote Requests (pedidos de orçamento da landing)
// ──────────────────────────────────────────────

export const QUOTE_ENGAGEMENTS = ["continuous", "project", "consulting"] as const;

export const QUOTE_SOLUTION_TYPES = [
  "web_platform",
  "mobile_app",
  "ai_agents",
  "whatsapp_bots",
  "integrations",
  "legacy_evolution",
  "other",
] as const;

export const QUOTE_TIMELINES = ["asap", "1_3_months", "3_6_months", "flexible"] as const;

export const QUOTE_STATUSES = ["new", "contacted", "proposal_sent", "won", "lost"] as const;

/** Faixas de projeto fechado e faixas mensais (desenvolvimento contínuo) no mesmo enum. */
export const QUOTE_BUDGETS = [
  "up_to_20k",
  "20k_50k",
  "50k_150k",
  "over_150k",
  "monthly_up_to_15k",
  "monthly_15k_40k",
  "monthly_over_40k",
  "undecided",
] as const;

// ──────────────────────────────────────────────
// Desk Grid
// ──────────────────────────────────────────────

export const DESK_COLUMNS = 3;

export function calculateDeskPosition(index: number): { col: number; row: number } {
  return {
    col: (index % DESK_COLUMNS) + 1,
    row: Math.floor(index / DESK_COLUMNS) + 1,
  };
}
