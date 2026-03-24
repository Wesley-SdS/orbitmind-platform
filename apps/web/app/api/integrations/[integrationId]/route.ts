import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getIntegrationById, updateIntegration, deleteIntegration } from "@/lib/db/queries";

export async function GET(
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

    return NextResponse.json(integration);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const updateSchema = z.object({
  config: z.record(z.unknown()).optional(),
  status: z.enum(["active", "inactive", "error", "disconnected"]).optional(),
  enabledCapabilities: z.array(z.string()).optional(),
  nangoConnectionId: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ integrationId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { integrationId } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const updated = await updateIntegration(integrationId, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ integrationId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { integrationId } = await params;
    await deleteIntegration(integrationId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
