import { count, desc, eq } from "drizzle-orm";
import type { QuoteRequestInput, QuoteStatus } from "@orbitmind/shared";
import { db } from "@/lib/db";
import { quoteRequests } from "@/lib/db/schema";

export async function createQuoteRequest(input: QuoteRequestInput) {
  const [created] = await db
    .insert(quoteRequests)
    .values({
      engagement: input.engagement,
      solutionTypes: input.solutionTypes,
      timeline: input.timeline,
      budget: input.budget,
      name: input.name,
      email: input.email,
      company: input.company || null,
      phone: input.phone || null,
      description: input.description,
    })
    .returning({ id: quoteRequests.id });
  return created ?? null;
}

export async function listQuoteRequests(status?: QuoteStatus) {
  return db
    .select()
    .from(quoteRequests)
    .where(status ? eq(quoteRequests.status, status) : undefined)
    .orderBy(desc(quoteRequests.createdAt))
    .limit(200);
}

export async function countQuoteRequestsByStatus() {
  return db
    .select({ status: quoteRequests.status, total: count() })
    .from(quoteRequests)
    .groupBy(quoteRequests.status);
}

export async function updateQuoteRequestStatus(id: string, status: QuoteStatus) {
  const [updated] = await db
    .update(quoteRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(quoteRequests.id, id))
    .returning({ id: quoteRequests.id, status: quoteRequests.status });
  return updated ?? null;
}
