import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  bigint,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

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
export const integrationTierEnum = pgEnum("integration_tier", ["premium", "generic"]);
export const integrationStatusEnum = pgEnum("integration_status", ["active", "inactive", "error", "disconnected"]);
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
  companyContext: jsonb("company_context").default({}),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  language: varchar("language", { length: 10 }).notNull().default("pt-BR"),
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
  // Run folders
  runId: varchar("run_id", { length: 30 }),
  version: integer("version").default(1),
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

export const orgIntegrations = pgTable("org_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  integrationId: varchar("integration_id", { length: 50 }).notNull(),
  nangoConnectionId: varchar("nango_connection_id", { length: 200 }),
  tier: integrationTierEnum("tier").notNull().default("generic"),
  status: integrationStatusEnum("status").notNull().default("disconnected"),
  config: jsonb("config").notNull().default({}),
  enabledCapabilities: jsonb("enabled_capabilities").$type<string[]>().notNull().default([]),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastError: text("last_error"),
  connectedAt: timestamp("connected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("org_integrations_org_id_idx").on(table.orgId),
  uniqueIndex("org_integrations_org_integration_idx").on(table.orgId, table.integrationId),
]);

export const integrationWebhooks = pgTable("integration_webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  integrationId: varchar("integration_id", { length: 50 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("integration_webhooks_org_id_idx").on(table.orgId),
  index("integration_webhooks_integration_id_idx").on(table.integrationId),
]);

// Keep legacy alias for backward compatibility during migration
export const integrations = orgIntegrations;

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
// Squad Memories
// ──────────────────────────────────────────────

export const memoryTypeEnum = pgEnum("memory_type", [
  "preference", "decision", "feedback", "pattern", "correction",
]);

export const squadMemories = pgTable("squad_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  squadId: uuid("squad_id").notNull().references(() => squads.id, { onDelete: "cascade" }),
  type: memoryTypeEnum("type").notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 200 }),
  importance: integer("importance").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("squad_memories_squad_id_idx").on(table.squadId),
]);

// ──────────────────────────────────────────────
// Investigations (Sherlock)
// ──────────────────────────────────────────────

export const investigations = pgTable("investigations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  squadId: uuid("squad_id").references(() => squads.id, { onDelete: "set null" }),
  profileUrl: text("profile_url").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  rawContents: jsonb("raw_contents"),
  patternAnalysis: jsonb("pattern_analysis"),
  consolidatedAnalysis: jsonb("consolidated_analysis"),
  contentsExtracted: integer("contents_extracted").default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("investigations_org_id_idx").on(table.orgId),
  index("investigations_squad_id_idx").on(table.squadId),
]);

// ──────────────────────────────────────────────
// Organization Skills
// ──────────────────────────────────────────────

export const skillTypeEnum = pgEnum("skill_type", ["mcp", "script", "api", "prompt"]);

export const orgSkills = pgTable("org_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  skillId: varchar("skill_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  type: skillTypeEnum("type").notNull(),
  version: varchar("version", { length: 20 }).notNull().default("1.0.0"),
  config: jsonb("config").notNull().default({}),
  encryptedSecrets: text("encrypted_secrets"),
  isActive: boolean("is_active").notNull().default(false),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("org_skills_org_id_idx").on(table.orgId),
]);

// ──────────────────────────────────────────────
// LLM Providers
// ──────────────────────────────────────────────

export const llmProviderTypeEnum = pgEnum("llm_provider_type", [
  "anthropic",
  "openai",
  "gemini",
]);

export const llmAuthMethodEnum = pgEnum("llm_auth_method", [
  "oauth_token",
  "api_key",
]);

