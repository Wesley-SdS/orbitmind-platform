import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getSquadWithAgents, updateSquad } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId } = await params;
    const squad = await getSquadWithAgents(squadId);
    if (!squad || squad.orgId !== session.user.orgId) {
      return NextResponse.json({ error: "Squad nao encontrado." }, { status: 404 });
    }

    return NextResponse.json(squad);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().max(10).optional(),
  config: z.record(z.unknown()).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const updated = await updateSquad(squadId, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId } = await params;
    await updateSquad(squadId, { status: "archived" });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
