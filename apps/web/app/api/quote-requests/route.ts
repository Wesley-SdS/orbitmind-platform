import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@orbitmind/shared";
import { createQuoteRequest } from "@/lib/db/queries";

// Rota pública (landing). Proteção básica: honeypot + limite por IP em memória.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const recentByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (recentByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    recentByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentByIp.set(ip, recent);
  return false;
}

function hasHoneypot(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    Boolean((body as { website?: unknown }).website)
  );
}

export async function POST(req: Request): Promise<Response> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Muitas solicitacoes. Tente novamente em alguns minutos." },
        { status: 429 },
      );
    }

    const body: unknown = await req.json();

    // Bots preenchem o campo oculto "website"; respondemos sucesso sem salvar.
    if (hasHoneypot(body)) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const parsed = quoteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados invalidos.", fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const created = await createQuoteRequest(parsed.data);
    return NextResponse.json({ ok: true, id: created?.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
