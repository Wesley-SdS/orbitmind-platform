import type { AuditEvent, ActorType } from "@orbitmind/shared";

export interface AuditSink {
  write(event: AuditEvent): Promise<void>;
}

export class AuditLogger {
  private sink: AuditSink;
  private orgId: string;
  private squadId: string | null;

  constructor(sink: AuditSink, orgId: string, squadId?: string) {
    this.sink = sink;
    this.orgId = orgId;
    this.squadId = squadId ?? null;
  }

  async log(
    action: string,
    actorType: ActorType,
    actorId: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const event: AuditEvent = {
      action,
      actorType,
      actorId,
      metadata: {
        ...metadata,
        orgId: this.orgId,
        squadId: this.squadId,
      },
      timestamp: new Date().toISOString(),
    };

    await this.sink.write(event);
  }

  async squadCreated(userId: string, squadCode: string): Promise<void> {
    await this.log("squad.created", "user", userId, { squadCode });
  }

  async agentStarted(agentId: string, stepId: string): Promise<void> {
    await this.log("agent.started", "agent", agentId, { stepId });
  }

  async agentCompleted(agentId: string, stepId: string, tokensUsed: number): Promise<void> {
    await this.log("agent.completed", "agent", agentId, { stepId, tokensUsed });
  }

  async taskCompleted(agentId: string, taskId: string): Promise<void> {
    await this.log("task.completed", "agent", agentId, { taskId });
  }

  async budgetWarning(agentId: string, percentage: number): Promise<void> {
    await this.log("budget.warning", "system", "budget-tracker", { agentId, percentage });
  }

  async budgetExceeded(agentId: string, percentage: number): Promise<void> {
    await this.log("budget.exceeded", "system", "budget-tracker", { agentId, percentage });
  }

  async checkpointReached(stepId: string): Promise<void> {
    await this.log("pipeline.checkpoint", "system", "pipeline-runner", { stepId });
  }

  async pipelineCompleted(executionId: string, totalTokens: number): Promise<void> {
    await this.log("pipeline.completed", "system", "pipeline-runner", { executionId, totalTokens });
  }
}
