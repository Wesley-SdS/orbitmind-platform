import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgIntegrations, integrationWebhooks } from "@/lib/db/schema";

// ──────────────────────────────────────────────
// Org Integrations
// ──────────────────────────────────────────────

export async function getIntegrationsByOrgId(orgId: string) {
  return db.select().from(orgIntegrations).where(eq(orgIntegrations.orgId, orgId));
}

export async function getIntegrationById(integrationId: string) {
  const [integration] = await db
    .select()
    .from(orgIntegrations)
    .where(eq(orgIntegrations.id, integrationId))
    .limit(1);
  return integration ?? null;
}

export async function getIntegrationByType(orgId: string, integrationIdValue: string) {
  const [integration] = await db
    .select()
    .from(orgIntegrations)
    .where(and(eq(orgIntegrations.orgId, orgId), eq(orgIntegrations.integrationId, integrationIdValue)))
    .limit(1);
  return integration ?? null;
}

export async function createIntegration(data: {
  orgId: string;
  integrationId: string;
  nangoConnectionId?: string;
  tier?: "premium" | "generic";
  status?: "active" | "inactive" | "error" | "disconnected";
  config?: Record<string, unknown>;
  enabledCapabilities?: string[];
}) {
  const [integration] = await db.insert(orgIntegrations).values(data).returning();
  return integration!;
}

export async function updateIntegration(
  id: string,
  data: {
    config?: Record<string, unknown>;
    status?: "active" | "inactive" | "error" | "disconnected";
    enabledCapabilities?: string[];
    nangoConnectionId?: string;
    lastSyncAt?: Date;
    lastError?: string | null;
    connectedAt?: Date;
  },
) {
  const [updated] = await db
    .update(orgIntegrations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(orgIntegrations.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteIntegration(integrationId: string) {
  await db.delete(orgIntegrations).where(eq(orgIntegrations.id, integrationId));
}

export async function upsertIntegration(data: {
  orgId: string;
  integrationId: string;
  nangoConnectionId?: string;
  tier?: "premium" | "generic";
  status?: "active" | "inactive" | "error" | "disconnected";
  config?: Record<string, unknown>;
  enabledCapabilities?: string[];
  connectedAt?: Date;
}) {
  const existing = await getIntegrationByType(data.orgId, data.integrationId);
  if (existing) {
    return updateIntegration(existing.id, {
      status: data.status,
      nangoConnectionId: data.nangoConnectionId,
      config: data.config,
      enabledCapabilities: data.enabledCapabilities,
      connectedAt: data.connectedAt,
    });
  }
  return createIntegration(data);
}

// ──────────────────────────────────────────────
// Integration Webhooks (log)
// ──────────────────────────────────────────────

export async function createWebhookLog(data: {
  orgId: string;
  integrationId: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const [log] = await db.insert(integrationWebhooks).values(data).returning();
  return log!;
}

export async function markWebhookProcessed(webhookId: string) {
  await db
    .update(integrationWebhooks)
    .set({ status: "processed", processedAt: new Date() })
    .where(eq(integrationWebhooks.id, webhookId));
}
