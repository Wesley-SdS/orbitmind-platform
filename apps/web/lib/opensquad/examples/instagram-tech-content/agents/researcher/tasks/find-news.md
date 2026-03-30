---
task: "Find News"
order: 1
input: |
  - research_focus: Tema e período definidos pelo usuário (de research-focus.md)
  - company_context: Contexto da OrbitMind para filtrar relevância
output: |
  - raw_results: Lista de 15-30 candidatos de notícias com metadados
  - source_map: Mapa de fontes por categoria e confiabilidade
---

# Find News

Busca ampla de notícias e conteúdos sobre o tema definido pelo usuário, cobrindo múltiplas categorias de fontes para garantir diversidade e completude.

## Process

1. **Ler research-focus.md** para extrair tema exato e período de tempo. Este é o input mandatório.
2. **Mapear categorias de fontes** relevantes para o tema: publicações tech (TechCrunch, The Verge, Ars Technica, Wired), blogs oficiais (Anthropic, OpenAI, Google DeepMind, Meta AI), comunidades (Hacker News, Reddit r/MachineLearning, r/artificial), acadêmico (ArXiv), social (Twitter/X de figuras-chave), produto (Product Hunt).
3. **Executar 5-8 buscas web** com queries variadas:
   - "{tema}" (busca direta)
   - "{tema} news {período}" (temporal)
   - "{tema} impact implications analysis" (profundidade)
   - "{tema} technical details specifications" (técnico)
   - "{tema} brasil" ou "{tema} em português" (relevância local)
   - "{tema} opinion debate" (controvérsia)
4. **Coletar 15-30 resultados candidatos** com: título, fonte, data, URL, snippet/resumo inicial, categoria da fonte.
5. **Verificar acessibilidade** de cada URL — descartar links quebrados ou paywalled sem resumo disponível.
6. **Compilar source map** agrupando resultados por categoria e notando confiabilidade de cada fonte.

## Output Format

```yaml
raw_results:
  - title: "..."
    source: "..."
    date: "YYYY-MM-DD"
    url: "..."
    snippet: "..."
    source_category: "media|official|community|academic|social|product"
    accessible: true|false

source_map:
  media: [{source, count, avg_reliability}]
  official: [...]
  community: [...]
```

## Output Example

```yaml
raw_results:
  - title: "Anthropic Launches Autonomous Coding Agents in Claude Code"
    source: "TechCrunch"
    date: "2026-03-25"
    url: "https://techcrunch.com/2026/03/25/anthropic-claude-code-agents"
    snippet: "Anthropic released an update to Claude Code enabling fully autonomous software development agents that can create, review, test, and deploy code without human intervention. Early benchmarks show 31% reduction in production bugs."
    source_category: "media"
    accessible: true

  - title: "Claude Code Agents: Technical Deep Dive"
    source: "Anthropic Blog"
    date: "2026-03-25"
    url: "https://anthropic.com/blog/claude-code-agents"
    snippet: "Official technical documentation of the new agent capabilities including 1M context window utilization for full-repository understanding, multi-step planning, and integrated CI/CD pipeline automation."
    source_category: "official"
    accessible: true

  - title: "Discussion: Claude Code Agents vs Devin vs Copilot Workspace"
    source: "Hacker News"
    date: "2026-03-26"
    url: "https://news.ycombinator.com/item?id=example"
    snippet: "600+ comments comparing the new Claude Code agents with existing solutions. Key debate: autonomy vs control tradeoffs. Several production experience reports shared."
    source_category: "community"
    accessible: true

source_map:
  media:
    - {source: "TechCrunch", count: 3, avg_reliability: "9/10"}
    - {source: "The Verge", count: 2, avg_reliability: "8/10"}
  official:
    - {source: "Anthropic Blog", count: 2, avg_reliability: "10/10"}
  community:
    - {source: "Hacker News", count: 4, avg_reliability: "6/10"}
```

## Quality Criteria

- [ ] Pelo menos 15 resultados candidatos coletados
- [ ] Pelo menos 3 categorias de fontes diferentes representadas
- [ ] Cada resultado tem título, fonte, data, URL e snippet
- [ ] Source map compilado com categorias e reliability scores
- [ ] Período de tempo do usuário respeitado nos resultados

## Veto Conditions

Reject and redo if ANY are true:
1. Menos de 10 resultados candidatos encontrados
2. Todas as fontes são de uma única categoria (sem diversidade)
