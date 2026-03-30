---
execution: subagent
agent: researcher
inputFile: squads/instagram-tech-content/output/research-focus.md
outputFile: squads/instagram-tech-content/output/research-results.md
model_tier: powerful
---

# Step 02: Pesquisa de Notícias Tech/IA

## Context Loading

Load these files before executing:
- `squads/instagram-tech-content/output/research-focus.md` — Tema e período definidos pelo usuário
- `squads/instagram-tech-content/pipeline/data/research-brief.md` — Referências e fontes conhecidas
- `_opensquad/_memory/company.md` — Contexto da OrbitMind para filtrar relevância

## Instructions

### Process

1. **Ler o foco da pesquisa** definido pelo usuário (tema + período de tempo). Este é o input principal.
2. **Mapear fontes relevantes** para o tema: TechCrunch, The Verge, Ars Technica, Wired, blogs oficiais (Anthropic, OpenAI, Google DeepMind), ArXiv, Hacker News, Product Hunt, Twitter/X de figuras-chave no espaço.
3. **Executar buscas web** usando WebSearch com pelo menos 5 queries diferentes:
   - Query direta: "{tema} {período}"
   - Query de impacto: "{tema} impact implications"
   - Query de opinião: "{tema} analysis opinion"
   - Query técnica: "{tema} technical details specifications"
   - Query em português: "{tema} brasil impacto"
4. **Filtrar resultados** por: recência (dentro do período), relevância para comunidade tech/IA brasileira, potencial de engajamento (novidade × impacto × controvérsia), confiabilidade da fonte.
5. **Rankear as top 5 notícias** por potencial de viralização em Instagram tech. Para cada notícia, extrair: título, fonte, data, URL, resumo de 2-3 frases, e score de potencial (1-10).
6. **Identificar dados concretos** para cada notícia: números, estatísticas, comparações, timelines. Audiência tech exige especificidade.
7. **Compilar o research brief** no formato de output definido abaixo.

## Output Format

```
RESEARCH RESULTS
Topic: {tema do usuário}
Time Range: {período selecionado}
Date: {data de hoje}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOP STORIES (ranked by engagement potential)

📰 Story 1: {título}
   Source: {fonte} | Date: {data}
   URL: {url}
   Summary: {resumo 2-3 frases com dados concretos}
   Engagement Potential: {score}/10
   Why: {por que essa notícia tem potencial de engajamento}

📰 Story 2: {título}
   Source: {fonte} | Date: {data}
   URL: {url}
   Summary: {resumo 2-3 frases}
   Engagement Potential: {score}/10
   Why: {razão}

📰 Story 3: {título}
   ...

📰 Story 4: {título}
   ...

📰 Story 5: {título}
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY DATA POINTS
- {dado concreto 1 com fonte}
- {dado concreto 2 com fonte}
- {dado concreto 3 com fonte}

SOURCES
| # | Source | Type | Relevance | Date |
|---|--------|------|-----------|------|
| 1 | ... | ... | .../10 | ... |

GAPS
- {o que não foi encontrado}
```

## Output Example

```
RESEARCH RESULTS
Topic: Agentes de IA para desenvolvimento de software
Time Range: Últimos 7 dias
Date: 2026-03-28

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOP STORIES (ranked by engagement potential)

📰 Story 1: Anthropic lança Claude Code com agentes autônomos de desenvolvimento
   Source: TechCrunch | Date: 2026-03-25
   URL: https://techcrunch.com/example
   Summary: A Anthropic lançou uma atualização do Claude Code que permite agentes autônomos criarem, revisarem e deployarem código sem intervenção humana. Benchmarks mostram 31% menos bugs em produção comparado a workflows tradicionais. O modelo Opus com 1M de contexto processa repositórios inteiros de uma vez.
   Engagement Potential: 9/10
   Why: Impacto direto na rotina de devs, dados concretos, tendência quente de AI agents

📰 Story 2: GitHub Copilot Workspace atinge 1 milhão de usuários ativos
   Source: GitHub Blog | Date: 2026-03-23
   URL: https://github.blog/example
   Summary: O Copilot Workspace alcançou 1M de usuários 8 meses após o lançamento. Dados internos mostram que times usando a ferramenta completam PRs 40% mais rápido. GitHub anuncia integração nativa com Actions para CI/CD automatizado por IA.
   Engagement Potential: 8/10
   Why: Número marco (1M), dado de produtividade concreto (40%), competidor direto no espaço

📰 Story 3: Pesquisa Stack Overflow 2026 revela que 67% dos devs usam IA diariamente
   Source: Stack Overflow | Date: 2026-03-22
   URL: https://stackoverflow.com/example
   Summary: A pesquisa anual mostra salto de 44% para 67% em uso diário de ferramentas de IA. Python e JavaScript lideram em adoção. 23% dos entrevistados reportam que IA escreveu mais de 50% do código commitado em seus projetos no último mês.
   Engagement Potential: 8/10
   Why: Dados authoritative, números surpreendentes, debate sobre futuro da profissão

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY DATA POINTS
- 31% menos bugs em produção com agentes de code review (Anthropic benchmark)
- 40% faster PRs com Copilot Workspace (GitHub internal data)
- 67% dos devs usam IA diariamente em 2026 (Stack Overflow Survey)

SOURCES
| # | Source | Type | Relevance | Date |
|---|--------|------|-----------|------|
| 1 | TechCrunch | Media | 9/10 | 2026-03-25 |
| 2 | GitHub Blog | Official | 9/10 | 2026-03-23 |
| 3 | Stack Overflow | Community | 8/10 | 2026-03-22 |

GAPS
- Dados de adoção de IA no Brasil especificamente não encontrados
- Comparativo de preços entre ferramentas não disponível nesta busca
```

## Veto Conditions

Reject and redo if ANY of these are true:
1. Menos de 3 notícias encontradas com potencial de engajamento ≥ 6/10
2. Nenhum dado concreto (número, estatística, benchmark) presente nas histórias
3. Todas as notícias são de uma única fonte — diversidade de fontes é obrigatória

## Quality Criteria

- [ ] Pelo menos 3-5 notícias rankeadas com scores de potencial
- [ ] Cada notícia tem URL, fonte, data e resumo com dados concretos
- [ ] Key data points extraídos com fontes citadas
- [ ] Relevância para comunidade tech/IA é clara em cada história
- [ ] Período de tempo do usuário foi respeitado
- [ ] Formato de output segue a estrutura definida completamente
