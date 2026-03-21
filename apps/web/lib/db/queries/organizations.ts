import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export async function getOrganizationById(id: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return org ?? null;
}

export async function updateOrganization(
  id: string,
  data: { name?: string; slug?: string; logoUrl?: string | null; settings?: Record<string, unknown> },
) {
  const [updated] = await db
    .update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, id))
    .returning();
  return updated ?? null;
}
