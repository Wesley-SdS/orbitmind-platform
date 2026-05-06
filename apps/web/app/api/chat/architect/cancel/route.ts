import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { clearArchitectState } from "@/lib/engine/architect/architect-handler";

const cancelSchema = z.object({
  conversationId: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    let conversationId: string | undefined;
    try {
      const body = await req.json();
      conversationId = cancelSchema.parse(body).conversationId;
    } catch { /* sem body, cancela tudo da org */ }

    clearArchitectState(session.user.orgId, conversationId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
