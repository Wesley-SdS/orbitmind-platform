---
task: "Optimize Instagram Feed"
order: 3
input: |
  - carousel: Carrossel criado na task anterior
  - quality_criteria: Critérios de qualidade do squad
  - anti_patterns: Erros a evitar
output: |
  - optimized_carousel: Carrossel otimizado com notas de otimização
  - optimization_report: Relatório do que foi mudado e por quê
---

# Optimize Instagram Feed

Aplica uma passada de otimização rigorosa sobre o carrossel criado, reduzindo filler, fortalecendo hooks, validando constraints técnicos e garantindo que o conteúdo está no nível máximo de qualidade antes do review.

## Process

1. **Copy Stress Test**: Para cada seção do carrossel, responder internamente:
   - Um leitor cético acreditaria nisso? Se não, adicionar prova ou remover claim
   - Existe prova por trás de toda afirmação significativa? Se não, adicionar fonte ou citar dado
   - A promessa está inflada para o awareness level da audiência? Se sim, calibrar
   - Existe fricção ou confusão no fluxo? Se sim, simplificar
   - Alguma frase pode ser cortada sem perder significado? Se sim, cortar
2. **Redução de word count**: Cortar 15-25% do texto total sem perder substância. Filler, não conteúdo.
   - Remover: "é importante notar que", "como já sabemos", "na verdade", frases de transição vazias
   - Manter: dados, exemplos, argumentos, provas, CTAs
3. **Scroll-stop test no hook**: Reler o hook do slide 1 e os primeiros 125 chars da caption. "Se eu estivesse scrollando em velocidade máxima, essa primeira linha me faria parar?" Se não → reescrever.
4. **Anti-commodity check**: "Esse exato conteúdo poderia ser usado por um concorrente no mesmo nicho?" Se sim → adicionar perspectiva OrbitMind, dados únicos, ou ângulo proprietário.
5. **Validar constraints técnicos**:
   - Caption: ≤ 2200 caracteres
   - Hook visível: ≤ 125 caracteres
   - Slides: 8-10 slides
   - Palavras por slide: 40-80
   - Hashtags: 5-15, sem banidas
   - Ratio de imagem: 3:4 (1080x1440px)
6. **Verificar anti-patterns**: Checar cada item da lista de anti-patterns contra o conteúdo.
7. **Compilar relatório de otimização** com todas as mudanças e justificativas.

## Output Format

```yaml
optimization_report:
  word_count_reduction: "X%"
  scroll_stop_test: "PASS|FAIL"
  scroll_stop_notes: "..."
  anti_commodity_check: "PASS|FAIL"
  anti_commodity_notes: "..."
  constraints_validated:
    caption_chars: X/2200
    hook_chars: X/125
    slide_count: X
    words_per_slide: "X-Y range"
    hashtag_count: X
  changes_made:
    - location: "Slide X / Caption / Hashtags"
      before: "..."
      after: "..."
      reason: "..."
  anti_patterns_checked: X/10
  anti_patterns_violations: 0

optimized_carousel: # Full carousel with all optimizations applied
  # (same structure as create task output)
```

## Output Example

```yaml
optimization_report:
  word_count_reduction: "18%"
  scroll_stop_test: "PASS"
  scroll_stop_notes: "Hook 'Claude 4 saiu e ninguém tá falando sobre o que realmente importa' cria curiosity gap imediato + exclusivity signal"
  anti_commodity_check: "PASS"
  anti_commodity_notes: "Referências a OrbitMind Pipeline e dados de esteira própria diferenciam de conteúdo genérico sobre Claude"
  constraints_validated:
    caption_chars: 1847/2200
    hook_chars: 62/125
    slide_count: 10
    words_per_slide: "42-76 range"
    hashtag_count: 10
  changes_made:
    - location: "Slide 3, supporting text"
      before: "Isso é algo que é realmente importante de se notar porque representa uma mudança de paradigma significativa em como nós construímos aplicações com inteligência artificial."
      after: "Isso não é incremental — é uma mudança de paradigma em como construímos com IA."
      reason: "Remoção de filler ('algo que é realmente importante de se notar', 'significativa'). Redução de 26 para 14 palavras sem perda de substância."
    - location: "Caption, parágrafo 2"
      before: "Na verdade, o que está acontecendo é que empresas estão rodando esteiras inteiras de desenvolvimento com agentes de IA."
      after: "Empresas estão rodando esteiras inteiras de desenvolvimento com agentes de IA."
      reason: "Removido 'Na verdade, o que está acontecendo é que' — filler que não adiciona significado."
  anti_patterns_checked: 10
  anti_patterns_violations: 0
```

## Quality Criteria

- [ ] Copy Stress Test aplicado a todas as seções
- [ ] Word count reduzido 15-25% sem perder substância
- [ ] Scroll-stop test PASS no hook
- [ ] Anti-commodity check PASS
- [ ] Todos os constraints técnicos validados
- [ ] Relatório de otimização inclui todas as mudanças com before/after/reason

## Veto Conditions

Reject and redo if ANY are true:
1. Word count não foi reduzido (0% reduction)
2. Scroll-stop test FAIL sem reescrita do hook
3. Constraints técnicos violados após otimização
