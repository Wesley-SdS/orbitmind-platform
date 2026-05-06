import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { llmProviders } from "@/lib/db/schema";

export async function getLlmProvidersByOrgId(orgId: string) {
  const rows = await db
    .select({
      id: llmProviders.id,
      orgId: llmProviders.orgId,
      provider: llmProviders.provider,
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

export async function getDefaultLlmProvider(orgId: string) {
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

  if (!provider) {
    [provider] = await db
      .select()
      .from(llmProviders)
      .where(and(eq(llmProviders.orgId, orgId), eq(llmProviders.isActive, true)))
      .limit(1);
  }

  return provider ?? null;
}

export async function createLlmProvider(data: {
  orgId: string;
  provider: "anthropic" | "openai" | "gemini";
  label: string;
  defaultModel?: string;
  isDefault?: boolean;
}) {
  if (data.isDefault) {
    await db
      .update(llmProviders)
      .set({ isDefault: false })
      .where(and(eq(llmProviders.orgId, data.orgId), eq(llmProviders.isDefault, true)));
  }

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
      label: data.label,
      defaultModel: data.defaultModel || getDefaultModelForProvider(data.provider),
      isDefault,
    })
    .returning({
      id: llmProviders.id,
      provider: llmProviders.provider,
      label: llmProviders.label,
      defaultModel: llmProviders.defaultModel,
      isActive: llmProviders.isActive,
      isDefault: llmProviders.isDefault,
      createdAt: llmProviders.createdAt,
    });

  return created!;
}

export async function updateLlmProvider(
  providerId: string,
  orgId: string,
  data: {
    label?: string;
    defaultModel?: string;
    isActive?: boolean;
    isDefault?: boolean;
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

export async function deleteLlmProvider(providerId: string, orgId: string) {
  await db
    .delete(llmProviders)
    .where(and(eq(llmProviders.id, providerId), eq(llmProviders.orgId, orgId)));
}

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
