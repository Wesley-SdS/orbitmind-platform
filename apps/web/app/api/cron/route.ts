import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schedules } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { CronExpressionParser } from "cron-parser";
import { PipelineRunner, createAdapter, skillsToTools } from "@orbitmind/engine";
import type { PipelineEvents, ProviderConfig } from "@orbitmind/engine";
import { getSquadWithAgents } from "@/lib/db/queries/squads";
import { getDefaultLlmProvider } from "@/lib/db/queries/llm-providers";
import { createExecution, updateExecution } from "@/lib/db/queries/executions";
import { createAuditLog } from "@/lib/db/queries/audit-logs";
import { getOrganizationById } from "@/lib/db/queries/organizations";
import { createPipelineRun, updatePipelineRun, saveStepOutput, getPipelineRunByRunIdAndSquad } from "@/lib/db/queries/pipeline-runs";
import { getTopMemories } from "@/lib/db/queries/squad-memories";
import { waitForCheckpoint } from "@/lib/engine/checkpoint-manager";
import { autoSelectBestOption } from "@/lib/engine/cron-helpers";
import { extractAndSaveMemories } from "@/lib/engine/memory-extractor";
import { stringify as yamlStringify } from "yaml";
import type { ContentBrief } from "@orbitmind/shared";

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

        // Prepare agents list (must be before resolveAgent closure)
        const agentsList = squad.agents.map((a) => ({
          id: a.id,
          name: a.name,
          icon: a.icon ?? "🤖",
          config: a.config as Record<string, unknown> | null,
        }));

        // Resolve agentId kebab → UUID
        const resolveAgent = (id?: string): string | undefined => {
          if (!id) return undefined;
          if (/^[0-9a-f]{8}-/.test(id)) return id;
          const found = squad.agents.find(a => a.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-") === id);
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
            veto_conditions: (s as Record<string, unknown>).vetoConditions ?? undefined,
          })),
        });

        const providerConfig: ProviderConfig = {
          provider: llmProvider.provider,
          defaultModel: llmProvider.defaultModel || "",
        };

        const adapter = createAdapter(
          { name: squad.name, role: "pipeline-executor", config: {} },
          providerConfig,
        );

        // Create PipelineRunner with event handlers
        const executionMap = new Map<string, string>();
        const isAutonomous = schedule.autonomy === "autonomous";

        const events: PipelineEvents = {
          onStateChange: () => {},
          onCheckpoint: async (step, context) => {
            // Autonomous schedules: auto-resolve all checkpoints
            if (isAutonomous) {
              if (step.type === "checkpoint-input") {
                // Auto-fill from content brief
                const topic = contentBrief?.nicho ?? squad.name;
                const timePeriod = "última semana";
                return JSON.stringify({ topic, timePeriod, objective: `Conteúdo sobre ${topic}` });
              }
              if (step.type === "checkpoint-select") {
                // Auto-select highest scored option from previous step
                const sourceOutput = context?.sourceOutput ?? "";
                return String(autoSelectBestOption(sourceOutput));
              }
              // checkpoint-approve or generic checkpoint
              return "continuar";
            }

            // Non-autonomous: wait for human
            await updatePipelineRun(runner.runId, {
              status: "waiting_approval",
              checkpointStepId: step.id,
              currentStepIndex: pipelineSteps.findIndex((s) => `step-${s.step}` === step.id),
              pausedAt: new Date(),
            });
            try {
              const { wsManager } = await import("@/lib/realtime/ws-manager");
              wsManager.broadcastToSquad(schedule.squadId, {
                type: "CHECKPOINT_REACHED",
                runId: runner.runId,
                stepId: step.id,
              });
            } catch {}
            return waitForCheckpoint(runner.runId, step.id);
          },
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
            const metrics = runner.getStepMetrics(step.id);
            const execId = executionMap.get(step.id);
            if (execId) {
              await updateExecution(execId, {
                status: "completed",
                outputData: { content: output.substring(0, 10000) },
                tokensUsed: metrics?.tokensUsed ?? 0,
                estimatedCost: metrics?.costCents ?? 0,
                durationMs: metrics?.durationMs ?? 0,
                completedAt: new Date(),
              });
            }
            const agent = squad.agents.find((a) => a.id === step.agent);
            await saveStepOutput(runner.runId, step.id, {
              agentName: agent?.name ?? "Agente",
              agentIcon: agent?.icon ?? "🤖",
              content: output,
              completedAt: new Date().toISOString(),
            });
            await updatePipelineRun(runner.runId, {
              currentStepIndex: pipelineSteps.findIndex((s) => `step-${s.step}` === step.id) + 1,
            });
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

        // Resolve squad skills into tool definitions
        const squadSkills = (config?.skills as string[]) ?? [];
        const tools = skillsToTools(squadSkills);
        const skillConfigs: Record<string, Record<string, string>> = {};

        // Load memories and build enriched context
        const memories = await getTopMemories(schedule.squadId, 10);
        const memoryStrings = memories.map(m => `[${m.type}] ${m.content}`);
        const contentBrief = config?.contentBrief as ContentBrief | undefined;
        const domainKnowledge = config?.domainKnowledge as { researchBrief: string; domainFramework: string; qualityCriteria: string; outputExamples: string; antiPatterns: string } | undefined;

        // Build company context string
        const org = await getOrganizationById(schedule.orgId);
        const companyCtx = org?.companyContext as Record<string, unknown> | null;
        let companyContextStr = `Squad: ${squad.name}. ${squad.description ?? ""}`;
        if (companyCtx?.name) {
          companyContextStr += `\nEmpresa: ${companyCtx.name}. Setor: ${companyCtx.sector}. Público: ${companyCtx.audience}. Tom: ${companyCtx.tone}.`;
          if (companyCtx.competitors) companyContextStr += `\nReferências: ${companyCtx.competitors}`;
        }

        const runner = new PipelineRunner(pipelineYaml, agentsList, events, adapter, undefined, tools, skillConfigs, contentBrief, memoryStrings, companyContextStr, domainKnowledge);

        // Set tone from content brief
        if (contentBrief?.tonePreferences?.[0]) {
          runner.setSelectedTone(contentBrief.tonePreferences[0]);
        }
        const runId = runner.runId;

        // Persist pipeline run record
        await createPipelineRun({
          squadId: schedule.squadId,
          orgId: schedule.orgId,
          runId,
          totalSteps: pipelineSteps.length,
          pipelineConfig: pipelineSteps,
        });

        // Dispatch pipeline async (don't block the cron response)
        void (async () => {
          try {
            await runner.run();
            await updatePipelineRun(runId, { status: "completed", completedAt: new Date() });

            // Extract and save memories from completed run
            const completedRun = await getPipelineRunByRunIdAndSquad(runId, schedule.squadId);
            if (completedRun?.stepOutputs) {
              await extractAndSaveMemories(
                schedule.squadId,
                completedRun.stepOutputs as Record<string, { agentName: string; agentIcon: string; content: string; completedAt: string }>,
                runId,
              );
            }

            await createAuditLog({
              orgId: schedule.orgId,
              squadId: schedule.squadId,
              action: "pipeline.completed",
              actorType: "system",
              actorId: "cron-scheduler",
              metadata: { runId, scheduleId: schedule.id },
            });
          } catch (error) {
            await updatePipelineRun(runId, { status: "failed", completedAt: new Date() });
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
