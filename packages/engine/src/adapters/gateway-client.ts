import { generateText, jsonSchema, tool, type ModelMessage } from "ai";
import type {
  LlmAdapter,
  AdapterResult,
  AdapterToolResult,
  AgentInfo,
  ToolDefinition,
  ToolCall,
} from "./types";
import { buildSystemPrompt } from "./types";
import { estimateCost } from "./pricing";

export type LlmProviderType = "anthropic" | "openai" | "gemini";

export interface ProviderConfig {
  provider: LlmProviderType;
  defaultModel: string;
}

const GATEWAY_PROVIDER_PREFIX: Record<LlmProviderType, string> = {
  anthropic: "anthropic",
  openai: "openai",
  gemini: "google",
};

function resolveModelTier(provider: LlmProviderType, tier: string): string {
  const map: Record<LlmProviderType, Record<string, string>> = {
    anthropic: { powerful: "claude-sonnet-4-6", fast: "claude-haiku-4-5" },
    openai: { powerful: "gpt-5.4", fast: "gpt-5.4-mini" },
    gemini: { powerful: "gemini-2.5-pro", fast: "gemini-3-flash" },
  };
  const fallback = map[provider].powerful!;
  return map[provider][tier] ?? fallback;
}

function buildGatewayId(provider: LlmProviderType, model: string): string {
  return `${GATEWAY_PROVIDER_PREFIX[provider]}/${model}`;
}

class GatewayAdapter implements LlmAdapter {
  constructor(
    private readonly agent: AgentInfo,
    private readonly provider: LlmProviderType,
    private readonly model: string,
  ) {}

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string,
  ): Promise<AdapterResult> {
    const startTime = Date.now();
    const system = systemPrompt || buildSystemPrompt(this.agent);

    const modelMessages: ModelMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await generateText({
      model: buildGatewayId(this.provider, this.model),
      system,
      messages: modelMessages,
    });

    const inputTokens = response.usage?.inputTokens ?? 0;
    const outputTokens = response.usage?.outputTokens ?? 0;

    return {
      output: response.text ?? "",
      tokensUsed: inputTokens + outputTokens,
      costCents: estimateCost(this.provider, this.model, inputTokens, outputTokens),
      durationMs: Date.now() - startTime,
    };
  }

  async chatWithTools(
    messages: Array<{ role: "user" | "assistant" | "tool"; content: string; toolCallId?: string }>,
    tools: ToolDefinition[],
    systemPrompt?: string,
  ): Promise<AdapterToolResult> {
    const startTime = Date.now();
    const system = systemPrompt || buildSystemPrompt(this.agent);

    const aiTools: Record<string, ReturnType<typeof tool>> = {};
    for (const t of tools) {
      aiTools[t.name] = tool({
        description: t.description,
        inputSchema: jsonSchema(t.parameters as Parameters<typeof jsonSchema>[0]),
      });
    }

    const modelMessages: ModelMessage[] = messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool" as const,
          content: [
            {
              type: "tool-result" as const,
              toolCallId: m.toolCallId ?? "",
              toolName: "",
              output: { type: "text" as const, value: m.content },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const response = await generateText({
      model: buildGatewayId(this.provider, this.model),
      system,
      messages: modelMessages,
      tools: aiTools,
    });

    const toolCalls: ToolCall[] = (response.toolCalls ?? []).map((tc) => ({
      id: tc.toolCallId,
      name: tc.toolName,
      arguments: (tc.input ?? {}) as Record<string, unknown>,
    }));

    const inputTokens = response.usage?.inputTokens ?? 0;
    const outputTokens = response.usage?.outputTokens ?? 0;

    return {
      output: response.text ?? "",
      tokensUsed: inputTokens + outputTokens,
      costCents: estimateCost(this.provider, this.model, inputTokens, outputTokens),
      durationMs: Date.now() - startTime,
      toolCalls,
      stopReason: response.finishReason === "tool-calls" ? "tool_use" : "end_turn",
    };
  }
}

export function createAdapter(agent: AgentInfo, config: ProviderConfig): LlmAdapter {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY nao configurada. Defina a variavel de ambiente para habilitar chamadas LLM.",
    );
  }

  const tier = (agent.config as Record<string, unknown> | null)?.modelTier as string | undefined;
  const model = config.defaultModel || resolveModelTier(config.provider, tier ?? "powerful");
  return new GatewayAdapter(agent, config.provider, model);
}

export const AVAILABLE_MODELS = {
  anthropic: [
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", tier: "powerful", description: "Mais inteligente — raciocinio complexo e analise profunda" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", tier: "powerful", description: "Equilibrio ideal entre inteligencia e velocidade" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", tier: "fast", description: "Ultra rapido e economico" },
  ],
  openai: [
    { id: "gpt-5.4", name: "GPT-5.4", tier: "powerful", description: "Modelo mais avancado — raciocinio complexo e coding" },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", tier: "fast", description: "Rapido e economico com alta capacidade" },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", tier: "fast", description: "Ultra rapido — classificacao e autocompletar" },
    { id: "gpt-5.3", name: "GPT-5.3 Instant", tier: "powerful", description: "Conversacional e versatil" },
    { id: "o3", name: "o3", tier: "powerful", description: "Raciocinio avancado — STEM, math e coding" },
    { id: "o3-pro", name: "o3 Pro", tier: "powerful", description: "Raciocinio maximo — pensa mais antes de responder" },
    { id: "o4-mini", name: "o4 Mini", tier: "fast", description: "Raciocinio rapido e economico" },
  ],
  gemini: [
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", tier: "powerful", description: "Mais avancado — raciocinio e agentes" },
    { id: "gemini-3-flash", name: "Gemini 3 Flash", tier: "fast", description: "Rapido com inteligencia de proxima geracao" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", tier: "fast", description: "Ultra economico para alto volume" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tier: "powerful", description: "Producao estavel — raciocinio e coding" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "fast", description: "Producao estavel — rapido e confiavel" },
  ],
} as const;
