---
task: "Generate Angles"
order: 1
input: |
  - selected_story: A notícia selecionada pelo usuário no checkpoint
  - research_results: Dados completos da pesquisa
  - company_context: Contexto da OrbitMind
output: |
  - angles: 5 ângulos distintos com hook, premissa e tom sugerido
---

# Generate Angles

Transforma a notícia selecionada pelo usuário em 5 ângulos de copywriting distintos, cada um com uma perspectiva emocional diferente que gera um carrossel completamente diferente.

## Process

1. **Identificar a notícia selecionada** e extrair seus dados-chave: fatos, números, implicações, protagonistas, timeline.
2. **Contextualizar para a OrbitMind**: como essa notícia se conecta com o ecossistema de multi-agentes? Qual a perspectiva única que a OrbitMind pode oferecer?
3. **Aplicar os 5 ângulos** obrigatórios:
   - 🔴 **Medo**: consequência negativa de ignorar. Usar loss aversion como driver. Foco em: o que acontece com quem não age?
   - 🟢 **Oportunidade**: janela de vantagem competitiva. Foco em: quem agir agora ganha o quê? Incluir timeframe específico.
   - 📚 **Educacional**: explicação prática. Foco em: como isso funciona na prática? Incluir promessa de passo-a-passo.
   - ↔️ **Contrário**: perspectiva que desafia o consenso. Foco em: o que todo mundo está ignorando? Take que provoca debate.
   - ⭐ **Inspiracional**: visão de futuro motivadora. Foco em: como o cenário se transforma? Pintar o futuro com dados.
4. **Para cada ângulo**, criar hook (max 125 chars), premissa (2-3 frases), e tom sugerido dentre os 6 tons disponíveis.
5. **Garantir diferenciação real**: cada ângulo deve gerar um carrossel completamente diferente. Se dois ângulos resultariam em conteúdo similar, reescrever.

## Output Format

```yaml
story_title: "..."
story_summary: "..."
angles:
  - type: "medo"
    emoji: "🔴"
    hook: "..." # max 125 chars
    premise: "..." # 2-3 sentences
    suggested_tone: "provocador|educador|visionario|analista|bastidores|urgente"
  - type: "oportunidade"
    emoji: "🟢"
    hook: "..."
    premise: "..."
    suggested_tone: "..."
  # ... all 5 angles
```

## Output Example

```yaml
story_title: "Anthropic lança Claude Code com agentes autônomos"
story_summary: "Agentes que criam, revisam e deployam código sem intervenção. 31% menos bugs. 1M de contexto."
angles:
  - type: "medo"
    emoji: "🔴"
    hook: "Em 12 meses, devs sem agentes de IA vão parecer devs sem Git em 2010."
    premise: "O mercado está se dividindo em dois grupos: quem automatiza com agentes e quem faz tudo manual. A Anthropic acabou de entregar a ferramenta que acelera essa divisão. O custo de não adotar não é ficar igual — é ficar para trás exponencialmente."
    suggested_tone: "urgente"

  - type: "oportunidade"
    emoji: "🟢"
    hook: "Times de 3 devs vão entregar como times de 15. A ferramenta acabou de sair."
    premise: "Claude Code com agentes autônomos permite que um dev configure uma esteira completa de desenvolvimento automatizado. As empresas que implementarem isso agora têm 6-12 meses de vantagem competitiva antes da massificação."
    suggested_tone: "visionario"

  - type: "educacional"
    emoji: "📚"
    hook: "Configurei uma esteira de dev com agentes de IA em 3 horas. Aqui está como."
    premise: "Passo-a-passo prático de como usar Claude Code para automatizar code review, testes e deploy. Sem teoria — só o que funciona, com comandos reais. Qualquer dev pode replicar hoje."
    suggested_tone: "educador"

  - type: "contrario"
    emoji: "↔️"
    hook: "O hype de AI agents vai decepcionar 80% das empresas. Aqui está o porquê."
    premise: "Enquanto todo mundo celebra agentes autônomos, a realidade é que sem processo bem definido, agentes amplificam caos. O problema não é a tecnologia — é a maturidade operacional de quem adota."
    suggested_tone: "provocador"

  - type: "inspiracional"
    emoji: "⭐"
    hook: "Imagine 20 agentes de IA trabalhando no seu repo enquanto você dorme."
    premise: "O futuro do desenvolvimento não é um dev mais rápido — é um orquestrador de agentes especializados. A Anthropic acabou de tornar esse futuro acessível. A era do dev solo com superpoderes chegou."
    suggested_tone: "visionario"
```

## Quality Criteria

- [ ] Exatamente 5 ângulos gerados (todos os tipos obrigatórios)
- [ ] Cada hook tem no máximo 125 caracteres
- [ ] Cada hook passa no scroll-stop test
- [ ] Premissas têm 2-3 frases com abordagem clara e diferenciada
- [ ] Ângulos são genuinamente diferentes (gerariam carrosséis distintos)
- [ ] Todos se baseiam na MESMA notícia selecionada

## Veto Conditions

Reject and redo if ANY are true:
1. Menos de 5 ângulos gerados
2. Dois ou mais ângulos resultariam em conteúdo essencialmente similar
3. Qualquer hook excede 125 caracteres
