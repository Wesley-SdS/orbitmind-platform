import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getSkillById } from "@orbitmind/engine";

const testSchema = z.object({
  config: z.record(z.string()),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ skillId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const { skillId } = await params;
    const body = await req.json();
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });

    const def = getSkillById(skillId);
    if (!def?.testConnection) {
      return NextResponse.json({ ok: false, detail: "Skill nao suporta teste de conexao." });
    }

    const result = await def.testConnection(parsed.data.config);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
