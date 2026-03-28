import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { schedules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const updateSchema = z.object({
  cronExpression: z.string().min(5).optional(),
  timezone: z.string().optional(),
  autonomy: z.enum(["interactive", "autonomous"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ squadId: string; scheduleId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    const { squadId, scheduleId } = await params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });

    const [updated] = await db
      .update(schedules)
      .set(parsed.data)
      .where(and(eq(schedules.id, scheduleId), eq(schedules.squadId, squadId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ squadId: string; scheduleId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    const { squadId, scheduleId } = await params;

    const [deleted] = await db
      .delete(schedules)
      .where(and(eq(schedules.id, scheduleId), eq(schedules.squadId, squadId)))
      .returning();

    if (!deleted) return NextResponse.json({ error: "Agendamento nao encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
