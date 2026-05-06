import { NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { auth } from "@/lib/auth";

const testSchema = z.object({
  provider: z.enum(["anthropic", "openai", "gemini"]),
  model: z.string().min(1),
});

const PROVIDER_PREFIX: Record<string, string> = {
  anthropic: "anthropic",
  openai: "openai",
  gemini: "google",
};

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json(
        { valid: false, error: "AI_GATEWAY_API_KEY nao configurada no servidor." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const { provider, model } = parsed.data;
    const prefix = PROVIDER_PREFIX[provider];
    if (!prefix) {
      return NextResponse.json({ valid: false, error: "Provider nao suportado." }, { status: 400 });
    }

    try {
      await generateText({
        model: `${prefix}/${model}`,
        prompt: "Hi",
      });
      return NextResponse.json({ valid: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao validar via Gateway.";
      return NextResponse.json({ valid: false, error: message });
    }
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
