import type { PipelineDefinition, PipelineStep, SquadState, AgentDefinition, AgentTask, RunContext, RunStepOutput } from "@orbitmind/shared";
import { pipelineSchema } from "@orbitmind/shared";
import { parse as parseYaml } from "yaml";
import { StateMachine } from "./state";
import type { LlmAdapter } from "./adapters/types";
import { getBestPracticeById } from "./best-practices/catalog";
import { buildToneInstructions } from "./best-practices/tone-of-voice";

export interface PipelineEvents {
  onStateChange: (state: SquadState) => void;
  onCheckpoint: (step: PipelineStep) => Promise<string>;
  onStepStart: (step: PipelineStep) => void;
  onStepComplete: (step: PipelineStep, output: string) => void;
  onError: (step: PipelineStep, error: Error) => void;
  // New events
  onTaskProgress?: (info: { agentName: string; taskIndex: number; taskTotal: number; taskName: string }) => void;
  onVetoRetry?: (info: { agentName: string; attempt: number; maxRetries: number; condition: string }) => void;
  onVetoFailed?: (info: { agentName: string; condition: string }) => void;
  onReviewRejected?: (info: { reviewerName: string; feedback: string; targetStep: string; cycle: number; maxCycles: number }) => void;
  onReviewMaxCycles?: (info: { stepName: string; cycles: number }) => void;
  onStepOutput?: (info: { stepId: string; version: number; content: string }) => void;
  // Content intelligence events
  onAngleSelection?: (angles: AngleOption[]) => Promise<number>;
  onToneSelection?: (tones: ToneOption[]) => Promise<string>;
}

export interface AngleOption {
  emoji: string;
  name: string;
  hook: string;
  description: string;
}

export interface ToneOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  example: string;
}

export class PipelineRunner {
  private pipeline: PipelineDefinition;
  private stateMachine: StateMachine;
  private events: PipelineEvents;
  private adapter?: LlmAdapter;
  private agents: Map<string, AgentDefinition & { id: string; name: string; icon: string }>;
  private reviewCycles: Map<string, number> = new Map();
  private runContext: RunContext;
  private versionTracker: Map<string, number> = new Map();
  private selectedTone: string | null = null;
  private selectedAngle: AngleOption | null = null;
  private lastResearchOutput: string = "";

  constructor(
    yamlContent: string,
    agents: Array<{ id: string; name: string; icon: string }>,
    events: PipelineEvents,
    adapter?: LlmAdapter,
    agentDefinitions?: AgentDefinition[],
  ) {
    const raw = parseYaml(yamlContent);
    this.pipeline = pipelineSchema.parse(raw);
    this.stateMachine = new StateMachine(
      this.pipeline.name,
      agents,
      this.pipeline.steps.length,
    );
    this.events = events;
    this.adapter = adapter;

    // Map agent IDs to definitions
    this.agents = new Map();
    for (const a of agents) {
      const def = agentDefinitions?.find((d) => d.id === a.id);
      this.agents.set(a.id, { ...a, custom: def?.custom ?? "", tasks: def?.tasks });
    }

    // Initialize run context
    const now = new Date();
    this.runContext = {
      runId: now.toISOString().replace(/[-:T.Z]/g, "").substring(0, 14),
      startedAt: now.toISOString(),
      outputs: new Map(),
    };
  }

  get runId(): string {
    return this.runContext.runId;
  }

