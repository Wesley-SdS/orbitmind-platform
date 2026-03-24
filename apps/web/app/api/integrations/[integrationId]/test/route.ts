import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIntegrationById } from "@/lib/db/queries";
import { isIntegrationConnected } from "@/lib/integrations";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ integrationId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { integrationId } = await params;
    const integration = await getIntegrationById(integrationId);
    if (!integration) {
      return NextResponse.json({ error: "Integracao nao encontrada." }, { status: 404 });
    }

    const connected = await isIntegrationConnected(
      session.user.orgId,
      integration.integrationId,
    );

    return NextResponse.json({
      connected,
      integrationId: integration.integrationId,
      status: connected ? "ok" : "disconnected",
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : "Erro ao testar conexao",
    }, { status: 500 });
  }
}
