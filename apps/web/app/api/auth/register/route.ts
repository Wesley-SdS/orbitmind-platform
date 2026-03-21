import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";

const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos." },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Email ja cadastrado." },
        { status: 409 },
      );
    }

    const slug = email.split("@")[0]!.replace(/[^a-z0-9-]/g, "-").slice(0, 50);
    const passwordHash = await bcrypt.hash(password, 12);

    const [org] = await db
      .insert(organizations)
      .values({
        name: "Minha Organizacao",
        slug: `${slug}-${Date.now().toString(36)}`,
        plan: "free",
      })
      .returning();

    await db.insert(users).values({
      orgId: org!.id,
      name,
      email,
      passwordHash,
      role: "owner",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
