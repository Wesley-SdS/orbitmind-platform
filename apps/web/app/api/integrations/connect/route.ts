import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createConnectSession } from "@/lib/integrations";

export async function POST(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { sessionToken } = await createConnectSession(session.user.orgId);
    return NextResponse.json({ sessionToken });
  } catch (error) {
    console.error("Nango connect session error:", error);
    return NextResponse.json({ error: "Erro ao criar sessao Nango." }, { status: 500 });
  }
}
