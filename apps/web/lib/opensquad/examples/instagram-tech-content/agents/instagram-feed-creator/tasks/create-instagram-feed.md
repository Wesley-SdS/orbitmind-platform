---
task: "Create Instagram Feed"
order: 2
input: |
  - selected_angle: Ângulo escolhido pelo usuário
  - selected_tone: Tom de voz escolhido pelo usuário
  - research_results: Dados da pesquisa para enrichment
  - company_context: Contexto da OrbitMind
output: |
  - carousel: Carrossel completo com slides, caption e hashtags
  - diagnosis: Diagnóstico pré-escrita (awareness, sophistication, big idea, driver)
---

# Create Instagram Feed

Cria o carrossel completo para Instagram Feed a partir do ângulo e tom selecionados, seguindo o formato de carrossel mais adequado e aplicando técnicas avançadas de copywriting.

## Process

1. **Carregar ângulo e tom** selecionados pelo usuário.
2. **Executar diagnóstico pré-escrita**:
   - Awareness level: comunidade tech/IA é Solution Aware a Product Aware
   - Market sophistication: Stage 3-4 (mecanismo importa mais que promessa)
   - Big Idea: identificar inimigo (status quo que estamos desafiando), mecanismo único (como a OrbitMind/IA resolve), promessa única (transformação específica)
   - Psychological driver: derivar do ângulo selecionado (medo→loss aversion, oportunidade→achievement, educacional→control, contrário→status, inspiracional→freedom)
3. **Selecionar formato de carrossel** baseado no ângulo:
   - Medo/Urgente → Editorial/Tese ou Problema → Solução
   - Oportunidade → Editorial/Tese ou Antes e Depois
   - Educacional → Tutorial ou Listicle
   - Contrário → Mito vs Realidade ou Editorial/Tese
   - Inspiracional → Storytelling ou Editorial/Tese
4. **Criar 3 hooks** com drivers e estruturas diferentes. Selecionar o melhor para o ângulo e tom escolhidos.
5. **Desenvolver 8-10 slides** seguindo o slide flow do formato escolhido:
   - Slide 1 (Cover): título bold, max 20 palavras, visual magazine-style
   - Slides intermediários: 1 argumento por slide, headline + supporting text, 40-80 palavras
   - Backgrounds alternando: light → dark → accent → light...
   - Keywords destacadas em cor de destaque
   - Último slide: CTA específico + fonte de referência
6. **Escrever caption** completa:
   - Hook nos primeiros 125 caracteres (funciona como standalone)
   - Body com framework de persuasão apropriado (PAS, AIDA, BAB)
   - Objection neutralizer antes do CTA
   - Pergunta provocativa final para gerar comentários
7. **Gerar hashtags**: 5-15 hashtags, mix de nicho (#agentesia, #devbrasil), mid-range (#inteligenciaartificial), broad (#tech).

## Output Format

```yaml
diagnosis:
  awareness_level: "..."
  market_sophistication: "Stage X"
  big_idea:
    enemy: "..."
    mechanism: "..."
    promise: "..."
  psychological_driver: "..."
  persuasion_framework: "PAS|AIDA|BAB|4Ps|Star-Story-Solution"

carousel:
  format: "Editorial|Listicle|Tutorial|Mito vs Realidade|Storytelling|Problema → Solução"
  slides:
    - number: 1
      role: "Cover"
      title: "..."
      photo: "..."
      background: "..."
    - number: 2
      role: "..."
      headline: "..."
      supporting_text: "..."
      accent_keywords: ["..."]
      background: "light|dark|accent"
    # ... all slides

caption:
  hook: "..." # first 125 chars
  body: "..."
  closing_question: "..."

hashtags: ["#tag1", "#tag2", ...]
```

## Output Example

> Reference the output-examples.md file for complete carousel examples. Follow that exact level of quality, depth, and specificity. Each slide must have substantive content with real data and insights — never filler or generic statements.

## Quality Criteria

- [ ] Diagnóstico pré-escrita completo (awareness, sophistication, big idea, driver)
- [ ] Formato de carrossel escolhido e justificado
- [ ] 8-10 slides com hierarquia de 2 camadas
- [ ] Cada slide tem 40-80 palavras
- [ ] Cover slide é bold e provocativo (max 20 palavras)
- [ ] Backgrounds alternam entre slides
- [ ] Caption hook funciona nos primeiros 125 chars
- [ ] Framework de persuasão aplicado corretamente
- [ ] Dados concretos presentes (números, fontes, timeframes)

## Veto Conditions

Reject and redo if ANY are true:
1. Qualquer slide com menos de 40 palavras
2. Hook da caption excede 125 caracteres visíveis
3. Menos de 8 slides
4. Sem CTA no último slide
5. Conteúdo genérico (anti-commodity fail)
