/**
 * Verificação do "devolver para ajustes" no checkpoint (rode com `npx tsx`).
 * Sem runner de testes no pacote ainda (PRD v2, FND-01): o script sai com
 * código 1 se alguma regra falhar.
 */
import { PipelineRunner, parseRevisionResponse } from "./pipeline";
import type { LlmAdapter } from "./adapters/types";

let failures = 0;
function check(label: string, ok: boolean): void {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failures++;
}

// ---- parser ----
check("revise com feedback é reconhecido", parseRevisionResponse(JSON.stringify({ action: "revise", feedback: "corte os slides 3 e 4" }))?.feedback === "corte os slides 3 e 4");
check("aprovação simples não é revise", parseRevisionResponse("continuar") === null);
check("dados do checkpoint-input não são revise", parseRevisionResponse(JSON.stringify({ observacao: "ok" })) === null);
check("revise sem feedback é ignorado", parseRevisionResponse(JSON.stringify({ action: "revise", feedback: "  " })) === null);

// ---- runner ----
const YAML = `name: Teste
steps:
  - id: step-1
    name: Pesquisa
    agent: a1
  - id: step-2
    name: Criação de conteúdo
    agent: a2
  - id: step-3
    name: Aprovação do carrossel
    type: checkpoint-approve
  - id: step-4
    name: Publicação
    agent: a3
`;

async function run(responses: string[]): Promise<{ prompts: string[]; order: string[]; status: string }> {
  const prompts: string[] = [];
  const order: string[] = [];
  const adapter: LlmAdapter = {
    async chat(messages) {
      prompts.push(messages[0]!.content);
      return { content: `saída ${prompts.length}`, tokensUsed: 10, inputTokens: 5, outputTokens: 5, costCents: 0 } as never;
    },
  };
  const queue = [...responses];
  const runner = new PipelineRunner(
    YAML,
    [{ id: "a1", name: "Ana", icon: "" }, { id: "a2", name: "Carlos", icon: "" }, { id: "a3", name: "Paula", icon: "" }],
    {
      onStateChange: () => {},
      onCheckpoint: async (step) => { order.push(step.id); return queue.shift() ?? "continuar"; },
      onStepStart: (step) => { order.push(step.id); },
      onStepComplete: () => {},
      onError: (_s, e) => { throw e; },
    },
    adapter,
  );
  const state = await runner.run();
  return { prompts, order, status: state.status };
}

(async () => {
  const revise = JSON.stringify({ action: "revise", feedback: "Corte os slides 3 e 4 para 180 caracteres." });
  const a = await run([revise, "continuar"]);
  check("devolver volta à etapa de origem e passa de novo pelo checkpoint", a.order.join(",") === "step-1,step-2,step-3,step-2,step-3,step-4");
  const redo = a.prompts.find((p, i) => i > 1 && p.includes("Criação de conteúdo"));
  check("a etapa refeita recebe o feedback no prompt", Boolean(redo?.includes("AJUSTES PEDIDOS NA APROVAÇÃO") && redo.includes("Corte os slides 3 e 4")));
  check("o feedback é usado uma vez só", a.prompts.filter((p) => p.includes("AJUSTES PEDIDOS NA APROVAÇÃO")).length === 1);
  check("o pipeline conclui depois do ajuste", a.status === "completed");

  const b = await run([JSON.stringify({ data: { observacao: "não precisa cancelar nada" } })]);
  check("observação mencionando 'cancelar' não cancela o pipeline", b.status === "completed" && b.order.includes("step-4"));

  const c = await run(["cancelar"]);
  check("rejeitar ('cancelar') encerra o pipeline", c.status !== "completed" && !c.order.includes("step-4"));

  const loops = await run(Array.from({ length: 10 }, () => revise));
  check("no máximo 5 devoluções por checkpoint (não entra em loop)", loops.order.filter((s) => s === "step-3").length === 6 && loops.status === "completed");

  if (failures) { console.error(`${failures} verificação(ões) falharam`); process.exit(1); }
  console.log("todas as verificações passaram");
})().catch((e) => { console.error(e); process.exit(1); });
