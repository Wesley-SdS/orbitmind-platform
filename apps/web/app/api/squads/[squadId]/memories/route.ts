import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getSquadMemories, addSquadMemory, deleteSquadMemory } from "@/lib/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    const { squadId } = await params;
    const memories = await getSquadMemories(squadId);
    return NextResponse.json(memories);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const addSchema = z.object({
  type: z.enum(["preference", "decision", "feedback", "pattern", "correction"]),
  content: z.string().min(1).max(2000),
  source: z.string().max(200).optional(),
  importance: z.number().int().min(1).max(10).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    const { squadId } = await params;
    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    const memory = await addSquadMemory({ squadId, ...parsed.data });
    return NextResponse.json(memory, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    const { squadId } = await params;
    const url = new URL(req.url);
    const memoryId = url.searchParams.get("memoryId");
    if (!memoryId) return NextResponse.json({ error: "memoryId obrigatorio." }, { status: 400 });
    await deleteSquadMemory(memoryId, squadId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