  async run(): Promise<SquadState> {
    this.events.onStateChange(this.stateMachine.start());

    let i = 0;
    while (i < this.pipeline.steps.length) {
      const step = this.pipeline.steps[i]!;

      // ── Checkpoint ──
      if (step.type === "checkpoint") {
        this.events.onStateChange(this.stateMachine.checkpoint());
        const response = await this.events.onCheckpoint(step);
        if (response.toLowerCase().includes("cancelar")) {
          return this.stateMachine.fail();
        }
        this.events.onStateChange(this.stateMachine.resumeFromCheckpoint());
        i++;
        continue;
      }

      // ── Check Dependencies ──
      if (step.dependsOn?.length) {
        const allDepsComplete = step.dependsOn.every((depId) =>
          this.runContext.outputs.has(depId + "-v1") || this.runContext.outputs.has(depId + "-v" + (this.versionTracker.get(depId) ?? 1))
        );
        if (!allDepsComplete) { i++; continue; } // Skip for now, will be re-processed
      }

      // ── Parallel Execution ──
      if (step.parallelWith?.length) {
        const parallelSteps = [step, ...step.parallelWith
          .map((pid) => this.pipeline.steps.find((s) => s.id === pid))
          .filter((s): s is PipelineStep => !!s)];

        await Promise.all(parallelSteps.map((ps) => this.executeStepSafe(ps)));
        // Skip the parallel steps in the main loop
        const parallelIds = new Set(parallelSteps.map((s) => s.id));
        while (i < this.pipeline.steps.length && parallelIds.has(this.pipeline.steps[i]!.id)) i++;
        continue;
      }

      // ── Agent Step ──
      const agentId = step.agent;
      if (!agentId) { i++; continue; }

      this.events.onStateChange(this.stateMachine.startStep(i + 1, step.id, agentId));
      this.events.onStepStart(step);

      try {
        const agent = this.agents.get(agentId);
        let output: string;

        if (agent?.tasks && agent.tasks.length > 0 && this.adapter) {
          // ── Task-Based Execution ──
          output = await this.executeTaskChain(step, agent, agent.tasks);
        } else if (this.adapter) {
          // ── Monolithic Execution ──
          output = await this.executeMonolithic(step, agent);
        } else {
          output = "";
        }

        // ── Veto Conditions Check ──
        if (step.vetoConditions && step.vetoConditions.length > 0 && this.adapter) {
          const vetoResult = await this.checkVetoConditions(step.vetoConditions, output);
          if (vetoResult.triggered) {
            const retryResult = await this.retryWithVetoFeedback(
              agent!, step, output, vetoResult, step.maxVetoRetries ?? 2,
            );
            output = retryResult.output;
            if (retryResult.stillTriggered) {
              this.events.onVetoFailed?.({ agentName: agent?.name ?? agentId, condition: vetoResult.condition ?? "" });
            }
          }
        }

        // ── Save Output ──
        const version = this.getNextVersion(step.id);
        const stepOutput: RunStepOutput = {
          stepId: step.id,
          agentId,
          version,
          content: output,
          timestamp: new Date().toISOString(),
          vetoed: false,
        };
        this.runContext.outputs.set(`${step.id}-v${version}`, stepOutput);
        this.events.onStepOutput?.({ stepId: step.id, version, content: output });

        this.events.onStepComplete(step, output);
        this.events.onStateChange(this.stateMachine.completeStep(agentId));

        // ── Review Loop Check ──
        if (step.onReject && this.adapter) {
          const reviewResult = await this.handleReviewResult(step, output, i);
          if (reviewResult.action === "loop") {
            i = reviewResult.targetIndex!;
            continue; // Go back to target step
          }
        }

        // ── Handoff ──
        const nextStep = this.pipeline.steps[i + 1];
        if (nextStep?.agent && nextStep.agent !== agentId) {
          this.events.onStateChange(this.stateMachine.startHandoff(agentId, nextStep.agent, `${step.name} completed`));
          this.events.onStateChange(this.stateMachine.completeHandoff(agentId, nextStep.agent));
        }
      } catch (error) {
        this.events.onError(step, error instanceof Error ? error : new Error(String(error)));
        return this.stateMachine.fail();
      }

      i++;
    }

    const finalState = this.stateMachine.complete();
    this.events.onStateChange(finalState);
    return finalState;
  }

  // ════════════════════════════════════════════════
  // Task-Based Execution
  // ════════════════════════════════════════════════

  private async executeTaskChain(
    step: PipelineStep,
    agent: { name: string; custom: string },
    tasks: AgentTask[],
  ): Promise<string> {
    let previousOutput = "";
    const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

    for (let t = 0; t < sortedTasks.length; t++) {
      const task = sortedTasks[t]!;

      this.events.onTaskProgress?.({
        agentName: agent.name,
        taskIndex: t + 1,
        taskTotal: sortedTasks.length,
        taskName: task.name,
      });

      const prompt = this.buildTaskPrompt(agent, task, previousOutput);
      const result = await this.adapter!.chat([{ role: "user", content: prompt }]);
      let output = result.output;

      // Check task-level veto conditions
      if (task.vetoConditions.length > 0) {
        const vetoResult = await this.checkVetoConditions(task.vetoConditions, output);
        if (vetoResult.triggered) {
          const retry = await this.retryWithVetoFeedback(
            agent as AgentDefinition, task, output, vetoResult, 2,
          );
          output = retry.output;
        }
      }

      previousOutput = output;
    }

    return previousOutput;
  }

