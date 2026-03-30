---
task: "Score Content"
order: 1
input: |
  - instagram_content: Carrossel completo criado e otimizado
  - quality_criteria: Critérios de avaliação com thresholds
  - anti_patterns: Lista de erros a verificar
output: |
  - scoring_table: Tabela com 7 critérios, scores e justificativas
  - overall_score: Média dos critérios
  - hard_rejections: Lista de critérios abaixo de 4/10 (se houver)
  - anti_pattern_violations: Lista de violações detectadas
---

# Score Content

Avalia o carrossel contra os 7 critérios de qualidade definidos, atribuindo scores individuais com justificativa e detectando violações de anti-patterns.

## Process

1. **Ler o conteúdo completo** do carrossel sem fazer julgamentos. Leitura integral primeiro — do slide 1 ao CTA, caption completa, hashtags.
2. **Carregar quality-criteria.md**: estes são os critérios objetivos de avaliação. Não inventar critérios adicionais.
3. **Avaliar cada critério individualmente** (1-10):
   - **Hook Power**: O slide 1 para o scroll? Caption hook funciona em 125 chars? Gatilho emocional claro?
   - **Estrutura do Carrossel**: Formato seguido? Hierarquia de 2 camadas? 40-80 palavras/slide? Backgrounds alternando?
   - **Profundidade de Conteúdo**: Cada slide avança narrativa? Dados e evidências presentes? Save-worthy?
   - **Copywriting e Persuasão**: Framework identificável? Driver psicológico ancora a peça? Sem clichês?
   - **CTA e Engajamento**: CTA específico no slide final e caption? Intensidade adequada? Incentiva save/share?
   - **Tom de Voz e Marca**: Alinhado com OrbitMind? Vocabulário adequado para tech? Sem jargão corporativo?
   - **Compliance Técnico**: Caption ≤ 2200 chars? 5-15 hashtags? Sem banidas? Sem links na caption?
4. **Para cada score que não é 10**, identificar a passagem específica que causou dedução (slide N, parágrafo X).
5. **Checar anti-patterns**: verificar cada item da lista contra o conteúdo. Flaggar qualquer violação.
6. **Calcular overall score** como média dos 7 critérios.
7. **Identificar hard rejections**: qualquer critério abaixo de 4/10.

## Output Format

```yaml
scoring_table:
  - criterion: "Hook Power"
    score: X/10
    justification: "..."
    deduction_location: "Slide 1 / Caption hook"
  - criterion: "Estrutura do Carrossel"
    score: X/10
    justification: "..."
    deduction_location: "..."
  # ... all 7 criteria

overall_score: X.X/10
hard_rejections: [] # or list of criteria below 4/10
anti_pattern_violations: [] # or list of detected violations with locations
```

## Output Example

```yaml
scoring_table:
  - criterion: "Hook Power"
    score: 9/10
    justification: "Hook 'Claude 4 saiu e ninguém tá falando sobre o que realmente importa' cria curiosity gap + exclusivity signal. Funciona em 62/125 chars. Gatilho de curiosidade forte."
    deduction_location: "N/A — score alto"
  - criterion: "Estrutura do Carrossel"
    score: 8/10
    justification: "Formato Editorial seguido corretamente. 10 slides com hierarquia de 2 camadas. Backgrounds alternam. Dedução: Slide 6 tem 38 palavras, abaixo do mínimo de 40."
    deduction_location: "Slide 6 — 38 palavras (mínimo 40)"
  - criterion: "Profundidade de Conteúdo"
    score: 8/10
    justification: "Cada slide avança narrativa com argumento distinto. Dados de 31% bugs e 700+ integrações. Dedução: Slide 8 (integrações) não cita fonte específica."
    deduction_location: "Slide 8 — claim sem fonte"
  - criterion: "Copywriting e Persuasão"
    score: 7/10
    justification: "PAS bem executado. Loss aversion como driver. Dedução: objection neutralizer ausente antes do CTA na caption."
    deduction_location: "Caption — ausência de objection neutralizer"
  - criterion: "CTA e Engajamento"
    score: 8/10
    justification: "CTA 'Comenta AGENTES' é específico e acionável. Save incentivado. Poderia adicionar urgência temporal."
    deduction_location: "Slide 10 CTA — sem urgência temporal"
  - criterion: "Tom de Voz e Marca"
    score: 9/10
    justification: "Técnico-profissional e acessível. Vocabulário de dev. Referências a OrbitMind Pipeline. Sem jargão corporativo."
    deduction_location: "N/A"
  - criterion: "Compliance Técnico"
    score: 10/10
    justification: "Caption 1847/2200 chars. 10 hashtags mix adequado. Sem links na caption. Ratio 3:4 especificado."
    deduction_location: "N/A"

overall_score: 8.4/10
hard_rejections: []
anti_pattern_violations: []
```

## Quality Criteria

- [ ] Todos os 7 critérios avaliados com score 1-10 e justificativa
- [ ] Justificativas citam elementos específicos do conteúdo
- [ ] Deduction locations identificadas para scores < 10
- [ ] Anti-patterns verificados (todos os itens da lista)
- [ ] Overall score calculado corretamente como média
- [ ] Hard rejections identificados (critérios < 4/10)

## Veto Conditions

Reject and redo if ANY are true:
1. Algum critério avaliado sem justificativa escrita
2. Overall score não corresponde à média dos critérios individuais
