---
task: "Generate Feedback"
order: 2
input: |
  - scoring_table: Scores e justificativas da task anterior
  - overall_score: Score geral
  - hard_rejections: Critérios com hard rejection
  - instagram_content: Conteúdo original para referência
output: |
  - review_verdict: APPROVE / REJECT / CONDITIONAL APPROVE
  - detailed_feedback: Strengths, required changes, suggestions
  - path_to_approval: Lista de fixes (se REJECT)
---

# Generate Feedback

Transforma os scores da avaliação em um review estruturado completo com veredicto, feedback detalhado, e path to approval quando necessário.

## Process

1. **Determinar veredicto** baseado nos scores:
   - APPROVE: overall ≥ 7/10 E nenhum critério abaixo de 4/10
   - CONDITIONAL APPROVE: overall ≥ 7/10 E critério não-crítico entre 4-6/10
   - REJECT: overall < 7/10 OU qualquer critério abaixo de 4/10
2. **Identificar Strengths** (mínimo 2):
   - Encontrar os 2-3 elementos mais fortes do conteúdo
   - Citar passagens específicas e explicar POR QUE são fortes
   - Forte = algo que o criador deve replicar em futuros conteúdos
3. **Compilar Required Changes** (se houver):
   - Para cada score abaixo de 7/10 ou anti-pattern violado
   - Formato: localização exata → o que está errado → como corrigir → exemplo
   - Required changes são BLOQUEANTES — afetam o veredicto
4. **Compilar Suggestions** (non-blocking):
   - Para cada oportunidade de melhoria que não é grounds for rejection
   - Mesmo formato mas claramente marcadas como opcionais
5. **Se REJECT: construir Path to Approval**:
   - Lista numerada de fixes obrigatórios em ordem de prioridade
   - Cada fix é específico e completo — o criador deve poder executar sem adivinhar
   - Estimar se o fix endereçado deve levar a APPROVE na próxima revisão
6. **Montar review completo** no formato definido.
7. **Verificar o review**: confirmar que todo score tem justificativa, toda rejeição tem fix, formato é consistente.

## Output Format

```
==============================
 REVIEW VERDICT: {APPROVE/REJECT/CONDITIONAL APPROVE}
==============================

Content: {título}
Type: Instagram Carousel ({N} slides)
Author: Caio Carrossel
Review Date: {data}
Revision: {N} of 3

------------------------------
 SCORING TABLE
------------------------------
| Criterion              | Score  | Summary                    |
|------------------------|--------|----------------------------|
| Hook Power             | X/10   | {resumo}                   |
| Estrutura Carrossel    | X/10   | {resumo}                   |
| Profundidade Conteúdo  | X/10   | {resumo}                   |
| Copywriting/Persuasão  | X/10   | {resumo}                   |
| CTA e Engajamento      | X/10   | {resumo}                   |
| Tom de Voz e Marca     | X/10   | {resumo}                   |
| Compliance Técnico     | X/10   | {resumo}                   |
------------------------------
 OVERALL: X.X/10
------------------------------

DETAILED FEEDBACK:

Strength: {ponto forte específico com citação}

Strength: {outro ponto forte com citação}

Required change: {localização → problema → fix → exemplo}

Suggestion (non-blocking): {melhoria opcional}

{Se REJECT:}
PATH TO APPROVAL:
1. {fix obrigatório 1 com detalhes}
2. {fix obrigatório 2 com detalhes}

VERDICT: {veredicto} — {resumo 1 frase}
```

## Output Example

> Reference the review examples in the best-practices review.md and the step-08 output example. Follow the same level of specificity, with real citations from the content being reviewed.

## Quality Criteria

- [ ] Veredicto é consistente com os scores (sem contradições)
- [ ] Pelo menos 2 Strengths com citações específicas do conteúdo
- [ ] Required changes incluem: localização, problema, fix, e exemplo quando possível
- [ ] Suggestions claramente separadas (non-blocking label)
- [ ] Se REJECT: PATH TO APPROVAL com fixes numerados e específicos
- [ ] Revision count declarado (N de 3)
- [ ] Review format é consistente e completo

## Veto Conditions

Reject and redo if ANY are true:
1. Veredicto contradiz os scores (ex: APPROVE com critério < 4/10)
2. REJECT sem PATH TO APPROVAL
3. Zero Strengths identificados (mesmo em REJECT, bom trabalho deve ser reconhecido)
