import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { schedules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    const { squadId } = await params;
    const rows = await db.select().from(schedules).where(eq(schedules.squadId, squadId));
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const createSchema = z.object({
  cronExpression: z.string().min(5),
  timezone: z.string().default("America/Sao_Paulo"),
  autonomy: z.enum(["interactive", "autonomous"]).default("autonomous"),
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
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });

    const [schedule] = await db.insert(schedules).values({
      orgId: session.user.orgId,
      squadId,
      ...parsed.data,
    }).returning();

    return NextResponse.json(schedule, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
