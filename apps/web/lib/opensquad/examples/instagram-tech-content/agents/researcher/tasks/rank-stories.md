---
task: "Rank Stories"
order: 2
input: |
  - raw_results: Lista de 15-30 candidatos de notícias da task anterior
  - company_context: Contexto da OrbitMind
output: |
  - ranked_stories: Top 5 notícias rankeadas por potencial de engajamento
  - key_data_points: Dados concretos extraídos com fontes
  - gaps: Lacunas identificadas na pesquisa
---

# Rank Stories

Analisa e rankeia os resultados da busca por potencial de engajamento no Instagram, extraindo dados concretos e compilando o research brief final.

## Process

1. **Ler todos os raw_results** da task anterior.
2. **Filtrar por qualidade**: remover resultados com fontes não confiáveis, links inacessíveis, ou conteúdo genérico sem dados.
3. **Deep-dive nos top 8-12 candidatos**: para cada um, ler além do snippet — extrair dados concretos, números, citações, implicações.
4. **Cross-reference claims**: verificar dados-chave em pelo menos 2 fontes. Atribuir confidence levels:
   - HIGH: 3+ fontes independentes concordam
   - MEDIUM: 2 fontes concordam
   - LOW: fonte única ou dados conflitantes
5. **Calcular Engagement Potential Score** (1-10) para cada história usando a fórmula:
   - Novidade (0-3): quão recente e inédito é?
   - Impacto (0-3): quanto afeta o dia-a-dia da comunidade tech?
   - Controvérsia (0-2): gera debate ou opinião forte?
   - Especificidade de dados (0-2): tem números concretos que surpreendem?
6. **Rankear top 5** por score total.
7. **Extrair key data points** com fontes citadas.
8. **Documentar gaps** — o que não foi encontrado.
9. **Compilar output final** no formato do research brief.

## Output Format

```yaml
ranked_stories:
  - rank: 1
    title: "..."
    source: "..."
    date: "YYYY-MM-DD"
    url: "..."
    summary: "2-3 frases com dados concretos"
    engagement_potential: X/10
    scoring:
      novelty: X/3
      impact: X/3
      controversy: X/2
      data_specificity: X/2
    why: "razão do potencial de engajamento"
    confidence: "HIGH|MEDIUM|LOW"

key_data_points:
  - point: "..."
    source: "..."
    confidence: "HIGH|MEDIUM|LOW"

gaps:
  - "..."
```

## Output Example

```yaml
ranked_stories:
  - rank: 1
    title: "Anthropic lança Claude Code com agentes autônomos de desenvolvimento"
    source: "TechCrunch"
    date: "2026-03-25"
    url: "https://techcrunch.com/example"
    summary: "A Anthropic lançou agentes autônomos no Claude Code que criam, revisam e deployam código sem intervenção humana. Benchmarks internos mostram 31% menos bugs em produção. O modelo Opus com 1M de contexto processa repositórios inteiros de uma vez."
    engagement_potential: 9/10
    scoring:
      novelty: 3/3
      impact: 3/3
      controversy: 1/2
      data_specificity: 2/2
    why: "Impacto direto na rotina de devs, dados concretos de performance, tendência quente de AI agents, debate sobre autonomia vs controle"
    confidence: "HIGH"

  - rank: 2
    title: "GitHub Copilot Workspace atinge 1 milhão de usuários ativos"
    source: "GitHub Blog"
    date: "2026-03-23"
    url: "https://github.blog/example"
    summary: "Copilot Workspace alcançou 1M de usuários em 8 meses. Dados internos mostram PRs completadas 40% mais rápido. GitHub anuncia integração nativa com Actions para CI/CD automatizado."
    engagement_potential: 8/10
    scoring:
      novelty: 2/3
      impact: 3/3
      controversy: 1/2
      data_specificity: 2/2
    why: "Número marco (1M), dado de produtividade concreto (40%), competição no espaço de dev tools"
    confidence: "HIGH"

key_data_points:
  - point: "31% menos bugs em produção com agentes de code review"
    source: "Anthropic internal benchmark, cited by TechCrunch"
    confidence: "MEDIUM"
  - point: "40% faster PRs com Copilot Workspace"
    source: "GitHub internal data, official blog"
    confidence: "HIGH"
  - point: "67% dos devs usam IA diariamente em 2026"
    source: "Stack Overflow Developer Survey 2026"
    confidence: "HIGH"

gaps:
  - "Dados de adoção de IA por devs no Brasil especificamente não encontrados"
  - "Comparativo de preços entre ferramentas de código com IA não disponível"
  - "Métricas de ROI de agentes de IA em empresas brasileiras inexistentes nas fontes consultadas"
```

## Quality Criteria

- [ ] Top 5 notícias rankeadas com scores detalhados
- [ ] Cada notícia tem URL, fonte, data e resumo com dados concretos
- [ ] Engagement potential score decomposto em 4 fatores
- [ ] Key data points extraídos com confidence levels
- [ ] Gaps documentados (seção mandatória)
- [ ] Cross-reference realizado para findings HIGH confidence

## Veto Conditions

Reject and redo if ANY are true:
1. Menos de 3 notícias com engagement potential ≥ 6/10
2. Nenhum dado concreto (número, estatística, benchmark) presente nas top stories
3. Todas as notícias rankeadas são de uma única fonte
