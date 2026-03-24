import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { orgSkills } from "@/lib/db/schema";
import { encryptCredential, decryptCredential } from "@/lib/crypto";

export async function getSkillsByOrgId(orgId: string) {
  return db
    .select({
      id: orgSkills.id,
      orgId: orgSkills.orgId,
      skillId: orgSkills.skillId,
      name: orgSkills.name,
      type: orgSkills.type,
      version: orgSkills.version,
      config: orgSkills.config,
      isActive: orgSkills.isActive,
      lastUsedAt: orgSkills.lastUsedAt,
      createdAt: orgSkills.createdAt,
    })
    .from(orgSkills)
    .where(eq(orgSkills.orgId, orgId));
}

export async function getSkillWithSecrets(skillDbId: string, orgId: string) {
  const [skill] = await db
    .select()
    .from(orgSkills)
    .where(and(eq(orgSkills.id, skillDbId), eq(orgSkills.orgId, orgId)))
    .limit(1);
  if (!skill) return null;

  let secrets: Record<string, string> = {};
  if (skill.encryptedSecrets) {
    try {
      secrets = JSON.parse(decryptCredential(skill.encryptedSecrets));
    } catch { /* */ }
  }
  return { ...skill, secrets };
}

export async function installSkill(data: {
  orgId: string;
  skillId: string;
  name: string;
  type: "mcp" | "script" | "api" | "prompt";
  config: Record<string, string>;
  secrets: Record<string, string>;
}) {
  const encryptedSecrets = Object.keys(data.secrets).length > 0
    ? encryptCredential(JSON.stringify(data.secrets))
    : null;

  const [skill] = await db
    .insert(orgSkills)
    .values({
      orgId: data.orgId,
      skillId: data.skillId,
      name: data.name,
      type: data.type,
      config: data.config,
      encryptedSecrets,
      isActive: true,
    })
    .returning();
  return skill!;
}

export async function updateSkill(
  skillDbId: string,
  orgId: string,
  data: {
    config?: Record<string, string>;
    secrets?: Record<string, string>;
    isActive?: boolean;
  },
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.config !== undefined) updateData.config = data.config;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.secrets) {
    updateData.encryptedSecrets = encryptCredential(JSON.stringify(data.secrets));
  }

  const [updated] = await db
    .update(orgSkills)
    .set(updateData)
    .where(and(eq(orgSkills.id, skillDbId), eq(orgSkills.orgId, orgId)))
    .returning();
  return updated ?? null;
}

export async function deleteSkill(skillDbId: string, orgId: string) {
  await db.delete(orgSkills).where(and(eq(orgSkills.id, skillDbId), eq(orgSkills.orgId, orgId)));
}
