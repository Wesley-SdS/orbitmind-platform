import type { BudgetConfig, BudgetSnapshot } from "@orbitmind/shared";

export interface BudgetAlert {
  type: "warning" | "exceeded";
  agentId: string;
  usedTokens: number;
  limitTokens: number;
  percentage: number;
}

export class BudgetTracker {
  private config: BudgetConfig;
  private usage: Map<string, { tokens: number; cost: number }> = new Map();

  constructor(config: BudgetConfig) {
    this.config = config;
  }

  recordUsage(agentId: string, tokens: number, costCents: number): BudgetAlert | null {
    const current = this.usage.get(agentId) ?? { tokens: 0, cost: 0 };
    current.tokens += tokens;
    current.cost += costCents;
    this.usage.set(agentId, current);

    const totalTokens = this.getTotalTokens();
    const percentage = totalTokens / this.config.monthlyTokens;

    if (percentage >= this.config.pauseThreshold) {
      return {
        type: "exceeded",
        agentId,
        usedTokens: totalTokens,
        limitTokens: this.config.monthlyTokens,
        percentage,
      };
    }

    if (percentage >= this.config.warningThreshold) {
      return {
        type: "warning",
        agentId,
        usedTokens: totalTokens,
        limitTokens: this.config.monthlyTokens,
        percentage,
      };
    }

    return null;
  }

  getTotalTokens(): number {
    let total = 0;
    for (const { tokens } of this.usage.values()) {
      total += tokens;
    }
    return total;
  }

  getSnapshot(): BudgetSnapshot {
    const perAgent: Record<string, { tokens: number; cost: number }> = {};
    let totalCost = 0;

    for (const [agentId, usage] of this.usage) {
      perAgent[agentId] = { ...usage };
      totalCost += usage.cost;
    }

    return {
      totalTokens: this.config.monthlyTokens,
      usedTokens: this.getTotalTokens(),
      estimatedCost: totalCost / 100,
      perAgent,
    };
  }

  isExceeded(): boolean {
    return this.getTotalTokens() / this.config.monthlyTokens >= this.config.pauseThreshold;
  }
}
