# Relatório Comparativo: OrbitMind vs OpenSquad — Criação de Squad

## Data: 2026-03-28
## Teste: Criação de squad de atendimento ao cliente

---

## 1. OpenSquad (CLI - Claude Code)

### Fluxo observado (screenshots anteriores)

| Step | Tempo | O que acontece |
|------|-------|----------------|
| 1. Welcome | 0s | "Bem-vindo ao Opensquad! Parece que é a sua primeira vez aqui." |
| 2. Nome | ~5s | Pergunta nome com opções visuais (select menu interativo) |
| 3. Idioma | ~3s | Select com 3 opções (PT-BR, EN, ES) com descrições |
| 4. Empresa | ~5s | Pergunta nome da empresa com opções "Digitar"/"Pular" |
| 5. Website | ~3s | Pergunta URL para pesquisar sobre o negócio |
| 6. Auto-pesquisa | ~30s | Pesquisa web sobre a empresa, extrai perfil completo |
| 7. Perfil visual | ~5s | Apresenta perfil formatado com bordas, seções, alinhamento |
| 8. Confirmação | ~3s | "O perfil está correto?" com opções |
| 9. Menu principal | instant | Menu visual com 4 opções formatadas |
| 10. "Criar squad" | ~2s | "O que esse squad deve fazer?" |
| 11. Propósito | ~5s | Resposta → "Pra quem é esse conteúdo?" com 4 opções |
| 12. Público | ~3s | "Tem perfis de referência?" (URLs opcionais) |
| 13. Referências | ~3s | "Pular" ou URLs |
| 14. Performance | ~3s | 2 opções com descrição rica |
| 15. Formatos | ~3s | Multiple select: Instagram Feed, Reels, Stories, LinkedIn... |
| 16. **Pesquisa web** | ~90s | "Pesquisando 4 domínios de conhecimento..." (4 web searches visíveis) |
| 17. **Design visual** | ~60s | Apresentação rica com bordas, agentes numerados, pipeline visual |
| 18. **Build** | ~120s | "Construindo squad!" - gera 30 arquivos com progresso |
| 19. **Quality Report** | ~5s | Report visual com gates, contagem, formato |
| **TOTAL** | **~5-6 min** | Experiência guiada com feedback a cada 3-5s |

### Pontos fortes do OpenSquad
- ✅ Menu visual com select interativo (não texto livre)
- ✅ Auto-pesquisa da empresa via website
- ✅ Web search visível com 4 buscas explícitas
- ✅ Progresso em cada fase: "Pesquisando...", "Construindo...", "Validando..."
- ✅ Quality Report final com gates e contagem de arquivos
- ✅ 30 arquivos gerados (agents, tasks, steps, data, pipeline)
- ✅ Performance mode com descrição rica
- ✅ Investigação de perfis de referência (Sherlock)
- ✅ Cada agente tem 80-150 linhas de definição completa
- ✅ Feedback NUNCA para — algo novo a cada 3-5 segundos

### Pontos fracos do OpenSquad
- ❌ Interface CLI (terminal) — não acessível para não-técnicos
- ❌ Requer Claude Code instalado
- ❌ Sem preview visual do post
- ❌ Sem dashboard de métricas
- ❌ Sem preview Instagram/LinkedIn
- ❌ Sem comunicação visual entre agentes

---

## 2. OrbitMind (Web Chat)

### Fluxo observado (teste playwright)

| Step | Tempo | O que acontece |
|------|-------|----------------|
| 1. Chat vazio | 0s | Tela inicial com 4 atalhos |
| 2. "Criar squad" | 0.3s | Mensagem enviada |
| 3. Resposta #1 | ~5s | "Qual é o nicho ou área específica?" |
| 4. "SaaS" | ~8s | "Qual será o principal canal de atendimento?" (4 opções texto) |
| 5. "multicanal" | ~8s | "O atendimento é mais voltado para...?" (4 opções texto) |
| 6. "suporte técnico..." | ~15s | "Em qual volume/complexidade vai operar?" (3 opções texto) |
| 7. "Alto volume" | ~30s | Design: 4 agentes + pipeline textual |
| 8. "pode criar" | ~60s | **BUG: JSON cru aparecendo na tela** |
| 9. (esperando) | 60s+ | Pesquisa web + naming + design... **TRAVADO** |
| **TOTAL** | **~3-4 min** | Mas com travamentos de 30-60s sem feedback |

### Pontos fortes do OrbitMind
- ✅ Interface web bonita (dark mode, light mode)
- ✅ Dashboard de métricas com execuções, tokens, custo
- ✅ Preview de post Instagram/LinkedIn
- ✅ Comunicação visual dos agentes no pipeline
- ✅ Checkpoint system com aprovação humana
- ✅ Agendamento cron visual
- ✅ Brief de conteúdo editável na Config
- ✅ Resumo executivo com LLM
- ✅ Fontes com favicons
- ✅ Botão copiar, expandir, prévia

