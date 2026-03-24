import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMessagesBySquadId } from "@/lib/db/queries";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId } = await params;
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

    const messages = await getMessagesBySquadId(squadId, cursor, limit);
    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
