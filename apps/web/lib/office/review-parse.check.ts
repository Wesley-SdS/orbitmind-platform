/**
 * Verificação do parser do painel de checkpoint (rode com `npx tsx`).
 * Sai com código 1 se alguma regra falhar.
 */
import { digestReview } from "./review-parse";

let failures = 0;
function check(label: string, ok: boolean): void {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failures++;
}

const REVIEW = `Revisei o carrossel de setembro. Dois slides ficaram acima do limite de caracteres.

## Slides
Slide 1: Seu time de marketing pode trabalhar 24h?
**Slide 2** — 3 sinais de que sua agência precisa de squads
Slide 3: ${"x".repeat(214)}

## Critérios de qualidade
- [x] Tom de voz alinhado ao briefing
- [ ] Limite de 180 caracteres por slide
- ✅ CTA no último slide
- ❌ Hashtags demais

## Sugestão
Devolver para Carlos cortar o slide 3.

## Próxima seção
texto`;

const d = digestReview(REVIEW);
check("lê os 4 critérios com o resultado de cada um", d.criteria.length === 4 && d.criteria.filter((c) => c.passed).length === 2);
check("tira o limite de caracteres do critério", d.charLimit === 180);
check("lê os slides (com e sem negrito)", d.slides.length === 3 && d.slides[1]!.text.startsWith("3 sinais"));
check("marca o slide acima do limite", d.slides[2]!.overLimit && !d.slides[0]!.overLimit);
check("lê a sugestão até a próxima seção", d.suggestion === "Devolver para Carlos cortar o slide 3.");
check("resumo é o primeiro parágrafo", d.summary?.startsWith("Revisei o carrossel") === true);

const empty = digestReview("## Resultado\nTexto final aprovado pelo time, pronto para publicar no blog.");
check("sem checklist, sem slides e sem sugestão: nada é inventado", empty.criteria.length === 0 && empty.slides.length === 0 && empty.suggestion === null);
check("digest de texto vazio não quebra", digestReview(null).summary === null);

const inline = digestReview("**Sugestão:** refazer o título com a palavra-chave principal.");
check("sugestão na mesma linha do rótulo", inline.suggestion === "refazer o título com a palavra-chave principal.");

if (failures) { console.error(`${failures} verificação(ões) falharam`); process.exit(1); }
console.log("todas as verificações passaram");
