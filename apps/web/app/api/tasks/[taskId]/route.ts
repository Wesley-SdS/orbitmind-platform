import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getTaskById, updateTask, deleteTask } from "@/lib/db/queries";
import { syncTaskStatusToGitHub } from "@/lib/integrations/github-sync";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { taskId } = await params;
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task nao encontrada." }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["backlog", "ready", "in_progress", "in_review", "done", "blocked"]).optional(),
  priority: z.enum(["p0", "p1", "p2", "p3"]).optional(),
  type: z.enum(["feature", "fix", "content", "research", "review"]).optional(),
  assignedAgentId: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const taskBefore = await getTaskById(taskId);
    const updated = await updateTask(taskId, parsed.data);

    // Fix 7: Sync status change to GitHub (non-blocking)
    if (updated && parsed.data.status && taskBefore && parsed.data.status !== taskBefore.status) {
      syncTaskStatusToGitHub(updated, session.user.orgId).catch(console.error);
    }

    // Broadcast task update via WebSocket
    if (updated) {
      try {
        const { wsManager } = await import("@/lib/realtime/ws-manager");
        wsManager.broadcastToSquad(updated.squadId, {
          type: "TASK_UPDATED",
          taskId: updated.id,
          status: updated.status,
          assignedAgentId: updated.assignedAgentId,
        });
      } catch {
        // WS not available
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { taskId } = await params;
    await deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
