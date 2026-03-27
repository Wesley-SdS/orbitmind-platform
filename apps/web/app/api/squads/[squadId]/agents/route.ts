import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAgentsBySquadId, createAgent, updateAgent } from "@/lib/db/queries";
import { invalidateAgents } from "@/lib/cache";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId } = await params;
    const agents = await getAgentsBySquadId(squadId);
    return NextResponse.json(agents);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  role: z.string().min(1).max(500),
  icon: z.string().max(10).optional(),
  modelTier: z.enum(["powerful", "fast"]).default("powerful"),
  runtimeType: z.enum(["claude-code", "codex", "custom"]).default("claude-code"),
  monthlyBudgetTokens: z.number().int().positive().optional(),
  config: z.record(z.unknown()).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId } = await params;
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const agent = await createAgent({ ...parsed.data, squadId });
    invalidateAgents(squadId, session.user.orgId);
    return NextResponse.json(agent, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const patchSchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  role: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  modelTier: z.enum(["powerful", "fast"]).optional(),
  config: z.record(z.unknown()).optional(),
  monthlyBudgetTokens: z.number().int().positive().optional(),
});

export async function PATCH(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const { agentId, ...data } = parsed.data;
    const updated = await updateAgent(agentId, data);
    if (updated) {
      invalidateAgents(updated.squadId, session.user.orgId);
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