### Pontos fracos do OrbitMind
- ❌ **JSON cru aparece na tela** quando a LLM retorna o design
- ❌ **Travamentos de 30-60s** sem feedback visual
- ❌ **Não perguntou sobre tom** (pulou as perguntas do brief)
- ❌ **Não fez pesquisa web visível** (faz em background mas usuário não vê)
- ❌ **Sem menu interativo** — tudo é texto livre
- ❌ **Sem quality report** após criar
- ❌ **Sem contagem de arquivos** (porque não gera arquivos, salva no DB)
- ❌ **Sem investigação de referências** (Sherlock)
- ❌ **Agents com config mínimo** apesar da melhoria recente
- ❌ **Polling falha** se LLM demora mais que esperado
- ❌ **Sem indicação de tempo estimado**

---

## 3. Comparação lado-a-lado

| Aspecto | OpenSquad | OrbitMind | Vencedor |
|---------|-----------|-----------|----------|
| **Setup inicial** | Wizard completo (nome, idioma, empresa, website) | Wizard básico (5 steps) | OpenSquad |
| **Perguntas de discovery** | 6 perguntas estruturadas com opções | 4-5 perguntas texto livre | OpenSquad |
| **Pesquisa de domínio** | 4+ web searches visíveis | Background (invisível) | OpenSquad |
| **Investigação de perfis** | Sherlock com análise real | Não tem | OpenSquad |
| **Apresentação do design** | Visual rico com bordas e pipeline | Texto simples + JSON bugado | OpenSquad |
| **Quality gates** | 3 gates validados com report | Não tem | OpenSquad |
| **Feedback de progresso** | Contínuo (a cada 3-5s) | Intermitente (travamentos) | OpenSquad |
| **Tempo total** | 5-6 min | 3-4 min (mas com travamentos) | Empate |
| **Interface** | CLI (terminal) | Web (bonita) | **OrbitMind** |
| **Preview de post** | Não tem | Instagram + LinkedIn | **OrbitMind** |
| **Métricas** | Não tem | Dashboard completo | **OrbitMind** |
| **Pipeline visual** | Texto | Gráfico com steps coloridos | **OrbitMind** |
| **Checkpoint system** | Sim (CLI) | Sim (Web com UI rica) | **OrbitMind** |
| **Agendamento** | Não tem native | Cron visual | **OrbitMind** |
| **Comunicação de agentes** | Texto no terminal | Chat visual com fontes, expand | **OrbitMind** |
| **Acessibilidade** | Só devs | Qualquer pessoa | **OrbitMind** |

---

## 4. Bugs encontrados no OrbitMind durante o teste

1. **JSON cru na tela** — Quando a LLM retorna o design JSON sem o bloco ```json:squad-design```, o `extractDesignJson` não parseia e o JSON aparece como mensagem de chat
2. **Perguntas do brief incompletas** — O Arquiteto não perguntou sobre tom nem pilares (apesar de estar no prompt)
3. **Travamento de 60s** — Após "pode criar", a pesquisa web + naming levou 60s sem feedback
4. **Sem mensagem "🔍 Pesquisando..."** — A mensagem de progresso não apareceu (pode ter sido suprimida pelo fluxo)

---

## 5. Prioridades para igualar o OpenSquad

### P0 (Bloqueantes)
1. **Corrigir JSON cru na tela** — O extractDesignJson deve pegar JSON sem o bloco fenced
2. **Garantir perguntas do brief** — Tom, pilares, plataformas devem ser perguntados
3. **Mensagens de progresso visíveis** — "🔍 Pesquisando..." deve aparecer no chat

### P1 (Importantes)
4. **Quality report após criação** — "✅ Squad criado! 4 agentes, 6 etapas, pesquisa com X fontes"
5. **Design visual rico** — Pipeline visual no chat (não só texto)
6. **Perguntas com opções** — Opções numeradas clicáveis (não texto livre genérico)

### P2 (Nice to have)
7. **Auto-pesquisa da empresa** — Quando tem website, pesquisar automaticamente
8. **Investigação de perfis** — Quando usuário fornece URLs de referência
9. **Tempo estimado** — "Isso leva ~2 minutos" em operações longas
10. **Select interativo** — Em vez de texto livre, usar componentes de seleção

---

## 6. O que o OrbitMind já faz MELHOR que o OpenSquad

1. **Interface web** — Qualquer pessoa pode usar, não só devs
2. **Preview de posts** — Instagram e LinkedIn mockups visuais
3. **Pipeline visual** — Steps com cores, badges, ícones por tipo
4. **Checkpoint interativo** — Formulários de input, cards de seleção
5. **Dashboard de métricas** — Execuções, tokens, custo, duração
6. **Agendamento visual** — Presets, timezone, autonomy mode
7. **Comunicação dos agentes** — Chat com fontes, expand, resumo, copiar
8. **Brief editável** — Na aba Config, com seletor de tom visual
9. **Tema claro/escuro** — Acessibilidade visual
10. **Publicação real** — Integração com Instagram/LinkedIn APIs
