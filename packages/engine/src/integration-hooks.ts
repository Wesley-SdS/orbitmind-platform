import type { PipelineStep, SquadState } from "@orbitmind/shared";

/**
 * Integration Hook Manager — notifica integracoes externas
 * sobre eventos do pipeline.
 *
 * Chamado pelo PipelineRunner nos momentos-chave:
 * - onStepComplete → notifica Slack/Discord/Teams, atualiza Jira/Linear
 * - onPipelineComplete → resumo final, move tasks, salva em Notion/Drive
 * - onPipelineFailed → notifica erro urgente
 * - onCheckpointWaiting → notifica aguardando aprovacao
 */

export interface IntegrationHookConfig {
  integrationId: string;
  connectionId: string;
  capabilities: string[];
  config: Record<string, unknown>;
}

export interface IntegrationHookContext {
  squadName: string;
  runId: string;
  orgId: string;
  connectedIntegrations: IntegrationHookConfig[];
}

export type HookEvent =
  | { type: "step_complete"; step: PipelineStep; output: string }
  | { type: "pipeline_complete"; state: SquadState; runId: string }
  | { type: "pipeline_failed"; error: string; step?: PipelineStep }
  | { type: "checkpoint_waiting"; step: PipelineStep }
  | { type: "published"; platform: string; postUrl: string };

export type HookNotifier = (
  integration: IntegrationHookConfig,
  event: HookEvent,
  context: IntegrationHookContext,
) => Promise<void>;

export class IntegrationHookManager {
  private context: IntegrationHookContext;
  private notifier?: HookNotifier;

  constructor(context: IntegrationHookContext, notifier?: HookNotifier) {
    this.context = context;
    this.notifier = notifier;
  }

  async emit(event: HookEvent): Promise<void> {
    if (!this.notifier || this.context.connectedIntegrations.length === 0) return;

    const relevant = this.getRelevantIntegrations(event);
    await Promise.allSettled(
      relevant.map((integration) => this.notifier!(integration, event, this.context)),
    );
  }

  private getRelevantIntegrations(event: HookEvent): IntegrationHookConfig[] {
    return this.context.connectedIntegrations.filter((i) => {
      switch (event.type) {
        case "step_complete":
        case "pipeline_complete":
        case "pipeline_failed":
        case "checkpoint_waiting":
          // Notificar integracoes de comunicacao (slack, discord, teams, telegram)
          return ["slack", "discord", "microsoft-teams", "telegram"].includes(i.integrationId)
            && i.capabilities.some((c) => c.includes("send") || c.includes("notification"));

        case "published":
          // Notificar integracoes de analytics e comunicacao
          return i.capabilities.some((c) => c.includes("send") || c.includes("create"));

        default:
          return false;
      }
    });
  }

  /** Retorna integracoes de PM (Jira, Linear, etc.) para sync de tasks */
  getProjectManagementIntegrations(): IntegrationHookConfig[] {
    return this.context.connectedIntegrations.filter((i) =>
      ["jira", "linear", "asana", "monday", "clickup", "notion", "trello", "basecamp"].includes(i.integrationId),
    );
  }

  /** Retorna integracoes de dev (GitHub, GitLab, etc.) */
  getDevelopmentIntegrations(): IntegrationHookConfig[] {
    return this.context.connectedIntegrations.filter((i) =>
      ["github", "gitlab", "bitbucket", "azure-devops"].includes(i.integrationId),
    );
  }
}
