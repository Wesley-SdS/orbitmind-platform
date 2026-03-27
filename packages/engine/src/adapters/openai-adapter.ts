import type { LlmAdapter, AdapterResult, AdapterToolResult, AgentInfo, ToolDefinition, ToolCall } from "./types";
import { buildSystemPrompt } from "./types";

export class OpenAIAdapter implements LlmAdapter {
  constructor(
    private agent: AgentInfo,
    private apiKey: string,
    private model: string = "gpt-5.4-mini",
  ) {}

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string,
  ): Promise<AdapterResult> {
    const startTime = Date.now();
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: this.apiKey });

    const system = systemPrompt || buildSystemPrompt(this.agent);

    const response = await client.chat.completions.create({
      model: this.model,
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: system },
        ...messages,
      ],
    });

    const output = response.choices[0]?.message?.content || "";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

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
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: this.apiKey });

    const openaiTools = tools.map((t) => ({
      type: "function" as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));

    const openaiMessages: Array<Record<string, unknown>> = [
      { role: "system", content: system },
      ...messages.map((m) => {
        if (m.role === "tool") {
          return { role: "tool", tool_call_id: m.toolCallId, content: m.content };
        }
        return { role: m.role, content: m.content };
      }),
    ];

    const response = await client.chat.completions.create({
      model: this.model,
      max_completion_tokens: 4096,
      messages: openaiMessages as any,
      tools: openaiTools,
    });

    const choice = response.choices[0];
    const output = choice?.message?.content ?? "";
    const toolCalls: ToolCall[] = (choice?.message?.tool_calls ?? [])
      .filter((tc): tc is Extract<typeof tc, { type: "function" }> => tc.type === "function")
      .map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));

    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;

    return {
      output,
      tokensUsed: inputTokens + outputTokens,
      costCents: this.estimateCost(inputTokens, outputTokens),
      durationMs: Date.now() - start,
      toolCalls,
      stopReason: choice?.finish_reason === "tool_calls" ? "tool_use" : "end_turn",
    };
  }

  private estimateCost(input: number, output: number): number {
    const prices: Record<string, { i: number; o: number }> = {
      "gpt-5.4": { i: 250, o: 1000 },
      "gpt-5.4-mini": { i: 30, o: 120 },
      "gpt-5.4-nano": { i: 10, o: 40 },
      "gpt-5.3": { i: 200, o: 800 },
      "o3": { i: 1000, o: 4000 },
      "o3-pro": { i: 2000, o: 8000 },
      "o4-mini": { i: 110, o: 440 },
      "gpt-4o": { i: 250, o: 1000 },
      "gpt-4o-mini": { i: 15, o: 60 },
      "gpt-4.1": { i: 200, o: 800 },
    };
    const p = prices[this.model] || prices["gpt-5.4-mini"]!;
    return Math.ceil((input * p.i + output * p.o) / 1_000_000);
  }
}
