import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createMessage } from "@/lib/db/queries";
import { handleChatMessage } from "@/lib/engine/chat-handler";

const schema = z.object({
  squadId: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos.", details: parsed.error.flatten() }, { status: 400 });
    }

    const message = await createMessage({
      squadId: parsed.data.squadId,
      senderId: session.user.id,
      content: parsed.data.content,
      role: "user",
      metadata: {},
    });

    // Broadcast user message via WebSocket
    try {
      const { wsManager } = await import("@/lib/realtime/ws-manager");
      wsManager.broadcastToSquad(parsed.data.squadId, {
        type: "CHAT_MESSAGE",
        message: {
          ...message,
          createdAt: message.createdAt.toISOString(),
        },
      });
    } catch {
      // WS not available in standard Next.js mode
    }

    // Process agent response in background (fire and forget)
    handleChatMessage({
      squadId: parsed.data.squadId,
      orgId: session.user.orgId,
      userId: session.user.id,
      userMessage: parsed.data.content,
    }).catch(console.error);

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
