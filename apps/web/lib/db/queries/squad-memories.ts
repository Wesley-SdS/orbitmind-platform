import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { squadMemories } from "@/lib/db/schema";

export async function getSquadMemories(squadId: string, limit = 30) {
  return db
    .select()
    .from(squadMemories)
    .where(eq(squadMemories.squadId, squadId))
    .orderBy(desc(squadMemories.importance), desc(squadMemories.createdAt))
    .limit(limit);
}

export async function getTopMemories(squadId: string, limit = 10) {
  return db
    .select()
    .from(squadMemories)
    .where(eq(squadMemories.squadId, squadId))
    .orderBy(desc(squadMemories.importance))
    .limit(limit);
}

export async function addSquadMemory(data: {
  squadId: string;
  type: "preference" | "decision" | "feedback" | "pattern" | "correction";
  content: string;
  source?: string;
  importance?: number;
}) {
  const [mem] = await db.insert(squadMemories).values(data).returning();
  return mem!;
}

export async function deleteSquadMemory(memoryId: string, squadId: string) {
  await db.delete(squadMemories).where(
    and(eq(squadMemories.id, memoryId), eq(squadMemories.squadId, squadId)),
  );
}

export async function pruneSquadMemories(squadId: string, maxCount = 30) {
  const all = await db
    .select({ id: squadMemories.id })
    .from(squadMemories)
    .where(eq(squadMemories.squadId, squadId))
    .orderBy(desc(squadMemories.importance), desc(squadMemories.createdAt));

  if (all.length <= maxCount) return;

  const toDelete = all.slice(maxCount).map((m) => m.id);
  for (const id of toDelete) {
    await db.delete(squadMemories).where(eq(squadMemories.id, id));
  }
}
