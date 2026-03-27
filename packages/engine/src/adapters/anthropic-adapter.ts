import Anthropic from "@anthropic-ai/sdk";
import type { LlmAdapter, AdapterResult, AdapterToolResult, AgentInfo, ToolDefinition, ToolCall } from "./types";
import { buildSystemPrompt } from "./types";

export class AnthropicAdapter implements LlmAdapter {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private agent: AgentInfo;

  constructor(agent: AgentInfo, options: { apiKey: string; model?: string; maxTokens?: number }) {
    this.agent = agent;
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model || "claude-sonnet-4-20250514";
    this.maxTokens = options.maxTokens || 4096;
  }

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string,
  ): Promise<AdapterResult> {
    const startTime = Date.now();
    const system = systemPrompt || buildSystemPrompt(this.agent);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system,
      messages,
    });

    const output = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    const inputTokens = response.usage.input_tokens || 0;
    const outputTokens = response.usage.output_tokens || 0;

    return {
      output,
      tokensUsed: inputTokens + outputTokens,
      costCents: this.estimateCost(inputTokens, outputTokens),
      durationMs: Date.now() - startTime,
    };
  }

  async chatWithTools(
    messages: Array<{ role: "user" | "assistant" | "tool"; content: string; toolCallId?: string }>,
    tools: ToolDefinition[],
    systemPrompt?: string,
  ): Promise<AdapterToolResult> {
    const start = Date.now();
    const system = systemPrompt || buildSystemPrompt(this.agent);

    const anthropicTools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters as Anthropic.Tool.InputSchema,
    }));

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "user" as const,
          content: [
            {
              type: "tool_result" as const,
              tool_use_id: m.toolCallId!,
              content: m.content,
            },
          ],
        };
      }
      return { role: m.role as "user" | "assistant", content: m.content };
    });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system,
      messages: anthropicMessages,
      tools: anthropicTools,
    });

    let output = "";
    const toolCalls: ToolCall[] = [];
    for (const block of response.content) {
      if (block.type === "text") output += block.text;
      if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
      }
    }

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    const totalTokens = inputTokens + outputTokens;

    return {
      output,
      tokensUsed: totalTokens,
      costCents: this.estimateCost(inputTokens, outputTokens),
      durationMs: Date.now() - start,
      toolCalls,
      stopReason: response.stop_reason === "tool_use" ? "tool_use" : "end_turn",
    };
  }

  private estimateCost(inputTokens: number, outputTokens: number): number {
    const prices: Record<string, { i: number; o: number }> = {
      "claude-sonnet-4-20250514": { i: 300, o: 1500 },
      "claude-sonnet-4-6": { i: 300, o: 1500 },
      "claude-opus-4-6": { i: 1500, o: 7500 },
      "claude-haiku-4-5-20251001": { i: 80, o: 400 },
      "claude-haiku-4-5": { i: 80, o: 400 },
    };
    const p = prices[this.model] || prices["claude-sonnet-4-20250514"]!;
    return Math.ceil((inputTokens * p.i + outputTokens * p.o) / 1_000_000);
  }
}
