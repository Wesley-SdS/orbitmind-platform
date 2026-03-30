---
execution: inline
agent: instagram-feed-creator
inputFile: squads/instagram-tech-content/output/research-results.md
outputFile: squads/instagram-tech-content/output/angles.md
---

# Step 04: Gerar Ângulos

## Context Loading

Load these files before executing:
- `squads/instagram-tech-content/output/research-results.md` — Notícias pesquisadas (use a notícia selecionada pelo usuário)
- `squads/instagram-tech-content/pipeline/data/domain-framework.md` — Framework de ângulos
- `squads/instagram-tech-content/pipeline/data/anti-patterns.md` — Erros a evitar
- `_opensquad/_memory/company.md` — Contexto da OrbitMind

## Instructions

### Process

1. **Identificar a notícia selecionada** pelo usuário no checkpoint anterior.
2. **Extrair os dados-chave** da notícia: fatos, números, implicações, protagonistas.
3. **Aplicar os 5 ângulos de copywriting** à notícia selecionada:
   - 🔴 **Medo**: Consequência negativa de ignorar essa notícia/tendência. O que acontece com quem não age?
   - 🟢 **Oportunidade**: Janela de vantagem competitiva que essa notícia abre. Quem agir agora ganha o quê?
   - 📚 **Educacional**: Explicação prática com demonstração. O que isso significa na prática e como usar?
   - ↔️ **Contrário**: Perspectiva que desafia o consenso sobre essa notícia. O que ninguém está dizendo?
   - ⭐ **Inspiracional**: Visão de futuro que motiva. Como isso transforma o cenário em 12-18 meses?
4. **Para cada ângulo**, criar:
   - Hook: 1 frase que para o scroll (max 125 caracteres)
   - Premissa: 2-3 frases explicando a abordagem
   - Tom sugerido: qual tom de voz combina melhor (Provocador, Educador, Visionário, Analista, Bastidores, Urgente)
5. **Apresentar todos os 5 ângulos** no formato definido abaixo.

## Output Format

```
ÂNGULOS — {título da notícia}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 ÂNGULO 1: MEDO
Hook: "{hook em até 125 caracteres}"
Premissa: {2-3 frases sobre a abordagem}
Tom sugerido: {tom}

🟢 ÂNGULO 2: OPORTUNIDADE
Hook: "{hook em até 125 caracteres}"
Premissa: {2-3 frases sobre a abordagem}
Tom sugerido: {tom}

📚 ÂNGULO 3: EDUCACIONAL
Hook: "{hook em até 125 caracteres}"
Premissa: {2-3 frases sobre a abordagem}
Tom sugerido: {tom}

↔️ ÂNGULO 4: CONTRÁRIO
Hook: "{hook em até 125 caracteres}"
Premissa: {2-3 frases sobre a abordagem}
Tom sugerido: {tom}

⭐ ÂNGULO 5: INSPIRACIONAL
Hook: "{hook em até 125 caracteres}"
Premissa: {2-3 frases sobre a abordagem}
Tom sugerido: {tom}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Escolha o ângulo que mais combina com o momento da OrbitMind.
```

## Output Example

```
ÂNGULOS — Anthropic lança Claude Code com agentes autônomos de desenvolvimento

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 ÂNGULO 1: MEDO
Hook: "Em 12 meses, devs sem agentes de IA vão parecer devs sem Git em 2010."
Premissa: O mercado está se dividindo em dois grupos: quem automatiza com agentes e quem ainda faz tudo manual. A Anthropic acabou de entregar a ferramenta que acelera essa divisão. O custo de não adotar não é ficar igual — é ficar para trás exponencialmente.
Tom sugerido: ⚡ Urgente

🟢 ÂNGULO 2: OPORTUNIDADE
Hook: "Times de 3 devs vão entregar como times de 15. A ferramenta acabou de sair."
Premissa: Claude Code com agentes autônomos permite que um dev junior configure uma esteira completa de desenvolvimento automatizado. Issue entra, PR sai revisada. As empresas que implementarem isso agora têm 6-12 meses de vantagem competitiva.
Tom sugerido: 🚀 Visionário

📚 ÂNGULO 3: EDUCACIONAL
Hook: "Configurei uma esteira de dev com agentes de IA em 3 horas. Aqui está como."
Premissa: Passo-a-passo prático de como usar Claude Code para automatizar code review, testes e deploy. Sem teoria — só o que funciona, com screenshots e comandos reais. Qualquer dev pode replicar.
Tom sugerido: 📚 Educador

↔️ ÂNGULO 4: CONTRÁRIO
Hook: "O hype de AI agents vai decepcionar 80% das empresas. Aqui está o porquê."
Premissa: Enquanto todo mundo celebra agentes autônomos, a realidade é que sem processo bem definido, agentes amplificam caos. O problema não é a tecnologia — é a maturidade operacional de quem adota. Most companies aren't ready.
Tom sugerido: 🔥 Provocador

⭐ ÂNGULO 5: INSPIRACIONAL
Hook: "Imagine 20 agentes de IA trabalhando no seu repo enquanto você dorme."
Premissa: O futuro do desenvolvimento de software não é um dev mais rápido — é um orquestrador de agentes especializados. A Anthropic acabou de tornar esse futuro acessível. A era do dev solo com superpoderes chegou.
Tom sugerido: 🚀 Visionário

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Escolha o ângulo que mais combina com o momento da OrbitMind.
```

## Veto Conditions

Reject and redo if ANY of these are true:
1. Menos de 5 ângulos gerados (todos os 5 tipos são obrigatórios)
2. Dois ou mais ângulos usam essencialmente a mesma abordagem/perspectiva
3. Hooks excedem 125 caracteres

## Quality Criteria

- [ ] 5 ângulos distintos gerados (Medo, Oportunidade, Educacional, Contrário, Inspiracional)
- [ ] Cada hook tem no máximo 125 caracteres e para o scroll
- [ ] Cada premissa tem 2-3 frases com abordagem clara
- [ ] Ângulos são genuinamente diferentes entre si (não variações do mesmo argumento)
- [ ] Tom sugerido combina com o ângulo proposto
- [ ] Todos os ângulos se baseiam na MESMA notícia selecionada
