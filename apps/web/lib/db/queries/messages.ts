import { eq, desc, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";

export async function getMessagesBySquadId(squadId: string, cursor?: string, limit = 50) {
  const conditions = [eq(messages.squadId, squadId)];

  if (cursor) {
    conditions.push(lt(messages.createdAt, new Date(cursor)));
  }

  const rows = await db
    .select()
    .from(messages)
    .where(sql`${messages.squadId} = ${squadId}${cursor ? sql` AND ${messages.createdAt} < ${new Date(cursor)}` : sql``}`)
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.reverse();
}

export async function createMessage(data: {
  squadId: string;
  senderId?: string | null;
  agentId?: string | null;
  content: string;
  role: "user" | "agent" | "system";
  metadata?: Record<string, unknown>;
}) {
  const [message] = await db.insert(messages).values(data).returning();
  return message!;
}

export async function getMessageCount(squadId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(eq(messages.squadId, squadId));
  return result?.count ?? 0;
}

/** Get messages filtered by conversationId in metadata */
export async function getMessagesByConversationId(squadId: string, conversationId: string, limit = 50) {
  const rows = await db
    .select()
    .from(messages)
    .where(sql`${messages.squadId} = ${squadId} AND ${messages.metadata}->>'conversationId' = ${conversationId}`)
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

/** List distinct conversations from architect messages, newest first */
export async function listArchitectConversations(squadId: string, limit = 20) {
  const rows = await db
    .select({
      conversationId: sql<string>`${messages.metadata}->>'conversationId'`,
      title: sql<string>`(
        SELECT content FROM ${messages} m2
        WHERE m2.metadata->>'conversationId' = ${messages.metadata}->>'conversationId'
          AND m2.squad_id = ${squadId}
          AND m2.role = 'user'
        ORDER BY m2.created_at ASC
        LIMIT 1
      )`,
      lastMessageAt: sql<string>`max(${messages.createdAt})`,
      messageCount: sql<number>`count(*)::int`,
    })
    .from(messages)
    .where(sql`${messages.squadId} = ${squadId} AND ${messages.metadata}->>'conversationId' IS NOT NULL`)
    .groupBy(sql`${messages.metadata}->>'conversationId'`)
    .orderBy(sql`max(${messages.createdAt}) DESC`)
    .limit(limit);

  return rows.filter((r) => r.conversationId);
}

/** Delete messages of a specific conversation */
export async function deleteConversationMessages(squadId: string, conversationId: string) {
  await db.delete(messages).where(
    sql`${messages.squadId} = ${squadId} AND ${messages.metadata}->>'conversationId' = ${conversationId}`,
  );
}
