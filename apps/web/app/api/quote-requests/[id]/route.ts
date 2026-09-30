import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteStatusUpdateSchema } from "@orbitmind/shared";
import { auth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { updateQuoteRequestStatus } from "@/lib/db/queries";

const idSchema = z.string().uuid();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }
    if (!isPlatformAdmin(session.user.email)) {
      return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
    }

    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
    }

    const parsed = quoteStatusUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Status invalido." }, { status: 400 });
    }

    const updated = await updateQuoteRequestStatus(id, parsed.data.status);
    if (!updated) {
      return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
