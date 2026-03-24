import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createMessage, deleteConversationMessages } from "@/lib/db/queries";
import { handleArchitectMessage, clearArchitectState } from "@/lib/engine/architect/architect-handler";
import { ARCHITECT_SQUAD_ID } from "@/lib/engine/architect/architect-agent";

const postSchema = z.object({
  content: z.string().min(1).max(10000),
  conversationId: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const orgId = session.user.orgId;
    const userId = session.user.id;
    const { content, conversationId } = parsed.data;

    // Save user message with conversationId in metadata
    const userMsg = await createMessage({
      squadId: ARCHITECT_SQUAD_ID,
      senderId: userId,
      content,
      role: "user",
      metadata: { conversationId },
    });

    try {
      const { wsManager } = await import("@/lib/realtime/ws-manager");
      wsManager.broadcastToSquad(ARCHITECT_SQUAD_ID, {
        type: "CHAT_MESSAGE",
        message: { ...userMsg, createdAt: userMsg.createdAt.toISOString() },
      });
    } catch { /* WS */ }

    // Process — pass conversationId so handler scopes history correctly
    handleArchitectMessage(orgId, userId, content, conversationId).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// DELETE — Delete a specific conversation (or create new)
const deleteSchema = z.object({
  conversationId: z.string().optional(),
});

export async function DELETE(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    // Parse body if present
    let conversationId: string | undefined;
    try {
      const body = await req.json();
      conversationId = deleteSchema.parse(body).conversationId;
    } catch { /* no body = delete current */ }

    if (conversationId) {
      await deleteConversationMessages(ARCHITECT_SQUAD_ID, conversationId);
    }

    clearArchitectState(session.user.orgId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
