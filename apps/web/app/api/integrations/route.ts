import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getIntegrationsByOrgId, createIntegration } from "@/lib/db/queries";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const integrations = await getIntegrationsByOrgId(session.user.orgId);
    return NextResponse.json(integrations);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const createSchema = z.object({
  integrationId: z.string().min(1).max(50),
  tier: z.enum(["premium", "generic"]).optional(),
  config: z.record(z.unknown()).optional(),
  enabledCapabilities: z.array(z.string()).optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const integration = await createIntegration({
      orgId: session.user.orgId,
      ...parsed.data,
    });

    return NextResponse.json(integration, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