  private buildTaskPrompt(agent: { name: string; custom: string }, task: AgentTask, previousInput: string): string {
    return `## Task: ${task.name}

### Input
${previousInput || task.input}

### Processo
${task.process.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${task.outputFormat ? `### Formato do Output\n${task.outputFormat}` : ""}

### Criterios de Qualidade
${task.qualityCriteria.map((c) => `- ${c}`).join("\n")}

Produza o output seguindo o processo e criterios acima.`;
  }

  // ════════════════════════════════════════════════
  // Monolithic Execution
  // ════════════════════════════════════════════════

  private async executeMonolithic(step: PipelineStep, agent?: { name: string; custom: string }): Promise<string> {
    const context = this.buildStepContext(step, agent);
    const previousOutputs = this.buildPreviousOutputsContext(step);
    const prompt = `Voce e o agente "${agent?.name ?? step.agent ?? "Agente"}" executando o step "${step.name}" do pipeline "${this.pipeline.name}".

${previousOutputs}

## Sua tarefa
Execute o step "${step.name}". Use o contexto dos steps anteriores como base para seu trabalho. Produza um resultado concreto e detalhado — NAO peca mais informacoes, trabalhe com o que tem.

${context}`;
    const result = await this.adapter!.chat([{ role: "user", content: prompt }]);
    return result.output;
  }

  /**
   * Build context from previous step outputs so each agent sees what came before.
   */
  private buildPreviousOutputsContext(currentStep: PipelineStep): string {
    const outputs: string[] = [];
    for (const step of this.pipeline.steps) {
      if (step.id === currentStep.id) break;
      if (step.type === "checkpoint") continue;

      // Find the latest version of this step's output
      const versions = [...this.runContext.outputs.entries()]
        .filter(([key]) => key.startsWith(step.id + "-v"))
        .sort(([a], [b]) => b.localeCompare(a));

      const latest = versions[0]?.[1];
      if (latest?.content) {
        const agentInfo = this.agents.get(step.agent ?? "");
        const agentName = agentInfo?.name ?? step.agent ?? "Agente";
        outputs.push(`### ${step.name} (${agentName})\n${latest.content.substring(0, 3000)}`);
      }
    }

    if (outputs.length === 0) {
      return "## Contexto\nEste e o primeiro step do pipeline. Nao ha outputs anteriores.";
    }

    return `## Resultados dos steps anteriores\n\n${outputs.join("\n\n---\n\n")}`;
  }

  // ════════════════════════════════════════════════
  // Format Injection + Context Composition
  // ════════════════════════════════════════════════

  /**
   * Build full context for a step: Agent → Best Practices → Tone → Angle
   * Order matters: platform rules inform creative decisions.
   */
  private buildStepContext(step: PipelineStep, agent?: { name: string; custom: string }): string {
    const parts: string[] = [];

    // 1. Agent definition
    if (agent?.custom) parts.push(agent.custom);

    // 2. Format injection (platform best practices)
    if (step.format) {
      const bp = getBestPracticeById(step.format);
      if (bp) {
        parts.push(`\n--- FORMATO: ${bp.name} ---\n${bp.content}`);
      }
    }

    // 3. Tone instructions
    if (this.selectedTone) {
      parts.push(`\n--- TOM DE VOZ ---\n${buildToneInstructions(this.selectedTone)}`);
    }

    // 4. Selected angle
    if (this.selectedAngle) {
      parts.push(`\n--- ANGULO SELECIONADO ---\n${this.selectedAngle.emoji} ${this.selectedAngle.name}\nHook: ${this.selectedAngle.hook}\n${this.selectedAngle.description}`);
    }

    // 5. Previous research context
    if (this.lastResearchOutput) {
      parts.push(`\n--- CONTEXTO DA PESQUISA ---\n${this.lastResearchOutput.substring(0, 2000)}`);
    }

    return parts.join("\n\n");
  }

  // ════════════════════════════════════════════════
  // Angle Generation
  // ════════════════════════════════════════════════

  async generateAngles(researchOutput: string): Promise<AngleOption[]> {
    if (!this.adapter) return [];

    const prompt = `Com base nesta pesquisa, gere 5 ANGULOS criativos diferentes.

Cada angulo e uma perspectiva emocional/lente diferente sobre o MESMO tema:

## Pesquisa:
${researchOutput.substring(0, 3000)}

## Gere 5 angulos:
Para cada angulo, forneca:
1. Emoji + Nome do angulo
2. Hook de 1 linha que captura a essencia
3. Descricao de como o conteudo seria abordado (2-3 frases)

Tipos de angulo:
- Medo / Urgencia
- Oportunidade / FOMO
- Educacional / Tutorial
- Contrario / Polemico
- Inspiracional / Case de sucesso
- Humor / Entretenimento
- Dados / Estatisticas
- Pessoal / Storytelling

Responda com JSON:
\`\`\`json
[
  {"emoji": "🔴", "name": "Medo", "hook": "...", "description": "..."},
  {"emoji": "🟢", "name": "Oportunidade", "hook": "...", "description": "..."},
  {"emoji": "📚", "name": "Educacional", "hook": "...", "description": "..."},
  {"emoji": "↔️", "name": "Contrario", "hook": "...", "description": "..."},
  {"emoji": "⭐", "name": "Inspiracional", "hook": "...", "description": "..."}
]
\`\`\``;

    const result = await this.adapter.chat([{ role: "user", content: prompt }]);
    try {
      const match = result.output.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch { /* */ }
    return [];
  }

  setSelectedAngle(angle: AngleOption) {
    this.selectedAngle = angle;
  }

  setSelectedTone(toneId: string) {
    this.selectedTone = toneId;
  }

  setLastResearchOutput(output: string) {
    this.lastResearchOutput = output;
  }

  // ════════════════════════════════════════════════
  // Veto Conditions
  // ════════════════════════════════════════════════

  private async checkVetoConditions(
    conditions: string[],
    output: string,
  ): Promise<{ triggered: boolean; condition?: string; explanation?: string }> {
    if (!conditions.length || !this.adapter) return { triggered: false };

    const checkPrompt = `Analise o output e verifique se ALGUMA condicao de veto e verdadeira:

## Condicoes de Veto (se QUALQUER for verdadeira, rejeitar):
${conditions.map((c, i) => `${i + 1}. ${c}`).join("\n")}

## Output:
${output.substring(0, 3000)}

Responda APENAS com JSON:
{"triggered": true/false, "condition": "texto da condicao violada ou null", "explanation": "explicacao curta"}`;

    const result = await this.adapter.chat([{ role: "user", content: checkPrompt }]);
    try {
      return JSON.parse(result.output.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      return { triggered: false };
    }
  }

  private async retryWithVetoFeedback(
    agent: AgentDefinition | { name: string; custom?: string },
    taskOrStep: { vetoConditions?: string[] },
    originalOutput: string,
    vetoResult: { condition?: string; explanation?: string },
    maxRetries: number,
  ): Promise<{ output: string; stillTriggered: boolean }> {
    let lastOutput = originalOutput;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.events.onVetoRetry?.({
        agentName: agent.name,
        attempt,
        maxRetries,
        condition: vetoResult.condition ?? "",
      });

      const retryPrompt = `Seu output foi REJEITADO por violar esta condicao:

${vetoResult.condition}
${vetoResult.explanation}

## Output anterior (REJEITADO):
${lastOutput.substring(0, 2000)}

Corrija o problema e gere o output novamente.`;

      const result = await this.adapter!.chat([{ role: "user", content: retryPrompt }]);
      lastOutput = result.output;

      const recheck = await this.checkVetoConditions(taskOrStep.vetoConditions ?? [], lastOutput);
      if (!recheck.triggered) return { output: lastOutput, stillTriggered: false };
    }

    return { output: lastOutput, stillTriggered: true };
  }

  // ════════════════════════════════════════════════
  // Review Loops
  // ════════════════════════════════════════════════

  private async handleReviewResult(
    step: PipelineStep,
    reviewOutput: string,
    currentIndex: number,
  ): Promise<{ action: "continue" | "loop" | "ask_user"; targetIndex?: number; feedback?: string }> {
    const verdict = await this.parseReviewVerdict(reviewOutput);

    if (verdict.approved) return { action: "continue" };

    if (!step.onReject) return { action: "ask_user", feedback: verdict.feedback };

    const cycleKey = `${step.id}-review`;
    const cycle = (this.reviewCycles.get(cycleKey) ?? 0) + 1;
    this.reviewCycles.set(cycleKey, cycle);
    const maxCycles = step.maxReviewCycles ?? 3;

    if (cycle >= maxCycles) {
      this.events.onReviewMaxCycles?.({ stepName: step.name, cycles: cycle });
      return { action: "ask_user", feedback: verdict.feedback };
    }

    const targetIndex = this.pipeline.steps.findIndex((s) => s.id === step.onReject);
    if (targetIndex === -1) return { action: "ask_user", feedback: "Step de retorno nao encontrado" };

    this.events.onReviewRejected?.({
      reviewerName: step.name,
      feedback: verdict.feedback ?? "",
      targetStep: this.pipeline.steps[targetIndex]!.name,
      cycle,
      maxCycles,
    });

    return { action: "loop", targetIndex, feedback: verdict.feedback };
  }

  private async parseReviewVerdict(output: string): Promise<{ approved: boolean; score?: number; feedback?: string }> {
    if (!this.adapter) return { approved: true };

    const lower = output.toLowerCase();
    if (lower.includes("aprovado") || lower.includes("approved")) return { approved: true, feedback: output };
    if (lower.includes("rejeitado") || lower.includes("rejected") || lower.includes("reprovado")) return { approved: false, feedback: output };

    const parsePrompt = `Analise este review. Responda com JSON:
{"approved": true/false, "score": 0-10, "feedback": "resumo dos problemas"}

Review:
${output.substring(0, 2000)}`;

    const result = await this.adapter.chat([{ role: "user", content: parsePrompt }]);
    try {
      return JSON.parse(result.output.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    } catch {
      return { approved: false, feedback: output };
    }
  }

  // ════════════════════════════════════════════════
  // Run Folders / Versioning
  // ════════════════════════════════════════════════

  private getNextVersion(stepId: string): number {
    const current = this.versionTracker.get(stepId) ?? 0;
    const next = current + 1;
    this.versionTracker.set(stepId, next);
    return next;
  }

  getRunContext(): RunContext {
    return this.runContext;
  }

  getState(): SquadState {
    return this.stateMachine.getState();
  }

  // ════════════════════════════════════════════════
  // Error Recovery
  // ════════════════════════════════════════════════

  private async executeStepSafe(step: PipelineStep): Promise<void> {
    const agentId = step.agent;
    if (!agentId) return;

    this.events.onStateChange(this.stateMachine.startStep(
      this.pipeline.steps.indexOf(step) + 1, step.id, agentId,
    ));
    this.events.onStepStart(step);

    const tryExecute = async (): Promise<string> => {
      const agent = this.agents.get(agentId);
      if (agent?.tasks && agent.tasks.length > 0 && this.adapter) {
        return this.executeTaskChain(step, agent, agent.tasks);
      } else if (this.adapter) {
        return this.executeMonolithic(step, agent);
      }
      return "";
    };

    try {
      const output = await tryExecute();
      this.events.onStepComplete(step, output);
      this.events.onStateChange(this.stateMachine.completeStep(agentId));
    } catch (error) {
      // Retry once
      this.events.onError(step, new Error(`Retry 1: ${error instanceof Error ? error.message : "Erro"}`));
      try {
        const output = await tryExecute();
        this.events.onStepComplete(step, output);
        this.events.onStateChange(this.stateMachine.completeStep(agentId));
      } catch (retryError) {
        // Failed after retry — report to user
        this.events.onError(step, retryError instanceof Error ? retryError : new Error(String(retryError)));
        this.stateMachine.fail();
      }
    }
  }

  // ════════════════════════════════════════════════
  // Post-Completion Cleanup
  // ════════════════════════════════════════════════

  async cleanup(): Promise<void> {
    // Copy final state
    const finalState = this.stateMachine.getState();
    this.runContext.outputs.set("_final_state", {
      stepId: "_final",
      agentId: "_system",
      version: 1,
      content: JSON.stringify(finalState),
      timestamp: new Date().toISOString(),
      vetoed: false,
    });
  }
}
