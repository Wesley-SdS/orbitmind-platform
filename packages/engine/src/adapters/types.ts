export interface LlmAdapter {
  chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string,
  ): Promise<AdapterResult>;
}

export interface AdapterResult {
  output: string;
  tokensUsed: number;
  costCents: number;
  durationMs: number;
}

export interface AgentInfo {
  name: string;
  role: string;
  config?: Record<string, unknown> | null;
}

export function buildSystemPrompt(agent: AgentInfo): string {
  const persona = agent.config?.persona ? String(agent.config.persona) : "";
  const instructions = agent.config?.instructions ? String(agent.config.instructions) : "";

  return `Voce e ${agent.name}, ${agent.role}.

${persona ? `## Persona\n${persona}` : ""}

${instructions ? `## Instrucoes\n${instructions}` : ""}

## Regras
- Responda sempre em portugues brasileiro
- Seja direto e objetivo
- Se nao souber algo, diga que vai pesquisar
- Mantenha o tom profissional mas acessivel`;
}
