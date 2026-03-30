import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMessagesByConversationId, listArchitectConversations } from "@/lib/db/queries";
import { ARCHITECT_SQUAD_ID } from "@/lib/engine/architect/architect-agent";

// GET /api/chat/architect/history?conversationId=xxx — messages for one conversation
// GET /api/chat/architect/history?list=true — list all conversations
export async function GET(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");
    const listMode = url.searchParams.get("list");

    if (listMode === "true") {
      const conversations = await listArchitectConversations(ARCHITECT_SQUAD_ID);
      return NextResponse.json(conversations);
    }

    if (!conversationId) {
      return NextResponse.json([]);
    }

    const messages = await getMessagesByConversationId(ARCHITECT_SQUAD_ID, conversationId);
    // Filter out internal state snapshots — they should not appear in chat UI
    const visible = messages.filter(
      (m) => !(m.metadata as Record<string, unknown> | null)?.isStateSnapshot,
    );
    return NextResponse.json(visible);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
