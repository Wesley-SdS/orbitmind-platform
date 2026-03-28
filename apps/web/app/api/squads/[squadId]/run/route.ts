import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PipelineRunner, createAdapter, skillsToTools } from "@orbitmind/engine";
import type { PipelineEvents, ProviderConfig } from "@orbitmind/engine";
import { getSquadWithAgents } from "@/lib/db/queries/squads";
import { getDefaultLlmProvider } from "@/lib/db/queries/llm-providers";
import { createExecution, updateExecution } from "@/lib/db/queries/executions";
import { createAuditLog } from "@/lib/db/queries/audit-logs";
import { getOrganizationById } from "@/lib/db/queries/organizations";
import { createPipelineRun, updatePipelineRun, saveStepOutput, getPipelineRunByRunIdAndSquad } from "@/lib/db/queries/pipeline-runs";
import { extractAndSaveMemories } from "@/lib/engine/memory-extractor";
import { getTopMemories } from "@/lib/db/queries/squad-memories";
import { waitForCheckpoint } from "@/lib/engine/checkpoint-manager";
import { stringify as yamlStringify } from "yaml";
import type { ContentBrief } from "@orbitmind/shared";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ squadId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { squadId } = await params;
    const orgId = session.user.orgId;

    const squad = await getSquadWithAgents(squadId);
    if (!squad || squad.orgId !== orgId) {
      return NextResponse.json({ error: "Squad nao encontrado." }, { status: 404 });
    }

    const config = squad.config as Record<string, unknown> | null;
    const pipelineSteps = config?.pipeline as Array<{ step: number; name: string; type: string; agentId?: string }> | undefined;

    if (!pipelineSteps?.length) {
      return NextResponse.json({ error: "Squad nao tem pipeline configurado." }, { status: 400 });
    }

    const llmProvider = await getDefaultLlmProvider(orgId);
    if (!llmProvider) {
      return NextResponse.json({ error: "Nenhum provedor de IA configurado." }, { status: 400 });
    }

    const agentsList = squad.agents.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon ?? "🤖",
    }));

    // Resolve agentId: might be UUID or kebab-case from old designs
    const resolveAgentId = (id?: string): string | undefined => {
      if (!id) return undefined;
      if (/^[0-9a-f]{8}-/.test(id)) return id;
      const found = squad.agents.find(a =>
        a.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-") === id || a.id === id
      );
      return found?.id ?? agentsList[0]?.id;
    };

    const pipelineYaml = yamlStringify({
      name: squad.name,
      steps: pipelineSteps.map((s) => ({
        id: `step-${s.step}`,
        name: s.name,
        type: s.type,
        agent: resolveAgentId(s.agentId),
      })),
    });

    const providerConfig: ProviderConfig = {
      provider: llmProvider.provider,
      authMethod: llmProvider.authMethod,
      credential: llmProvider.credential,
      defaultModel: llmProvider.defaultModel || "",
    };

    // Build company context for the adapter
    const org = await getOrganizationById(orgId);
    const companyCtx = org?.companyContext as Record<string, unknown> | null;
    let systemContext = `Squad: ${squad.name}. ${squad.description ?? ""}`;
    if (companyCtx?.name) {
      systemContext += `\nEmpresa: ${companyCtx.name} (${companyCtx.sector}). Publico: ${companyCtx.audience}. Tom: ${companyCtx.tone}.`;
    }

    const adapter = createAdapter(
      { name: squad.name, role: "pipeline-executor", config: { custom: systemContext } },
      providerConfig,
    );

    const executionMap = new Map<string, string>();

    const events: PipelineEvents = {
      onStateChange: () => {},
      onCheckpoint: async (step, _context) => {
        console.log(`[Checkpoint] Step ${step.id} reached. RunId: ${runner.runId}. Waiting for approval...`);
        await updatePipelineRun(runner.runId, {
          status: "waiting_approval",
          checkpointStepId: step.id,
          currentStepIndex: pipelineSteps.findIndex((s) => `step-${s.step}` === step.id),
          pausedAt: new Date(),
        });
        // Notify connected clients via WebSocket
        try {
          const { wsManager } = await import("@/lib/realtime/ws-manager");
          wsManager.broadcastToSquad(squadId, {
            type: "CHECKPOINT_REACHED",
            runId: runner.runId,
            stepId: step.id,
          });
        } catch {
          // WebSocket may not be available
        }
        // Block execution until human approves or rejects
        const response = await waitForCheckpoint(runner.runId, step.id);
        console.log(`[Checkpoint] Step ${step.id} resolved with: "${response}"`);
        return response;
      },
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
        console.error(`[Pipeline] Step ${step.id} (${step.name}) FAILED:`, error.message);
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
    const memories = await getTopMemories(squadId, 10);
    const memoryStrings = memories.map(m => `[${m.type}] ${m.content}`);
    const contentBrief = config?.contentBrief as ContentBrief | undefined;

    // Build company context string
    let companyContextStr = `Squad: ${squad.name}. ${squad.description ?? ""}`;
    if (companyCtx?.name) {
      companyContextStr += `\nEmpresa: ${companyCtx.name}. Setor: ${companyCtx.sector}. Público: ${companyCtx.audience}. Tom: ${companyCtx.tone}.`;
      if (companyCtx.competitors) companyContextStr += `\nReferências: ${companyCtx.competitors}`;
    }

    const runner = new PipelineRunner(pipelineYaml, agentsList, events, adapter, undefined, tools, skillConfigs, contentBrief, memoryStrings, companyContextStr);

    // Set tone from content brief
    if (contentBrief?.tonePreferences?.[0]) {
      runner.setSelectedTone(contentBrief.tonePreferences[0]);
    }
    const runId = runner.runId;

    // Persist pipeline run record
    await createPipelineRun({
      squadId,
      orgId,
      runId,
      totalSteps: pipelineSteps.length,
      pipelineConfig: pipelineSteps,
    });

    // Run pipeline in background
    void (async () => {
      try {
        await runner.run();
        await updatePipelineRun(runId, { status: "completed", completedAt: new Date() });

        // Extract and save memories from completed run
        const completedRun = await getPipelineRunByRunIdAndSquad(runId, squadId);
        if (completedRun?.stepOutputs) {
          await extractAndSaveMemories(
            squadId,
            completedRun.stepOutputs as Record<string, { agentName: string; agentIcon: string; content: string; completedAt: string }>,
            runId,
          );
        }

        await createAuditLog({
          orgId,
          squadId,
          action: "pipeline.completed",
          actorType: "user",
          actorId: session.user.id,
          metadata: { runId },
        });
      } catch (error) {
        console.error(`[Pipeline] Run ${runId} FAILED:`, error);
        await updatePipelineRun(runId, { status: "failed", completedAt: new Date() });
        await createAuditLog({
          orgId,
          squadId,
          action: "pipeline.failed",
          actorType: "user",
          actorId: session.user.id,
          metadata: { runId, error: error instanceof Error ? error.message : "Unknown error" },
        });
      }
    })();

    return NextResponse.json({ runId, status: "started" });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
