import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getOrganizationById, updateOrganization } from "@/lib/db/queries";

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const org = await getOrganizationById(session.user.orgId);
    if (!org) {
      return NextResponse.json({ error: "Organizacao nao encontrada." }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().nullable().optional(),
  settings: z.record(z.unknown()).optional(),
  onboardingCompleted: z.boolean().optional(),
  language: z.string().min(2).max(10).optional(),
});

export async function PATCH(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    if (session.user.role !== "owner" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const updated = await updateOrganization(session.user.orgId, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
