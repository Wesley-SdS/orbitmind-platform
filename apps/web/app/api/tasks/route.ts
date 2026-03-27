import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getTasksBySquadId, createTask } from "@/lib/db/queries";
import { invalidateTasks } from "@/lib/cache";

export async function GET(req: Request): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const url = new URL(req.url);
    const squadId = url.searchParams.get("squadId");
    if (!squadId) {
      return NextResponse.json({ error: "squadId obrigatorio." }, { status: 400 });
    }

    const tasks = await getTasksBySquadId(squadId, {
      status: url.searchParams.get("status") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
      assignedAgentId: url.searchParams.get("agentId") ?? undefined,
    });

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const createSchema = z.object({
  squadId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(["backlog", "ready", "in_progress", "in_review", "done", "blocked"]).default("backlog"),
  priority: z.enum(["p0", "p1", "p2", "p3"]).default("p2"),
  type: z.enum(["feature", "fix", "content", "research", "review"]).default("feature"),
  assignedAgentId: z.string().uuid().optional(),
});

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

    const task = await createTask(parsed.data);
    invalidateTasks(parsed.data.squadId, session.user.orgId);
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
