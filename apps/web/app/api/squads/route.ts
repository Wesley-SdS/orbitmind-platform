import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getSquadsByOrgId, createSquad } from "@/lib/db/queries";
import { invalidateSquads } from "@/lib/cache";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const squads = await getSquadsByOrgId(session.user.orgId);
    console.log("[DEBUG /api/squads]", session.user.orgId, squads.map(s => ({ name: s.name, agentCount: s.agentCount, taskCount: s.taskCount })));
    return NextResponse.json(squads);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  icon: z.string().max(10).optional(),
  config: z.record(z.unknown()).optional(),
  templateId: z.string().max(100).optional(),
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
      return NextResponse.json({ error: "Dados invalidos.", details: parsed.error.flatten() }, { status: 400 });
    }

    const squad = await createSquad({
      ...parsed.data,
      orgId: session.user.orgId,
      createdBy: session.user.id,
    });

    invalidateSquads(session.user.orgId);

    return NextResponse.json(squad, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
