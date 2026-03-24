import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function getAuditLogs(
  orgId: string,
  filters?: {
    squadId?: string;
    action?: string;
    actorType?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  },
) {
  const conditions = [eq(auditLogs.orgId, orgId)];

  if (filters?.squadId) {
    conditions.push(eq(auditLogs.squadId, filters.squadId));
  }
  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters?.actorType) {
    conditions.push(eq(auditLogs.actorType, filters.actorType as "user" | "agent" | "system"));
  }
  if (filters?.from) {
    conditions.push(gte(auditLogs.createdAt, filters.from));
  }
  if (filters?.to) {
    conditions.push(lte(auditLogs.createdAt, filters.to));
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function createAuditLog(data: {
  orgId: string;
  squadId?: string;
  action: string;
  actorType: "user" | "agent" | "system";
  actorId: string;
  metadata?: Record<string, unknown>;
}) {
  const [log] = await db.insert(auditLogs).values(data).returning();
  return log!;
}

export async function getRecentActivity(orgId: string, limit = 10) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.orgId, orgId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
