import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuditLogs } from "@/lib/db/queries";

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const url = new URL(req.url);
    const filters = {
      squadId: url.searchParams.get("squadId") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
      actorType: url.searchParams.get("actorType") ?? undefined,
      limit: parseInt(url.searchParams.get("limit") ?? "50", 10),
      offset: parseInt(url.searchParams.get("offset") ?? "0", 10),
    };

    const logs = await getAuditLogs(session.user.orgId, filters);
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
