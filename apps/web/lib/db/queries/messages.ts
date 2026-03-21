import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";

export async function getMessagesBySquadId(squadId: string, limit = 50) {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.squadId, squadId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.reverse();
}

export async function createMessage(data: {
  squadId: string;
  senderId?: string;
  agentId?: string;
  content: string;
  role: "user" | "agent" | "system";
  metadata?: Record<string, unknown>;
}) {
  const [message] = await db.insert(messages).values(data).returning();
  return message!;
}