export const llmProviders = pgTable("llm_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  provider: llmProviderTypeEnum("provider").notNull(),
  authMethod: llmAuthMethodEnum("auth_method").notNull(),
  encryptedCredential: text("encrypted_credential").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  defaultModel: varchar("default_model", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  totalTokensUsed: bigint("total_tokens_used", { mode: "number" }).notNull().default(0),
  totalCostCents: integer("total_cost_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("llm_providers_org_id_idx").on(table.orgId),
]);

// ──────────────────────────────────────────────
// Marketplace
// ──────────────────────────────────────────────

export const marketplaceItemTypeEnum = pgEnum("marketplace_item_type", ["agent", "squad"]);
export const marketplaceCategoryEnum = pgEnum("marketplace_category", [
  "marketing", "development", "support", "sales", "content", "analytics", "design", "general",
]);

export const marketplaceItems = pgTable("marketplace_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: marketplaceItemTypeEnum("type").notNull(),
  category: marketplaceCategoryEnum("category").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 10 }).notNull(),
  agentConfig: jsonb("agent_config"),
  squadConfig: jsonb("squad_config"),
  author: varchar("author", { length: 100 }).notNull().default("OrbitMind"),
  version: varchar("version", { length: 20 }).notNull().default("1.0.0"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  installs: integer("installs").notNull().default(0),
  rating: integer("rating"),
  price: integer("price").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marketplaceAcquisitions = pgTable("marketplace_acquisitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").notNull().references(() => marketplaceItems.id),
  squadId: uuid("squad_id").references(() => squads.id),
  createdSquadId: uuid("created_squad_id").references(() => squads.id),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
});

// ──────────────────────────────────────────────
// Schedules
// ──────────────────────────────────────────────

export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  squadId: uuid("squad_id").notNull().references(() => squads.id, { onDelete: "cascade" }),
  cronExpression: varchar("cron_expression", { length: 50 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).notNull().default("America/Sao_Paulo"),
  isActive: boolean("is_active").notNull().default(true),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  autonomy: varchar("autonomy", { length: 20 }).notNull().default("autonomous"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("schedules_org_id_idx").on(table.orgId),
  index("schedules_squad_id_idx").on(table.squadId),
]);

// ──────────────────────────────────────────────
// API Tokens
// ──────────────────────────────────────────────

export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  prefix: varchar("prefix", { length: 10 }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("api_tokens_org_id_idx").on(table.orgId),
]);

// ──────────────────────────────────────────────
// Content Analytics
// ──────────────────────────────────────────────

export const contentAnalytics = pgTable("content_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  squadId: uuid("squad_id").notNull().references(() => squads.id),
  runId: varchar("run_id", { length: 30 }),
  platform: varchar("platform", { length: 20 }).notNull(),
  postId: varchar("post_id", { length: 100 }),
  postUrl: text("post_url"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  saves: integer("saves").default(0),
  views: integer("views").default(0),
  reach: integer("reach").default(0),
  contentType: varchar("content_type", { length: 20 }),
  tone: varchar("tone", { length: 30 }),
  angle: varchar("angle", { length: 50 }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("content_analytics_org_id_idx").on(table.orgId),
  index("content_analytics_squad_id_idx").on(table.squadId),
]);

// ──────────────────────────────────────────────
// Pipeline Logs
// ──────────────────────────────────────────────

export const pipelineLogs = pgTable("pipeline_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  squadId: uuid("squad_id").notNull().references(() => squads.id, { onDelete: "cascade" }),
  runId: varchar("run_id", { length: 30 }).notNull(),
  level: varchar("level", { length: 10 }).notNull(),
  event: varchar("event", { length: 100 }).notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("pipeline_logs_squad_id_idx").on(table.squadId),
  index("pipeline_logs_run_id_idx").on(table.runId),
]);

// ──────────────────────────────────────────────
// Relations
// ──────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  squads: many(squads),
  integrations: many(orgIntegrations),
  auditLogs: many(auditLogs),
  llmProviders: many(llmProviders),
  orgSkills: many(orgSkills),
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

export const llmProvidersRelations = relations(llmProviders, ({ one }) => ({
  organization: one(organizations, { fields: [llmProviders.orgId], references: [organizations.id] }),
}));

export const orgSkillsRelations = relations(orgSkills, ({ one }) => ({
  organization: one(organizations, { fields: [orgSkills.orgId], references: [organizations.id] }),
}));

export const squadMemoriesRelations = relations(squadMemories, ({ one }) => ({
  squad: one(squads, { fields: [squadMemories.squadId], references: [squads.id] }),
}));
