import type { SquadState, AgentState, Handoff, SquadRunStatus, AgentExecutionStatus } from "@orbitmind/shared";
import { calculateDeskPosition, HANDOFF_DELAY_MS } from "@orbitmind/shared";

export class StateMachine {
  private state: SquadState;

  constructor(squadCode: string, agents: Array<{ id: string; name: string; icon: string }>, totalSteps: number) {
    this.state = {
      squad: squadCode,
      executionId: crypto.randomUUID(),
      status: "idle",
      step: { current: 0, total: totalSteps, label: "" },
      agents: agents.map((agent, index) => ({
        id: agent.id,
        name: agent.name,
        icon: agent.icon,
        status: "idle" as AgentExecutionStatus,
        deliverTo: null,
        desk: calculateDeskPosition(index),
      })),
      handoff: null,
      startedAt: null,
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };
  }

  getState(): SquadState {
    return structuredClone(this.state);
  }

  start(): SquadState {
    this.state.status = "running";
    this.state.startedAt = new Date().toISOString();
    this.state.updatedAt = new Date().toISOString();
    return this.getState();
  }

  startStep(stepIndex: number, stepLabel: string, agentId: string): SquadState {
    this.state.step.current = stepIndex;
    this.state.step.label = stepLabel;
    this.updateAgentStatus(agentId, "working");
    this.state.updatedAt = new Date().toISOString();
    return this.getState();
  }

  completeStep(agentId: string): SquadState {
    this.updateAgentStatus(agentId, "done");
    this.state.updatedAt = new Date().toISOString();
    return this.getState();
  }

  startHandoff(fromAgentId: string, toAgentId: string, message: string): SquadState {
    this.updateAgentStatus(fromAgentId, "delivering");
    const fromAgent = this.state.agents.find((a) => a.id === fromAgentId);
    if (fromAgent) {
      fromAgent.deliverTo = toAgentId;
    }
    this.state.handoff = {
      from: fromAgentId,
      to: toAgentId,
      message,
      completedAt: new Date().toISOString(),
    };
    this.state.updatedAt = new Date().toISOString();
    return this.getState();
  }

  completeHandoff(fromAgentId: string, toAgentId: string): SquadState {
    this.updateAgentStatus(fromAgentId, "done");
    const fromAgent = this.state.agents.find((a) => a.id === fromAgentId);
    if (fromAgent) {
      fromAgent.deliverTo = null;
    }
    this.updateAgentStatus(toAgentId, "working");
    this.state.updatedAt = new Date().toISOString();
    return this.getState();
  }

  checkpoint(): SquadState {
    this.state.status = "checkpoint";
    this.state.updatedAt = new Date().toISOString();
    return this.getState();
  }

  resumeFromCheckpoint(): SquadState {
    this.state.status = "running";
    this.state.updatedAt = new Date().toISOString();
    return this.getState();
  }

  complete(): SquadState {
    this.state.status = "completed";
    this.state.completedAt = new Date().toISOString();
    this.state.updatedAt = new Date().toISOString();
    for (const agent of this.state.agents) {
      agent.status = "done";
      agent.deliverTo = null;
    }
    return this.getState();
  }

  fail(): SquadState {
    this.state.status = "failed";
    this.state.updatedAt = new Date().toISOString();
    return this.getState();
  }

  private updateAgentStatus(agentId: string, status: AgentExecutionStatus): void {
    const agent = this.state.agents.find((a) => a.id === agentId);
    if (agent) {
      agent.status = status;
    }
  }
}
