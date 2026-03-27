import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAgentsByOrgId } from "@/lib/db/queries";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const agents = await getAgentsByOrgId(session.user.orgId);
    return NextResponse.json(agents);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
