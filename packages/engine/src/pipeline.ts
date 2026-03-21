import type { PipelineDefinition, PipelineStep, SquadState } from "@orbitmind/shared";
import { pipelineSchema } from "@orbitmind/shared";
import { parse as parseYaml } from "yaml";
import { StateMachine } from "./state";

export interface PipelineEvents {
  onStateChange: (state: SquadState) => void;
  onCheckpoint: (step: PipelineStep) => Promise<string>;
  onStepStart: (step: PipelineStep) => void;
  onStepComplete: (step: PipelineStep, output: string) => void;
  onError: (step: PipelineStep, error: Error) => void;
}

export class PipelineRunner {
  private pipeline: PipelineDefinition;
  private stateMachine: StateMachine;
  private events: PipelineEvents;

  constructor(
    yamlContent: string,
    agents: Array<{ id: string; name: string; icon: string }>,
    events: PipelineEvents,
  ) {
    const raw = parseYaml(yamlContent);
    this.pipeline = pipelineSchema.parse(raw);
    this.stateMachine = new StateMachine(
      this.pipeline.name,
      agents,
      this.pipeline.steps.length,
    );
    this.events = events;
  }

  async run(): Promise<SquadState> {
    this.events.onStateChange(this.stateMachine.start());

    for (let i = 0; i < this.pipeline.steps.length; i++) {
      const step = this.pipeline.steps[i];

      if (step.type === "checkpoint") {
        this.events.onStateChange(this.stateMachine.checkpoint());
        const response = await this.events.onCheckpoint(step);

        if (response.toLowerCase().includes("cancelar")) {
          return this.stateMachine.fail();
        }

        this.events.onStateChange(this.stateMachine.resumeFromCheckpoint());
        continue;
      }

      const agentId = step.agent;
      if (!agentId) continue;

      this.events.onStateChange(
        this.stateMachine.startStep(i + 1, step.id, agentId),
      );
      this.events.onStepStart(step);

      try {
        // Agent execution is delegated to the runtime adapter
        this.events.onStepComplete(step, "");
        this.events.onStateChange(this.stateMachine.completeStep(agentId));

        // Handoff to next agent if applicable
        const nextStep = this.pipeline.steps[i + 1];
        if (nextStep?.agent && nextStep.agent !== agentId) {
          this.events.onStateChange(
            this.stateMachine.startHandoff(agentId, nextStep.agent, `${step.name} completed`),
          );
          // Handoff delay handled by the UI
          this.events.onStateChange(
            this.stateMachine.completeHandoff(agentId, nextStep.agent),
          );
        }
      } catch (error) {
        this.events.onError(step, error instanceof Error ? error : new Error(String(error)));
        return this.stateMachine.fail();
      }
    }

    const finalState = this.stateMachine.complete();
    this.events.onStateChange(finalState);
    return finalState;
  }

  getState(): SquadState {
    return this.stateMachine.getState();
  }
}
