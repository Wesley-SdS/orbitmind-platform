import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schedules } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";

/**
 * POST /api/cron — Execute due schedules
 * Called by external cron job (Vercel Cron, GitHub Actions, systemd timer)
 * Protected by a simple secret header
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const secret = req.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find schedules due for execution
    const dueSchedules = await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.isActive, true),
        lte(schedules.nextRunAt, now),
      ));

    const results: Array<{ scheduleId: string; squadId: string; status: string }> = [];

    for (const schedule of dueSchedules) {
      try {
        // Mark as running
        await db.update(schedules).set({ lastRunAt: now }).where(eq(schedules.id, schedule.id));

        // TODO: Dispatch pipeline execution for schedule.squadId
        // For now, just log
        results.push({ scheduleId: schedule.id, squadId: schedule.squadId, status: "dispatched" });
      } catch {
        results.push({ scheduleId: schedule.id, squadId: schedule.squadId, status: "failed" });
      }
    }

    return NextResponse.json({ executed: results.length, results });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
