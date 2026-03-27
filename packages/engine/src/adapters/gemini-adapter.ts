import type { LlmAdapter, AdapterResult, AdapterToolResult, AgentInfo, ToolDefinition, ToolCall } from "./types";
import { buildSystemPrompt } from "./types";

export class GeminiAdapter implements LlmAdapter {
  constructor(
    private agent: AgentInfo,
    private apiKey: string,
    private model: string = "gemini-3-flash",
  ) {}

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string,
  ): Promise<AdapterResult> {
    const startTime = Date.now();
    const { GoogleGenAI } = await import("@google/genai");
    const genai = new GoogleGenAI({ apiKey: this.apiKey });

    const system = systemPrompt || buildSystemPrompt(this.agent);

    const contents = messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));

    const response = await genai.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: system,
        maxOutputTokens: 4096,
      },
    });

    const output = response.text || "";
    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;

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
    const { GoogleGenAI } = await import("@google/genai");
    const genai = new GoogleGenAI({ apiKey: this.apiKey });

    const geminiTools = [
      {
        functionDeclarations: tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
      },
    ];

    const contents = messages
      .filter((m) => m.role !== "tool")
      .map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }));

    const response = await genai.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: system,
        maxOutputTokens: 4096,
        tools: geminiTools,
      },
    });

    const output = response.text ?? "";
    const toolCalls: ToolCall[] = [];

    const candidates = response.candidates ?? [];
    for (const candidate of candidates) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.functionCall) {
          toolCalls.push({
            id: `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: part.functionCall.name!,
            arguments: (part.functionCall.args ?? {}) as Record<string, unknown>,
          });
        }
      }
    }

    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;

    return {
      output,
      tokensUsed: inputTokens + outputTokens,
      costCents: this.estimateCost(inputTokens, outputTokens),
      durationMs: Date.now() - start,
      toolCalls,
      stopReason: toolCalls.length > 0 ? "tool_use" : "end_turn",
    };
  }

  private estimateCost(input: number, output: number): number {
    const prices: Record<string, { i: number; o: number }> = {
      "gemini-3.1-pro-preview": { i: 125, o: 500 },
      "gemini-3-flash": { i: 15, o: 60 },
      "gemini-3.1-flash-lite": { i: 5, o: 20 },
      "gemini-2.5-pro": { i: 125, o: 500 },
      "gemini-2.5-flash": { i: 15, o: 60 },
      "gemini-2.0-flash": { i: 10, o: 40 },
    };
    const p = prices[this.model] || prices["gemini-3-flash"]!;
    return Math.ceil((input * p.i + output * p.o) / 1_000_000);
  }
}
