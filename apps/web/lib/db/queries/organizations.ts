import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

async function _uncachedGetOrganizationById(id: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return org ?? null;
}

export const getOrganizationById = cache((id: string) =>
  unstable_cache(
    () => _uncachedGetOrganizationById(id),
    ["org-by-id", id],
    { tags: [`org-${id}`], revalidate: 120 },
  )(),
);

export async function updateOrganization(
  id: string,
  data: {
    name?: string;
    slug?: string;
    logoUrl?: string | null;
    settings?: Record<string, unknown>;
    companyContext?: Record<string, unknown>;
    onboardingCompleted?: boolean;
    language?: string;
  },
) {
  const [updated] = await db
    .update(organizations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organizations.id, id))
    .returning();
  return updated ?? null;
}
