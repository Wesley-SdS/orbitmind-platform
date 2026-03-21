import type { ModelTier, RuntimeType } from "@orbitmind/shared";
import { MODEL_TIERS } from "@orbitmind/shared";

export interface AgentContext {
  persona: string;
  instructions: string;
  skills: string[];
  input: string;
}

export interface AgentResult {
  output: string;
  tokensUsed: number;
  durationMs: number;
}

export abstract class AgentRuntime {
  abstract readonly type: RuntimeType;

  abstract execute(context: AgentContext, modelTier: ModelTier): Promise<AgentResult>;

  getModelId(modelTier: ModelTier): string {
    const tierModels = MODEL_TIERS[modelTier];
    return tierModels[this.type] ?? tierModels.custom;
  }
}
