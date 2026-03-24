import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getLlmProvidersByOrgId, createLlmProvider } from "@/lib/db/queries";

const createSchema = z.object({
  provider: z.enum(["anthropic", "openai", "gemini"]),
  authMethod: z.enum(["oauth_token", "api_key"]),
  credential: z.string().min(1),
  label: z.string().min(1).max(100),
  defaultModel: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const providers = await getLlmProvidersByOrgId(session.user.orgId);
    return NextResponse.json(providers);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

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

    const created = await createLlmProvider({
      orgId: session.user.orgId,
      ...parsed.data,
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
