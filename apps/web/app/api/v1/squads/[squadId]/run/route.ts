import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "node:crypto";

const runSchema = z.object({
  autonomy: z.enum(["interactive", "autonomous"]).default("autonomous"),
  input: z.string().optional(),
});

/**
 * POST /api/v1/squads/[squadId]/run — Public API for webhook triggers
 * Authentication: Bearer token (om_xxxx)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const [apiToken] = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.tokenHash, tokenHash), eq(apiTokens.isActive, true)))
      .limit(1);

    if (!apiToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Update last used
    await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, apiToken.id));

    const { squadId } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = runSchema.safeParse(body);

    const runId = new Date().toISOString().replace(/[-:T.Z]/g, "").substring(0, 14);

    // TODO: Dispatch actual pipeline execution
    // For now, return runId
    return NextResponse.json({
      runId,
      squadId,
      status: "started",
      message: "Pipeline execution queued",
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
