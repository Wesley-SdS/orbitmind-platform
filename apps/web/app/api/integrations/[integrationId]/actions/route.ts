import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getIntegrationById } from "@/lib/db/queries";
import { nangoRequest } from "@/lib/integrations";

const actionSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  endpoint: z.string().min(1),
  data: z.unknown().optional(),
  params: z.record(z.string()).optional(),
});

export async function POST(
  req: Request,
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

    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const result = await nangoRequest({
      method: parsed.data.method,
      endpoint: parsed.data.endpoint,
      providerConfigKey: integration.integrationId,
      connectionId: session.user.orgId,
      data: parsed.data.data,
      params: parsed.data.params,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro na acao",
    }, { status: 500 });
  }
}
