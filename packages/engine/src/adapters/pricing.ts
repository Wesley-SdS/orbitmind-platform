// Tabela centralizada de precos por modelo.
// Valores em "centavos por 1M tokens" — entrada (i) e saida (o).
// Fonte: precos de lista oficiais dos providers em maio/2026.

type ProviderId = "anthropic" | "openai" | "gemini";

interface PricePair {
  i: number;
  o: number;
}

const PRICES: Record<ProviderId, Record<string, PricePair>> = {
  anthropic: {
    "claude-opus-4-6": { i: 1500, o: 7500 },
    "claude-sonnet-4-6": { i: 300, o: 1500 },
    "claude-sonnet-4-20250514": { i: 300, o: 1500 },
    "claude-haiku-4-5": { i: 80, o: 400 },
    "claude-haiku-4-5-20251001": { i: 80, o: 400 },
  },
  openai: {
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
  },
  gemini: {
    "gemini-3.1-pro-preview": { i: 125, o: 500 },
    "gemini-3-flash": { i: 15, o: 60 },
    "gemini-3.1-flash-lite": { i: 5, o: 20 },
    "gemini-2.5-pro": { i: 125, o: 500 },
    "gemini-2.5-flash": { i: 15, o: 60 },
    "gemini-2.0-flash": { i: 10, o: 40 },
  },
};

const FALLBACK: Record<ProviderId, PricePair> = {
  anthropic: { i: 300, o: 1500 },
  openai: { i: 30, o: 120 },
  gemini: { i: 15, o: 60 },
};

export function estimateCost(
  provider: ProviderId,
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = PRICES[provider]?.[model] ?? FALLBACK[provider];
  return Math.ceil((inputTokens * price.i + outputTokens * price.o) / 1_000_000);
}
