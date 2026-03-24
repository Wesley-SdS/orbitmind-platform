import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";

const testSchema = z.object({
  provider: z.enum(["anthropic", "openai", "gemini"]),
  authMethod: z.enum(["oauth_token", "api_key"]),
  credential: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const { provider, authMethod, credential } = parsed.data;
    const result = await testCredential(provider, authMethod, credential);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

async function testCredential(
  provider: string,
  authMethod: string,
  credential: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (provider) {
      case "anthropic": {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey: credential });
        await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        });
        return { valid: true };
      }

      case "openai": {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey: credential });
        await client.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        });
        return { valid: true };
      }

      case "gemini": {
        const { GoogleGenAI } = await import("@google/genai");
        const genai = new GoogleGenAI({ apiKey: credential });
        await genai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: "Hi",
        });
        return { valid: true };
      }

      default:
        return { valid: false, error: "Provider nao suportado" };
    }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Credencial invalida" };
  }
}
