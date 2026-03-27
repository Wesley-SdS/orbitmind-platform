export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
}

export interface LlmAdapter {
  chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt?: string,
  ): Promise<AdapterResult>;

  chatWithTools?(
    messages: Array<{ role: "user" | "assistant" | "tool"; content: string; toolCallId?: string }>,
    tools: ToolDefinition[],
    systemPrompt?: string,
  ): Promise<AdapterToolResult>;
}

export interface AdapterResult {
  output: string;
  tokensUsed: number;
  costCents: number;
  durationMs: number;
}

export interface AdapterToolResult extends AdapterResult {
  toolCalls: ToolCall[];
  stopReason: "end_turn" | "tool_use";
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
