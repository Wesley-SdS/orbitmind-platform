import type { LlmAdapter, AgentInfo } from "./types";
import { AnthropicAdapter } from "./anthropic-adapter";
import { OpenAIAdapter } from "./openai-adapter";
import { GeminiAdapter } from "./gemini-adapter";

export type LlmProviderType = "anthropic" | "openai" | "gemini";

export interface ProviderConfig {
  provider: LlmProviderType;
  authMethod: "oauth_token" | "api_key";
  credential: string;
  defaultModel: string;
}

export function createAdapter(agent: AgentInfo, config: ProviderConfig): LlmAdapter {
  const { provider, credential, defaultModel } = config;
  const modelTier = (agent.config as Record<string, unknown> | null)?.modelTier as string | undefined;
  const model = defaultModel || resolveModel(provider, modelTier || "powerful");

  switch (provider) {
    case "anthropic":
      return new AnthropicAdapter(agent, { apiKey: credential, model });
    case "openai":
      return new OpenAIAdapter(agent, credential, model);
    case "gemini":
      return new GeminiAdapter(agent, credential, model);
    default:
      throw new Error(`Provider nao suportado: ${provider}`);
  }
}

function resolveModel(provider: string, tier: string): string {
  const models: Record<string, Record<string, string>> = {
    anthropic: { powerful: "claude-sonnet-4-6", fast: "claude-haiku-4-5" },
    openai: { powerful: "gpt-5.4", fast: "gpt-5.4-mini" },
    gemini: { powerful: "gemini-2.5-pro", fast: "gemini-3-flash" },
  };
  return models[provider]?.[tier] || "claude-sonnet-4-6";
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
