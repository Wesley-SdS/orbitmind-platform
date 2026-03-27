import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schedules } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { CronExpressionParser } from "cron-parser";
import { PipelineRunner, createAdapter } from "@orbitmind/engine";
import type { PipelineEvents, ProviderConfig } from "@orbitmind/engine";
import { getSquadWithAgents } from "@/lib/db/queries/squads";
import { getDefaultLlmProvider } from "@/lib/db/queries/llm-providers";
import { createExecution, updateExecution } from "@/lib/db/queries/executions";
import { createAuditLog } from "@/lib/db/queries/audit-logs";
import { stringify as yamlStringify } from "yaml";

function getNextRunAt(cronExpression: string, timezone: string): Date {
  const expr = CronExpressionParser.parse(cronExpression, {
    tz: timezone,
    currentDate: new Date(),
  });
  return expr.next().toDate();
}

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

    const results: Array<{ scheduleId: string; squadId: string; status: string; runId?: string; error?: string }> = [];

    for (const schedule of dueSchedules) {
      try {
        // Update lastRunAt and calculate nextRunAt
        const nextRunAt = getNextRunAt(schedule.cronExpression, schedule.timezone);
        await db.update(schedules).set({ lastRunAt: now, nextRunAt }).where(eq(schedules.id, schedule.id));

        // Fetch squad with agents
        const squad = await getSquadWithAgents(schedule.squadId);
        if (!squad) {
          results.push({ scheduleId: schedule.id, squadId: schedule.squadId, status: "skipped", error: "Squad not found" });
          continue;
        }

        const config = squad.config as Record<string, unknown> | null;
        const pipelineSteps = config?.pipeline as Array<{ step: number; name: string; type: string; agentId?: string }> | undefined;

        if (!pipelineSteps?.length) {
          results.push({ scheduleId: schedule.id, squadId: schedule.squadId, status: "skipped", error: "No pipeline configured" });
          continue;
        }

        // Get LLM provider
        const llmProvider = await getDefaultLlmProvider(schedule.orgId);
        if (!llmProvider) {
          results.push({ scheduleId: schedule.id, squadId: schedule.squadId, status: "skipped", error: "No LLM provider" });
          continue;
        }

        // Resolve agentId kebab → UUID
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

        // Create PipelineRunner with event handlers
        const executionMap = new Map<string, string>();

        const events: PipelineEvents = {
          onStateChange: () => {},
          onCheckpoint: async () => schedule.autonomy === "autonomous" ? "continuar" : "continuar",
          onStepStart: async (step) => {
            const agentId = step.agent ?? agentsList[0]?.id ?? "";
            const execution = await createExecution({
              squadId: schedule.squadId,
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
              await updateExecution(execId, {
                status: "completed",
                outputData: { content: output.substring(0, 10000) },
                completedAt: new Date(),
              });
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

        // Dispatch pipeline async (don't block the cron response)
        void (async () => {
          try {
            await runner.run();
            await createAuditLog({
              orgId: schedule.orgId,
              squadId: schedule.squadId,
              action: "pipeline.completed",
              actorType: "system",
              actorId: "cron-scheduler",
              metadata: { runId, scheduleId: schedule.id },
            });
          } catch (error) {
            await createAuditLog({
              orgId: schedule.orgId,
              squadId: schedule.squadId,
              action: "pipeline.failed",
              actorType: "system",
              actorId: "cron-scheduler",
              metadata: { runId, scheduleId: schedule.id, error: error instanceof Error ? error.message : "Unknown error" },
            });
          }
        })();

        results.push({ scheduleId: schedule.id, squadId: schedule.squadId, status: "dispatched", runId });
      } catch (error) {
        results.push({ scheduleId: schedule.id, squadId: schedule.squadId, status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json({ executed: results.length, results });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
