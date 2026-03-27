import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PipelineRunner, createAdapter } from "@orbitmind/engine";
import type { PipelineEvents, ProviderConfig } from "@orbitmind/engine";
import { getSquadWithAgents } from "@/lib/db/queries/squads";
import { getDefaultLlmProvider } from "@/lib/db/queries/llm-providers";
import { createExecution, updateExecution } from "@/lib/db/queries/executions";
import { createAuditLog } from "@/lib/db/queries/audit-logs";
import { stringify as yamlStringify } from "yaml";

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

    const adapter = createAdapter(
      { name: squad.name, role: "pipeline-executor", config: {} },
      providerConfig,
    );

    const executionMap = new Map<string, string>();

    const events: PipelineEvents = {
      onStateChange: () => {},
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

    // Run pipeline in background
    console.log(`[Pipeline] Starting run ${runId} for squad ${squadId} with ${pipelineSteps.length} steps`);
    console.log(`[Pipeline] Agents: ${agentsList.map(a => `${a.name}(${a.id})`).join(", ")}`);
    console.log(`[Pipeline] YAML:\n${pipelineYaml}`);
    void (async () => {
      try {
        await runner.run();
        await createAuditLog({
          orgId,
          squadId,
          action: "pipeline.completed",
          actorType: "user",
          actorId: session.user.id,
          metadata: { runId },
        });
        console.log(`[Pipeline] Run ${runId} completed successfully`);
      } catch (error) {
        console.error(`[Pipeline] Run ${runId} FAILED:`, error);
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
