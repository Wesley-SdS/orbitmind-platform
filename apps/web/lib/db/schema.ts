import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  bigint,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

export const orgPlanEnum = pgEnum("org_plan", ["free", "pro", "enterprise"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "member", "viewer"]);
export const squadStatusEnum = pgEnum("squad_status", ["active", "paused", "archived"]);
export const agentStatusEnum = pgEnum("agent_status", ["idle", "working", "paused"]);
export const modelTierEnum = pgEnum("model_tier", ["powerful", "fast"]);
export const runtimeTypeEnum = pgEnum("runtime_type", ["claude-code", "codex", "custom"]);
export const taskStatusEnum = pgEnum("task_status", [
  "backlog", "ready", "in_progress", "in_review", "done", "blocked",
]);
export const taskPriorityEnum = pgEnum("task_priority", ["p0", "p1", "p2", "p3"]);
export const taskTypeEnum = pgEnum("task_type", ["feature", "fix", "content", "research", "review"]);
export const executionStatusEnum = pgEnum("execution_status", [
  "running", "completed", "failed", "cancelled",
]);
export const actorTypeEnum = pgEnum("actor_type", ["user", "agent", "system"]);
export const integrationTypeEnum = pgEnum("integration_type", [
  "github", "gitlab", "discord", "telegram", "slack",
]);
export const integrationStatusEnum = pgEnum("integration_status", ["active", "inactive", "error"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "agent", "system"]);

// ──────────────────────────────────────────────
// Organizations
// ──────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: orgPlanEnum("plan").notNull().default("free"),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: userRoleEnum("role").notNull().default("member"),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("users_org_id_idx").on(table.orgId),
]);

// ──────────────────────────────────────────────
// Sessions (NextAuth)
// ──────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 100 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 50 }),
  scope: text("scope"),
  idToken: text("id_token"),
}, (table) => [
  uniqueIndex("accounts_provider_account_idx").on(table.provider, table.providerAccountId),
]);

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex("verification_tokens_identifier_token_idx").on(table.identifier, table.token),
]);

// ──────────────────────────────────────────────
// Squads
// ──────────────────────────────────────────────

export const squads = pgTable("squads", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 10 }),
  config: jsonb("config").default({}),
  status: squadStatusEnum("status").notNull().default("active"),
  templateId: varchar("template_id", { length: 100 }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("squads_org_code_idx").on(table.orgId, table.code),
  index("squads_org_id_idx").on(table.orgId),
]);

// ──────────────────────────────────────────────
// Agents
// ──────────────────────────────────────────────

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  squadId: uuid("squad_id").notNull().references(() => squads.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  role: text("role").notNull(),
  icon: varchar("icon", { length: 10 }),
  modelTier: modelTierEnum("model_tier").notNull().default("powerful"),
  runtimeType: runtimeTypeEnum("runtime_type").notNull().default("claude-code"),
  monthlyBudgetTokens: bigint("monthly_budget_tokens", { mode: "number" }),
  budgetUsedTokens: bigint("budget_used_tokens", { mode: "number" }).notNull().default(0),
  status: agentStatusEnum("status").notNull().default("idle"),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("agents_squad_id_idx").on(table.squadId),
]);

// ──────────────────────────────────────────────
// Tasks
// ──────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  squadId: uuid("squad_id").notNull().references(() => squads.id, { onDelete: "cascade" }),
  assignedAgentId: uuid("assigned_agent_id").references(() => agents.id, { onDelete: "set null" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("backlog"),
  priority: taskPriorityEnum("priority").notNull().default("p2"),
  type: taskTypeEnum("type").notNull().default("feature"),
  metadata: jsonb("metadata").default({}),
  parentTaskId: uuid("parent_task_id").references((): any => tasks.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("tasks_squad_id_idx").on(table.squadId),
  index("tasks_status_idx").on(table.status),
  index("tasks_assigned_agent_idx").on(table.assignedAgentId),
]);

// ──────────────────────────────────────────────
// Executions
// ──────────────────────────────────────────────

export const executions = pgTable("executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  squadId: uuid("squad_id").notNull().references(() => squads.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  agentId: uuid("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  pipelineStep: varchar("pipeline_step", { length: 100 }),
  status: executionStatusEnum("status").notNull().default("running"),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  tokensUsed: integer("tokens_used").notNull().default(0),
  estimatedCost: integer("estimated_cost_cents").notNull().default(0),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  error: text("error"),
}, (table) => [
  index("executions_squad_id_idx").on(table.squadId),
  index("executions_agent_id_idx").on(table.agentId),
  index("executions_status_idx").on(table.status),
]);

// ──────────────────────────────────────────────
// Audit Log
// ──────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  squadId: uuid("squad_id").references(() => squads.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorId: varchar("actor_id", { length: 255 }).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_logs_org_id_idx").on(table.orgId),
  index("audit_logs_squad_id_idx").on(table.squadId),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

// ──────────────────────────────────────────────
// Integrations
// ──────────────────────────────────────────────

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  type: integrationTypeEnum("type").notNull(),
  config: jsonb("config").default({}),
  status: integrationStatusEnum("status").notNull().default("inactive"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("integrations_org_id_idx").on(table.orgId),
]);

// ──────────────────────────────────────────────
// Messages (Chat)
// ──────────────────────────────────────────────

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  squadId: uuid("squad_id").notNull().references(() => squads.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  role: messageRoleEnum("role").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("messages_squad_id_idx").on(table.squadId),
  index("messages_created_at_idx").on(table.createdAt),
]);

// ──────────────────────────────────────────────
// Relations
// ──────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  squads: many(squads),
  integrations: many(integrations),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, { fields: [users.orgId], references: [organizations.id] }),
  sessions: many(sessions),
  accounts: many(accounts),
  createdSquads: many(squads),
  messages: many(messages),
}));

export const squadsRelations = relations(squads, ({ one, many }) => ({
  organization: one(organizations, { fields: [squads.orgId], references: [organizations.id] }),
  createdBy: one(users, { fields: [squads.createdBy], references: [users.id] }),
  agents: many(agents),
  tasks: many(tasks),
  executions: many(executions),
  messages: many(messages),
  auditLogs: many(auditLogs),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  squad: one(squads, { fields: [agents.squadId], references: [squads.id] }),
  tasks: many(tasks),
  executions: many(executions),
  messages: many(messages),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  squad: one(squads, { fields: [tasks.squadId], references: [squads.id] }),
  assignedAgent: one(agents, { fields: [tasks.assignedAgentId], references: [agents.id] }),
  parentTask: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id] }),
  subtasks: many(tasks),
  executions: many(executions),
}));

export const executionsRelations = relations(executions, ({ one }) => ({
  squad: one(squads, { fields: [executions.squadId], references: [squads.id] }),
  task: one(tasks, { fields: [executions.taskId], references: [tasks.id] }),
  agent: one(agents, { fields: [executions.agentId], references: [agents.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  squad: one(squads, { fields: [messages.squadId], references: [squads.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  agent: one(agents, { fields: [messages.agentId], references: [agents.id] }),
}));
