import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { llmProviders } from "@/lib/db/schema";
import { encryptCredential, decryptCredential } from "@/lib/crypto";

// List providers for org (WITHOUT credential)
export async function getLlmProvidersByOrgId(orgId: string) {
  const rows = await db
    .select({
      id: llmProviders.id,
      orgId: llmProviders.orgId,
      provider: llmProviders.provider,
      authMethod: llmProviders.authMethod,
      label: llmProviders.label,
      defaultModel: llmProviders.defaultModel,
      isActive: llmProviders.isActive,
      isDefault: llmProviders.isDefault,
      lastUsedAt: llmProviders.lastUsedAt,
      totalTokensUsed: llmProviders.totalTokensUsed,
      totalCostCents: llmProviders.totalCostCents,
      createdAt: llmProviders.createdAt,
      updatedAt: llmProviders.updatedAt,
    })
    .from(llmProviders)
    .where(eq(llmProviders.orgId, orgId))
    .orderBy(desc(llmProviders.isDefault), desc(llmProviders.createdAt));

  return rows;
}

// Get provider WITH decrypted credential (internal use only)
export async function getLlmProviderWithCredential(providerId: string, orgId: string) {
  const [provider] = await db
    .select()
    .from(llmProviders)
    .where(and(eq(llmProviders.id, providerId), eq(llmProviders.orgId, orgId)))
    .limit(1);

  if (!provider) return null;
  return {
    ...provider,
    credential: decryptCredential(provider.encryptedCredential),
  };
}

// Get DEFAULT provider for org (WITH credential)
export async function getDefaultLlmProvider(orgId: string) {
  // Try default first
  let [provider] = await db
    .select()
    .from(llmProviders)
    .where(
      and(
        eq(llmProviders.orgId, orgId),
        eq(llmProviders.isDefault, true),
        eq(llmProviders.isActive, true),
      ),
    )
    .limit(1);

  // Fallback: any active provider
  if (!provider) {
    [provider] = await db
      .select()
      .from(llmProviders)
      .where(and(eq(llmProviders.orgId, orgId), eq(llmProviders.isActive, true)))
      .limit(1);
  }

  if (!provider) return null;
  return {
    ...provider,
    credential: decryptCredential(provider.encryptedCredential),
  };
}

// Create provider
export async function createLlmProvider(data: {
  orgId: string;
  provider: "anthropic" | "openai" | "gemini";
  authMethod: "oauth_token" | "api_key";
  credential: string;
  label: string;
  defaultModel?: string;
  isDefault?: boolean;
}) {
  // If marking as default, unmark current default
  if (data.isDefault) {
    await db
      .update(llmProviders)
      .set({ isDefault: false })
      .where(and(eq(llmProviders.orgId, data.orgId), eq(llmProviders.isDefault, true)));
  }

  // Auto-default if first provider
  const existing = await db
    .select({ id: llmProviders.id })
    .from(llmProviders)
    .where(eq(llmProviders.orgId, data.orgId))
    .limit(1);
  const isDefault = data.isDefault ?? existing.length === 0;

  const [created] = await db
    .insert(llmProviders)
    .values({
      orgId: data.orgId,
      provider: data.provider,
      authMethod: data.authMethod,
      encryptedCredential: encryptCredential(data.credential),
      label: data.label,
      defaultModel: data.defaultModel || getDefaultModelForProvider(data.provider),
      isDefault,
    })
    .returning({
      id: llmProviders.id,
      provider: llmProviders.provider,
      authMethod: llmProviders.authMethod,
      label: llmProviders.label,
      defaultModel: llmProviders.defaultModel,
      isActive: llmProviders.isActive,
      isDefault: llmProviders.isDefault,
      createdAt: llmProviders.createdAt,
    });

  return created!;
}

// Update provider
export async function updateLlmProvider(
  providerId: string,
  orgId: string,
  data: {
    label?: string;
    defaultModel?: string;
    isActive?: boolean;
    isDefault?: boolean;
    credential?: string;
  },
) {
  if (data.isDefault) {
    await db
      .update(llmProviders)
      .set({ isDefault: false })
      .where(and(eq(llmProviders.orgId, orgId), eq(llmProviders.isDefault, true)));
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.label !== undefined) updateData.label = data.label;
  if (data.defaultModel !== undefined) updateData.defaultModel = data.defaultModel;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
  if (data.credential) updateData.encryptedCredential = encryptCredential(data.credential);

  const [updated] = await db
    .update(llmProviders)
    .set(updateData)
    .where(and(eq(llmProviders.id, providerId), eq(llmProviders.orgId, orgId)))
    .returning({
      id: llmProviders.id,
      provider: llmProviders.provider,
      label: llmProviders.label,
      defaultModel: llmProviders.defaultModel,
      isActive: llmProviders.isActive,
      isDefault: llmProviders.isDefault,
    });

  return updated ?? null;
}

// Delete provider
export async function deleteLlmProvider(providerId: string, orgId: string) {
  await db
    .delete(llmProviders)
    .where(and(eq(llmProviders.id, providerId), eq(llmProviders.orgId, orgId)));
}

// Record usage
export async function recordLlmUsage(providerId: string, tokensUsed: number, costCents: number) {
  await db
    .update(llmProviders)
    .set({
      totalTokensUsed: sql`${llmProviders.totalTokensUsed} + ${tokensUsed}`,
      totalCostCents: sql`${llmProviders.totalCostCents} + ${costCents}`,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(llmProviders.id, providerId));
}

function getDefaultModelForProvider(provider: string): string {
  switch (provider) {
    case "anthropic": return "claude-sonnet-4-6";
    case "openai": return "gpt-5.4-mini";
    case "gemini": return "gemini-3-flash";
    default: return "";
  }
}
