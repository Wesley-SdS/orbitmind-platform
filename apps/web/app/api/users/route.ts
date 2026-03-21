import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { getUsersByOrgId } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const members = await getUsersByOrgId(session.user.orgId);
    const safe = members.map(({ passwordHash: _, ...rest }) => rest);
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const inviteSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    if (session.user.role !== "owner" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const temporaryPassword = crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        orgId: session.user.orgId,
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      })
      .returning();

    const { passwordHash: _, ...safe } = newUser!;
    return NextResponse.json(safe, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
