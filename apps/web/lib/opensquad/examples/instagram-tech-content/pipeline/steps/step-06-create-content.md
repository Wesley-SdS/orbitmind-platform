---
execution: inline
agent: instagram-feed-creator
format: instagram-feed
inputFile: squads/instagram-tech-content/output/angles.md
outputFile: squads/instagram-tech-content/output/instagram-content.md
---

# Step 06: Criar e Otimizar Carrossel Instagram

## Context Loading

Load these files before executing:
- `squads/instagram-tech-content/output/angles.md` — Ângulo selecionado pelo usuário
- `squads/instagram-tech-content/output/research-results.md` — Dados da pesquisa para enrichment
- `squads/instagram-tech-content/pipeline/data/tone-of-voice.md` — Tom de voz selecionado
- `squads/instagram-tech-content/pipeline/data/output-examples.md` — Exemplos de referência
- `squads/instagram-tech-content/pipeline/data/domain-framework.md` — Framework operacional
- `squads/instagram-tech-content/pipeline/data/anti-patterns.md` — Erros a evitar
- `squads/instagram-tech-content/pipeline/data/quality-criteria.md` — Critérios de qualidade
- `_opensquad/_memory/company.md` — Contexto da OrbitMind

## Instructions

### Process

1. **Carregar o ângulo selecionado** e o tom de voz escolhido pelo usuário.
2. **Executar diagnóstico pré-escrita** (copywriting best practices):
   - Nível de consciência do público: a comunidade tech/IA é Solution Aware a Product Aware
   - Nível de sofisticação do mercado: Stage 3-4 (mecanismo importa, belief fatigue emergindo)
   - Big Idea: identificar inimigo, mecanismo único, promessa única
   - Driver psicológico dominante: derivar do ângulo selecionado
3. **Selecionar formato de carrossel** mais adequado ao ângulo:
   - Editorial/Tese para argumentos com dados
   - Listicle para ferramentas e dicas
   - Tutorial para passo-a-passo
   - Mito vs Realidade para takes contrários
   - Storytelling para narrativas pessoais
   - Problema → Solução para posicionamento
4. **Criar 3 opções de hook** com drivers psicológicos e estruturas diferentes. Apresentar ao agente interno para seleção (usar o melhor que combine com o ângulo e tom escolhidos).
5. **Desenvolver o carrossel completo** com 8-10 slides:
   - Slide 1: Cover com título bold e provocativo (max 20 palavras)
   - Slides 2-8/9: Um argumento/ponto por slide com hierarquia de 2 camadas
   - Cada slide: headline bold + supporting text (40-80 palavras total)
   - Alternar backgrounds: light, dark, accent
   - Destacar keywords em cor de destaque
   - Último slide: CTA específico
6. **Escrever a caption** completa:
   - Hook nos primeiros 125 caracteres (deve funcionar sozinho)
   - Body com framework de persuasão (PAS, AIDA, BAB conforme o ângulo)
   - Objection neutralizer antes do CTA
   - Pergunta provocativa final
7. **Gerar hashtags**: 5-15 hashtags com mix de nicho tech (#agentesia, #devbrasil), mid-range (#inteligenciaartificial, #automacao), e broad (#tech, #inovacao).
8. **Otimizar o conteúdo**:
   - Copy Stress Test: crédibilidade, provas, inflação, fricção
   - Reduzir word count 15-25% sem perder substância
   - Scroll-stop test no hook
   - Anti-commodity check: não poderia ser postado por outro perfil tech
   - Validar constraints: 2200 chars caption, 125 chars visíveis, ratio 3:4, 5-15 hashtags

## Output Format

```
=== DIAGNÓSTICO ===
Awareness Level: {nível}
Market Sophistication: {stage}
Big Idea: {enemy} → {mechanism} → {promise}
Psychological Driver: {driver}
Persuasion Framework: {PAS/AIDA/BAB/4Ps}

=== FORMAT ===
{Nome do formato de carrossel escolhido}

=== SLIDES ===
Slide 1 (Cover):
  Title: {título bold — max 20 palavras}
  Photo: {direção de foto/visual}
  Background: {cover photo / solid color}

Slide 2 ({Role}):
  Headline: {texto bold grande — claim principal}
  Photo: {descrição de foto, se aplicável}
  Supporting text: {texto menor — dados, contexto, elaboração}
  Accent keywords: {palavras para destacar em cor de destaque}
  Background: {light/dark/accent}

...continue for all slides (8-10 total, min 40 / max 80 words per slide)...

Slide N (CTA):
  Photo: {imagem de fechamento}
  Source: {fonte que inspirou o conteúdo, se aplicável}
  CTA: {ação específica — comment keyword, save, share}

=== CAPTION ===
{Hook paragraph — primeiros 125 caracteres que compelem o tap em "mais"}

{Body paragraph — argumento expandido com pontos-chave. Line breaks para legibilidade.}

{Pergunta de fechamento — provocativa, open-ended, que gera comentários.}

=== HASHTAGS ===
#hashtag1 #hashtag2 ... #hashtagN
{5-15 hashtags, mix de nicho, mid-range e broad}

=== OPTIMIZATION NOTES ===
- Word count reduction: {X}% applied
- Scroll-stop test: {PASS/FAIL + justification}
- Anti-commodity check: {PASS/FAIL + justification}
- Constraints validated: {caption chars, hashtag count, slide count}
```

## Output Example

(Reference the output-examples.md file for complete examples — follow that exact quality level and depth)

## Veto Conditions

Reject and redo if ANY of these are true:
1. Qualquer slide com menos de 40 palavras (headline + supporting text)
2. Caption hook excede 125 caracteres visíveis
3. Menos de 8 slides no carrossel
4. Sem CTA específico no último slide e na caption
5. Conteúdo genérico que poderia ser de qualquer perfil tech (anti-commodity fail)

## Quality Criteria

- [ ] Formato de carrossel explicitamente escolhido e seguido
- [ ] Cover slide tem título bold e provocativo (max 20 palavras)
- [ ] Cada slide usa hierarquia de 2 camadas (headline + supporting text)
- [ ] Cada slide tem 40-80 palavras
- [ ] Backgrounds alternam entre slides
- [ ] Keywords destacadas nos headlines
- [ ] Caption hook funciona nos primeiros 125 caracteres
- [ ] Caption termina com pergunta provocativa
- [ ] 5-15 hashtags com mix adequado
- [ ] Tom de voz consistente com a escolha do usuário
- [ ] Dados concretos e específicos presentes (números, fontes)
- [ ] Framework de persuasão identificável e bem executado
- [ ] Anti-commodity check: conteúdo é único da OrbitMind
