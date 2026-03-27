import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "node:crypto";
import { PipelineRunner, createAdapter } from "@orbitmind/engine";
import type { PipelineEvents, ProviderConfig } from "@orbitmind/engine";
import { getSquadWithAgents } from "@/lib/db/queries/squads";
import { getDefaultLlmProvider } from "@/lib/db/queries/llm-providers";
import { createExecution, updateExecution } from "@/lib/db/queries/executions";
import { createAuditLog } from "@/lib/db/queries/audit-logs";
import { stringify as yamlStringify } from "yaml";

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
    runSchema.safeParse(body);

    // Fetch squad with agents and config
    const squad = await getSquadWithAgents(squadId);
    if (!squad) {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }

    const config = squad.config as Record<string, unknown> | null;
    const pipelineSteps = config?.pipeline as Array<{ step: number; name: string; type: string; agentId?: string }> | undefined;

    if (!pipelineSteps?.length) {
      return NextResponse.json({ error: "Squad has no pipeline configured" }, { status: 400 });
    }

    // Get LLM provider
    const llmProvider = await getDefaultLlmProvider(apiToken.orgId);
    if (!llmProvider) {
      return NextResponse.json({ error: "No LLM provider configured" }, { status: 400 });
    }

    // Resolve agentId: might be UUID or kebab-case from old designs
    const resolveAgent = (id?: string): string | undefined => {
      if (!id) return undefined;
      if (/^[0-9a-f]{8}-/.test(id)) return id;
      const found = squad.agents.find(a => a.name.toLowerCase().replace(/\s+/g, "-") === id);
      return found?.id ?? agentsList[0]?.id;
    };

    // Build YAML from stored pipeline config
    const pipelineYaml = yamlStringify({
      name: squad.name,
      steps: pipelineSteps.map((s) => ({
        id: `step-${s.step}`,
        name: s.name,
        type: s.type,
        agent: resolveAgent(s.agentId),
      })),
    });

    // Prepare agents and adapter
    const agentsList = squad.agents.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon ?? "🤖",
    }));

    const providerConfig: ProviderConfig = {
      provider: llmProvider.provider,
      authMethod: llmProvider.authMethod,
      credential: llmProvider.credential,
      defaultModel: llmProvider.defaultModel || "",
    };

    const adapter = createAdapter(
      { name: squad.name, role: "pipeline-executor", config: {} },
      providerConfig,
    );

    // Create PipelineRunner with event handlers that persist executions
    const executionMap = new Map<string, string>(); // stepId -> executionId

    const events: PipelineEvents = {
      onStateChange: () => { /* broadcast via WS if needed */ },
      onCheckpoint: async () => "continuar",
      onStepStart: async (step) => {
        const agentId = step.agent ?? agentsList[0]?.id ?? "";
        const execution = await createExecution({
          squadId,
          agentId,
          pipelineStep: step.id,
          status: "running",
          runId: runner.runId,
          version: 1,
        });
        executionMap.set(step.id, execution.id);
      },
      onStepComplete: async (step, output) => {
        const execId = executionMap.get(step.id);
        if (execId) {
          const version = runner.getRunContext().outputs.get(`${step.id}-v1`)?.version ?? 1;
          await updateExecution(execId, {
            status: "completed",
            outputData: { content: output.substring(0, 10000) },
            completedAt: new Date(),
          });
          // Update with final version if > 1 (re-run)
          if (version > 1) {
            await createExecution({
              squadId,
              agentId: step.agent ?? agentsList[0]?.id ?? "",
              pipelineStep: step.id,
              status: "completed",
              runId: runner.runId,
              version,
            });
          }
        }
      },
      onError: async (step, error) => {
        const execId = executionMap.get(step.id);
        if (execId) {
          await updateExecution(execId, {
            status: "failed",
            error: error.message,
            completedAt: new Date(),
          });
        }
      },
    };

    const runner = new PipelineRunner(pipelineYaml, agentsList, events, adapter);
    const runId = runner.runId;

    // Dispatch pipeline async (don't block the response)
    void (async () => {
      try {
        await runner.run();
        await createAuditLog({
          orgId: apiToken.orgId,
          squadId,
          action: "pipeline.completed",
          actorType: "system",
          actorId: "api-trigger",
          metadata: { runId },
        });
      } catch (error) {
        await createAuditLog({
          orgId: apiToken.orgId,
          squadId,
          action: "pipeline.failed",
          actorType: "system",
          actorId: "api-trigger",
          metadata: { runId, error: error instanceof Error ? error.message : "Unknown error" },
        });
      }
    })();

    return NextResponse.json({
      runId,
      squadId,
      status: "started",
      message: "Pipeline execution started",
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
