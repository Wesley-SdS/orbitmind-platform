---
execution: inline
agent: reviewer
inputFile: squads/instagram-tech-content/output/instagram-content.md
outputFile: squads/instagram-tech-content/output/review-result.md
---

# Step 08: Review de Qualidade

## Context Loading

Load these files before executing:
- `squads/instagram-tech-content/output/instagram-content.md` — Conteúdo criado pelo Caio Carrossel
- `squads/instagram-tech-content/pipeline/data/quality-criteria.md` — Critérios de avaliação detalhados
- `squads/instagram-tech-content/pipeline/data/anti-patterns.md` — Erros a verificar
- `squads/instagram-tech-content/pipeline/data/output-examples.md` — Exemplos de referência de qualidade
- `_opensquad/_memory/company.md` — Contexto da OrbitMind para validar tom de marca

## Instructions

### Process

1. **Ler o conteúdo completo** do carrossel sem fazer julgamentos iniciais. Leitura completa primeiro.
2. **Carregar critérios de qualidade** do quality-criteria.md. Estes são a fonte de verdade para scoring.
3. **Avaliar cada critério individualmente** no scale 1-10 com justificativa escrita:
   - Hook Power
   - Estrutura do Carrossel
   - Profundidade de Conteúdo
   - Copywriting e Persuasão
   - CTA e Engajamento
   - Tom de Voz e Marca
   - Compliance Técnico
4. **Identificar passagens específicas** para cada score que não é 10. Citar localização exata (slide N, parágrafo X da caption).
5. **Verificar anti-patterns**: checar cada item do anti-patterns.md contra o conteúdo. Qualquer violação deve ser flaggada como required change.
6. **Calcular score overall** como média dos critérios. Aplicar regras de decisão:
   - APPROVE se overall ≥ 7/10 E nenhum critério abaixo de 4/10
   - REJECT se overall < 7/10 OU qualquer critério abaixo de 4/10
7. **Escrever review estruturado** com veredicto, tabela de scores, feedback detalhado, required changes (se houver) e suggestions.

## Output Format

```
==============================
 REVIEW VERDICT: {APPROVE/REJECT/CONDITIONAL APPROVE}
==============================

Content: {título do carrossel}
Type: Instagram Carousel ({N} slides)
Author: Caio Carrossel
Review Date: {data}
Revision: {N} of 3

------------------------------
 SCORING TABLE
------------------------------
| Criterion              | Score  | Summary                                    |
|------------------------|--------|--------------------------------------------|
| Hook Power             | X/10   | {resumo}                                   |
| Estrutura Carrossel    | X/10   | {resumo}                                   |
| Profundidade Conteúdo  | X/10   | {resumo}                                   |
| Copywriting/Persuasão  | X/10   | {resumo}                                   |
| CTA e Engajamento      | X/10   | {resumo}                                   |
| Tom de Voz e Marca     | X/10   | {resumo}                                   |
| Compliance Técnico     | X/10   | {resumo}                                   |
------------------------------
 OVERALL: X.X/10
------------------------------

DETAILED FEEDBACK:

Strength: {ponto forte específico com citação do conteúdo}

Strength: {outro ponto forte}

Required change: {mudança obrigatória com localização exata e sugestão de fix}

Required change: {outra mudança, se houver}

Suggestion (non-blocking): {sugestão de melhoria opcional}

Suggestion (non-blocking): {outra sugestão}

{Se REJECT:}
PATH TO APPROVAL:
1. {fix específico 1}
2. {fix específico 2}
...

VERDICT: {APPROVE/REJECT} — {resumo de 1 frase}
```

## Output Example

```
==============================
 REVIEW VERDICT: CONDITIONAL APPROVE
==============================

Content: "Claude 4 mudou as regras do jogo — e quase ninguém percebeu"
Type: Instagram Carousel (10 slides)
Author: Caio Carrossel
Review Date: 2026-03-28
Revision: 1 of 3

------------------------------
 SCORING TABLE
------------------------------
| Criterion              | Score  | Summary                                         |
|------------------------|--------|-------------------------------------------------|
| Hook Power             | 9/10   | Hook forte, específico, para o scroll            |
| Estrutura Carrossel    | 8/10   | Formato Editorial bem executado, backgrounds ok  |
| Profundidade Conteúdo  | 8/10   | Dados concretos, cada slide avança narrativa     |
| Copywriting/Persuasão  | 7/10   | PAS bem executado, objection neutralizer presente|
| CTA e Engajamento      | 7/10   | CTA específico mas poderia ser mais urgente      |
| Tom de Voz e Marca     | 9/10   | Alinhado com OrbitMind, técnico e acessível      |
| Compliance Técnico     | 10/10  | Todos os constraints validados                   |
------------------------------
 OVERALL: 8.3/10
------------------------------

DETAILED FEEDBACK:

Strength: O hook "Claude 4 saiu e ninguém tá falando sobre o que realmente importa" no primeiro slide cria curiosidade imediata e usa um padrão de informação exclusiva ("ninguém tá falando") que força o swipe. Funciona dentro dos 125 caracteres visíveis.

Strength: Slide 5 ("O preço da inação é maior que o preço da adoção") ancora o argumento em dados concretos (31-38% menos bugs) e usa loss aversion efetivamente. Este é o slide mais save-worthy do carrossel.

Suggestion (non-blocking): O CTA no slide 10 usa "Comenta AGENTES que eu te mando o guia completo". Considere adicionar urgência temporal: "Comenta AGENTES nas próximas 24h que eu mando o guia exclusivo." Urgência temporal aumenta conversão em CTAs de comment keyword.

Suggestion (non-blocking): Slide 8 menciona "700+ integrações" sem citar a fonte específica. Para audiência tech que valoriza verificabilidade, considere adicionar "(via Nango)" para dar credibilidade técnica.

VERDICT: CONDITIONAL APPROVE — Conteúdo de alta qualidade com sugestões não-bloqueantes para polish final.
```

## Veto Conditions

Reject and redo if ANY of these are true:
1. Qualquer critério com score abaixo de 4/10 (hard rejection trigger)
2. Review não inclui justificativa escrita para cada score
3. Required changes não incluem localização exata e sugestão de fix

## Quality Criteria

- [ ] Todos os 7 critérios foram avaliados com score e justificativa
- [ ] Pelo menos 2 Strengths identificados (mesmo em REJECT)
- [ ] Required changes incluem localização e fix específico
- [ ] Suggestions são claramente separadas de required changes
- [ ] Veredicto é consistente com os scores (sem contradições)
- [ ] Se REJECT, PATH TO APPROVAL inclui fixes numerados e específicos
