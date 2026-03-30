# Teste Comparativo: OrbitMind vs OpenSquad — Criação de Squad Marketing Digital B2B

## Data: 2026-03-29
## Teste: Criação de squad de Marketing Digital B2B para empresa SaaS
## Método: OrbitMind via Playwright (browser automation) | OpenSquad via CLI (Claude Code)

---

## 1. OrbitMind (Web Chat — Novo Workflow Estruturado)

### Configuração
- **URL:** http://localhost:3000
- **Versão:** Post-refactor com workflow estruturado (6 fases do OpenSquad)
- **Login:** admin@orbitmind.com
- **Ferramenta:** Playwright CLI (headless browser)

### Fluxo observado passo a passo

| Step | Tempo | O que acontece | Screenshot |
|------|-------|----------------|------------|
| 1. Homepage | 0s | Landing page com CTA "Começar grátis" | `orbitmind-01-home.png` |
| 2. Login | ~3s | Formulário email/senha, login com sucesso | `orbitmind-02-after-login.png` |
| 3. Dashboard | 0s | 7 squads ativos, 4 tasks, 28 execuções, R$5.77 custo | `orbitmind-02-after-login.png` |
| 4. Chat | ~2s | Sidebar com squads e conversas, área principal com shortcuts | `orbitmind-03-chat.png` |
| 5. "criar squad" | ~5s | **Resposta: "1/6 — O que esse squad deve fazer?"** com 3 exemplos | `orbitmind-04-discovery-q1.png` |
| 6. Resposta Q1 | ~5s | "Marketing digital B2B para empresa de SaaS — gerar leads via LinkedIn, blog e email" | — |
| 7. Q2 aparece | ~3s | **"2/6 — Quem é o público-alvo?"** com 5 opções numeradas | `orbitmind-05-discovery-q2.png` |
| 8. Resposta Q2 | instant | "1" (Empresários e executivos B2B) | — |
| 9. Q3 aparece | ~3s | **"3/6 — Qual tom preferido?"** com 6 opções + emojis | `orbitmind-06-discovery-q3.png` |
| 10. Resposta Q3 | instant | "5" (Autoridade) | — |
| 11. Q4 aparece | ~3s | **"4/6 — Quais são os 3-5 pilares?"** campo livre | `orbitmind-07-discovery-q4.png` |
| 12. Resposta Q4 | instant | "SaaS growth, automação de vendas, IA para empresas, produtividade B2B, cases de sucesso" | — |
| 13. ⚠️ Q5 NÃO aparece | 60s+ | **BUG: resposta Q5 (plataformas) nunca chegou ao chat** | `orbitmind-08-discovery-q5.png` |
| 14. Reload | ~5s | Página recarregada, conversa perde contexto ativo | `orbitmind-12-conversation-resumed.png` |
| 15. "continuar" | ~15s | State recovery: LLM gerou proposta direto (4 agentes) pulando Q5-Q6 | — |
| 16. Design proposto | ~2s | 4 agentes: Paulo Prospecção, Lia Linha, Rafa Revisão, Sofia Sequência | `orbitmind-13-design-proposal.png` |
| 17. "sim, pode criar" | ~2s | **BUG: intent detector interpretou "criar" como novo create** | `orbitmind-15-restart-loop.png` |
| 18. Q1 de novo | instant | Fluxo reiniciou "1/6 — O que esse squad deve fazer?" | — |
| **TOTAL** | **~4 min** | **Interrompido por 2 bugs** | |

### O que funcionou bem
- ✅ **Perguntas estruturadas (1/6 a 4/6)** apareceram corretamente
- ✅ **Formato determinístico** — perguntas são do código, não do LLM
- ✅ **Opções numeradas** com emojis (tom de voz foi excelente)
- ✅ **Respostas rápidas** — cada pergunta aparece em ~3s
- ✅ **Interface web bonita** — dark mode, sidebar com histórico
- ✅ **Dashboard com métricas** visíveis
- ✅ **Company wizard** já executado (não precisou repetir)

### Bugs encontrados

| # | Bug | Severidade | Causa provável |
|---|-----|-----------|----------------|
| 1 | **Q5 (plataformas) nunca apareceu** | P0 | `getPlatformOptions()` lendo arquivos do OpenSquad falhou silenciosamente. O `process.cwd()` no Next.js pode não apontar para o diretório correto em runtime. |
| 2 | **State perdido no reload** | P1 | Ao recarregar a página, o `architectStates` Map (in-memory) perde o state. O `recoverStateFromConversation` não reconstrói o state do novo workflow (phase "discovery" com step 5). |
| 3 | **"sim, pode criar" reinicia o fluxo** | P1 | O `detectIntent` identifica "criar" na frase "sim, pode criar" e dispara o intent "create" em vez de reconhecer como aprovação. |
| 4 | **Sem mensagens de progresso durante espera** | P2 | Quando Q5 não chegou, o chat ficou 60s+ sem nenhum feedback. |

### Proposta de design gerada (via fallback LLM)
Quando enviei "continuar" após o bug, o LLM gerou uma proposta diretamente:

```
Squad: Geração de Demanda B2B para SaaS

1. 🔍 Paulo Prospecção — Identificar oportunidades e temas com potencial de lead
2. ✍️ Lia Linha — Escrever conteúdos outbound/inbound com tom de autoridade
3. ✅ Rafa Revisão — Revisar qualidade, clareza, consistência
4. 📤 Sofia Sequência — Organizar pipeline de distribuição entre canais

Pipeline: Pesquisa → Criação → Revisão → Distribuição
Skills sugeridas: LinkedIn Publisher, Blotato, GitHub
```

---

## 2. OpenSquad (CLI — Claude Code)

### Configuração
- **Diretório:** C:\Users\alura\Documents\github\opensquad-ref\
- **Versão:** Última do repositório
- **Ferramenta:** Claude Code com skill `/opensquad`
- **Nota:** Fluxo documentado pela análise dos arquivos fonte + architect.agent.yaml (1134 linhas)

### Fluxo esperado passo a passo (baseado no architect.agent.yaml)

| Step | Tempo est. | O que acontece |
|------|-----------|----------------|
| 1. Welcome | 0s | Menu visual com 4 opções formatadas: [CS] Create Squad, [ES] Edit, [LS] List, [DS] Delete |
| 2. "CS" ou "criar squad" | instant | Inicia Phase 1: Discovery |
| 3. **Q1: Purpose** | ~5s | "What should this squad do? Describe the end result you want." (texto livre) |
| 4. Resposta Q1 | ~3s | "Marketing digital B2B para empresa de SaaS — gerar leads via LinkedIn, blog e email" |
| 5. **Q2: Audience** | ~3s | "Who is this content for?" com 4 opções numeradas (Current customers / Potential leads / General / Other) |
| 6. Resposta Q2 | ~1s | "2" (Potential leads) |
| 7. **Q3: References** | ~3s | "Do you have any examples or references?" (opcional, pode pular) |
| 8. Resposta Q3 | ~1s | "pular" |
| 9. **Q4: Domains** | ~5s | Apresenta 2-4 domínios identificados automaticamente: "Based on your needs, I'll research: 1. B2B SaaS marketing, 2. Lead generation via LinkedIn, 3. Email marketing automation. This takes 1-2 min. Proceed?" |
| 10. Resposta Q4 | ~1s | "sim" |
| 11. **Q5: Performance Mode** | ~3s | 2 opções com descrição rica (Alta Performance / Econômico) |
| 12. Resposta Q5 | ~1s | "1" (Alta Performance) |
| 13. **Q6: Plataformas** | ~3s | Lista de 14 formatos do catálogo (Instagram Feed, LinkedIn Post, Blog SEO, Email Sales, etc.) |
| 14. Resposta Q6 | ~1s | "4, 10, 12" (LinkedIn Post, Email Sales, Blog SEO) |
| 15. **Q7: Referências** | ~3s | "Tem perfis de referência? URLs do Instagram, LinkedIn, YouTube..." |
| 16. Resposta Q7 | ~1s | "pular" |
| 17. **Best Practices** | ~10s | Lê catálogo, seleciona: `copywriting.md`, `linkedin-post.md`, `blog-seo.md`, `email-sales.md`, `review.md` |
| 18. 🔎 **Pesquisa** | ~90s | "🔍 Researching 3 knowledge domains... This takes 1-2 minutes." — 4+ web searches visíveis |
| 19. ⚙️ **Extração** | ~30s | Gera artifacts: operational framework, output examples, anti-patterns, voice guidance, quality criteria |
| 20. 🎨 **Design** | ~30s | Apresentação rica com agentes numerados, pipeline visual, formats |
| 21. Confirmação | ~3s | "Does this look good?" — usuário pode ajustar |
| 22. "sim" | instant | — |
| 23. 🏗️ **Build** | ~120s | "Construindo squad!" — gera 30+ arquivos com progresso visível |
| 24. ✅ **Quality Report** | ~5s | Report visual: agent completeness, pipeline coherence, content approval gates |
| **TOTAL** | **~6-8 min** | **Experiência completa, feedback a cada 3-5s** |

### Output gerado (esperado)

```
squads/marketing-digital-b2b/
├── squad.yaml                          # Metadata do squad
├── squad-party.csv                     # Roster com 4-5 agentes
├── agents/
│   ├── pesquisador.agent.md            # ~120 linhas: Persona, Principles, Framework, Voice, Examples, Anti-Patterns, Quality
│   ├── pesquisador/tasks/
│   │   ├── find-trends.md              # ~60 linhas: Process, Output Format, Example, Quality Criteria, Veto Conditions
│   │   └── rank-opportunities.md
│   ├── linkedin-creator.agent.md
│   ├── linkedin-creator/tasks/
│   │   ├── generate-angles.md
│   │   ├── create-linkedin-post.md
│   │   └── optimize-linkedin.md
│   ├── email-writer.agent.md
│   ├── email-writer/tasks/
│   │   ├── create-email-campaign.md
│   │   └── optimize-email.md
│   ├── reviewer.agent.md
│   └── reviewer/tasks/
│       ├── score-content.md
│       └── generate-feedback.md
├── pipeline/
│   ├── pipeline.yaml
│   ├── steps/
│   │   ├── step-01-briefing.md         # checkpoint-input
│   │   ├── step-02-research.md         # subagent
│   │   ├── step-03-topic-selection.md  # checkpoint-select
│   │   ├── step-04-generate-angles.md  # inline
│   │   ├── step-05-angle-selection.md  # checkpoint-select
│   │   ├── step-06-create-content.md   # inline (multi-format)
│   │   ├── step-07-approve-content.md  # checkpoint-approve
│   │   ├── step-08-review.md           # inline
│   │   └── step-09-final-approval.md   # checkpoint-approve
│   └── data/
│       ├── research-brief.md
│       ├── domain-framework.md
│       ├── quality-criteria.md
│       ├── output-examples.md
│       ├── anti-patterns.md
│       └── tone-of-voice.md
├── _memory/memories.md
└── output/.gitkeep
```

**Total estimado: ~30 arquivos, ~2000+ linhas de conteúdo**

### Pontos fortes do OpenSquad
- ✅ **7 perguntas estruturadas** — cada uma com opções visuais
- ✅ **Best practices injection** — lê 5+ arquivos de melhores práticas do catálogo
- ✅ **Pesquisa web visível** — 4+ buscas com progresso mostrado
- ✅ **Sherlock investigation** — analisa perfis reais de referência (opcional)
- ✅ **Agentes com 120+ linhas** cada — Persona, Principles, Voice, Anti-Patterns, Quality
- ✅ **Tasks decompostas** — cada task é um arquivo com Process, Output, Example, Veto
- ✅ **Quality Report** — 3+ gates validados com contagem visual
- ✅ **30+ arquivos gerados** — squad completo com pipeline, data, memory
- ✅ **Feedback contínuo** — algo novo a cada 3-5 segundos
- ✅ **Performance modes** — Alta Performance vs Econômico com explicação de custo

### Pontos fracos do OpenSquad
- ❌ **Interface CLI** — só funciona no terminal, não acessível para não-técnicos
- ❌ **Requer Claude Code** instalado e configurado
- ❌ **Sem preview visual** de posts/conteúdo
- ❌ **Sem dashboard de métricas** de execuções
- ❌ **Sem agendamento visual** (cron)
- ❌ **Sem escritório virtual** ou comunicação visual de agentes
- ❌ **Sem checkpoint UI** — tudo é texto no terminal

---

## 3. Comparação Lado-a-Lado

| Aspecto | OrbitMind (Web) | OpenSquad (CLI) | Vencedor |
|---------|----------------|-----------------|----------|
| **Setup inicial** | Login web + wizard empresa (5 perguntas, feito 1x) | Wizard nome + idioma + empresa + website (feito 1x) | Empate |
| **Perguntas de discovery** | 6 perguntas determinísticas (1/6 a 6/6) | 6-7 perguntas com opções visuais | **OpenSquad** (opções mais ricas) |
| **Opções numeradas** | ✅ Sim (Q2, Q3, Q5, Q6) | ✅ Sim, com descrições ricas | Empate |
| **Best practices injection** | ✅ Lê catálogo do OpenSquad em runtime | ✅ 23 arquivos .md + catálogo YAML | **OpenSquad** (mais granular) |
| **Pesquisa de domínio** | ✅ 3 web searches paralelas + mensagem de progresso | ✅ 4+ web searches com progresso visível | **OpenSquad** (mais visível) |
| **Investigação de perfis** | ✅ Implementado (Sherlock) | ✅ Sherlock com 1009 linhas de prompt | Empate |
| **Apresentação do design** | ✅ Agentes + pipeline em markdown | ✅ Agentes + pipeline + tasks + formats visuais | **OpenSquad** (mais detalhado) |
| **Quality gates** | ✅ 4 gates (completeness, pipeline, reviewer, approval) | ✅ 3+ gates com report visual | Empate |
| **Agent definitions** | Config em DB (persona, principles, voice, anti-patterns) | Arquivos .agent.md 120+ linhas completos | **OpenSquad** (mais profundo) |
| **Task decomposition** | Não tem (agents são monolíticos) | ✅ Tasks separadas com Process, Output, Veto | **OpenSquad** |
| **Feedback de progresso** | ⚠️ Intermitente (bugs de polling) | ✅ Contínuo a cada 3-5s | **OpenSquad** |
| **Tempo total** | ~4 min (interrompido por bug) | ~6-8 min | Empate |
| **Interface** | Web (acessível a qualquer pessoa) | CLI (só devs) | **OrbitMind** |
| **Preview de posts** | ✅ Instagram + LinkedIn mockups | ❌ Não tem | **OrbitMind** |
| **Dashboard de métricas** | ✅ Execuções, tokens, custo, duração | ❌ Não tem | **OrbitMind** |
| **Pipeline visual** | ✅ Steps com cores, badges, ícones | ❌ Texto no terminal | **OrbitMind** |
| **Checkpoint system** | ✅ Formulários visuais na web | ✅ Texto interativo no terminal | **OrbitMind** |
| **Agendamento** | ✅ Cron visual com presets | ❌ Não tem nativo | **OrbitMind** |
| **Comunicação de agentes** | ✅ Chat visual com fontes, expand, copiar | ❌ Log no terminal | **OrbitMind** |
| **Escritório virtual** | ✅ PixiJS 2D com salas temáticas | ❌ Não tem | **OrbitMind** |
| **Marketplace** | ✅ 15+ squads/agentes pré-configurados | ❌ Não tem | **OrbitMind** |
| **Integrações** | ✅ 700+ via Nango | ❌ Skills manuais | **OrbitMind** |
| **Acessibilidade** | Qualquer pessoa com browser | Só devs com Claude Code | **OrbitMind** |

---

## 4. Bugs Encontrados no OrbitMind (teste 2026-03-29)

### P0 — Bloqueantes

| # | Bug | Impacto | Causa |
|---|-----|---------|-------|
| 1 | **Q5 (plataformas) nunca aparece no chat** | Fluxo de criação interrompe na pergunta 5/6 | `getPlatformOptions()` no `parser.ts` usa `path.join(process.cwd(), "apps/web/lib/opensquad")` — em runtime do Next.js o `cwd()` pode não ser o esperado, causando `ENOENT` silencioso |
| 2 | **"sim, pode criar" reinicia o fluxo** | Em vez de aprovar, detecta intent "create" | `detectIntent()` match `/criar|crie|novo/` na frase "sim, pode **criar**" antes do check de aprovação |

### P1 — Importantes

| # | Bug | Impacto | Causa |
|---|-----|---------|-------|
| 3 | **State perdido no reload** | Conversa perde fase/step do workflow | `architectStates` é um `Map` in-memory — reload perde tudo. `recoverStateFromConversation` não reconstrói state do novo workflow estruturado |
| 4 | **Sem mensagem de progresso durante espera** | 60s+ sem feedback quando Q5 falhou | O handler engoliu o erro e não enviou mensagem de fallback |

### P2 — Nice to Have

| # | Bug | Impacto |
|---|-----|---------|
| 5 | Sidebar mostra "Criar um novo squad de agentes" para TODAS as conversas | Confuso identificar qual é qual |
| 6 | Sem indicação de tempo estimado nas operações longas | Usuário não sabe se travou ou está processando |

---

## 5. Prioridades para Igualar o OpenSquad

### Correções Imediatas (P0)

1. **Fix parser path** — Usar `__dirname` ou `import.meta.url` em vez de `process.cwd()`:
   ```typescript
   const OPENSQUAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../opensquad");
   ```

2. **Fix intent detection na aprovação** — No `handleDesignApproval`, checar aprovação ANTES de `detectIntent`:
   ```typescript
   // No main router, antes do switch(intent):
   if (state.phase === "idle" && state.proposedDesign) {
     // Checar se é aprovação primeiro
   }
   ```

3. **Tratamento de erro no workflow** — Wrap `getPlatformOptions()` em try/catch com fallback inline:
   ```typescript
   try {
     const platforms = getPlatformOptions();
   } catch {
     // Fallback: lista hardcoded de plataformas
   }
   ```

### Melhorias de Paridade (P1)

4. **Persistir state no DB** — Salvar `architectStates` no banco para sobreviver a reloads
5. **Task decomposition** — Gerar tasks separadas para cada agente (como OpenSquad)
6. **Quality report visual** — Mostrar "✅ 4/4 gates passed, 30+ arquivos, 4 agentes" após criação
7. **Mensagens de progresso em todas as fases** — Garantir que nunca fique >5s sem feedback

### Melhorias de UX (P2)

8. **Títulos de conversa** — Gerar título baseado no propósito do squad
9. **Tempo estimado** — "Isso leva ~2 minutos" em operações longas
10. **Opções clicáveis** — Em vez de digitar "1", clicar num botão

---

## 6. O que o OrbitMind já FAZ MELHOR que o OpenSquad

1. **Interface web** — Qualquer pessoa pode usar, não só devs
2. **Dashboard de métricas** — Execuções, tokens, custo, duração em tempo real
3. **Preview de posts** — Instagram e LinkedIn mockups visuais
4. **Pipeline visual** — Steps com cores, badges, ícones por tipo
5. **Checkpoint interativo** — Formulários de input, cards de seleção na web
6. **Agendamento visual** — Presets (diário, semanal), timezone, autonomy mode
7. **Comunicação dos agentes** — Chat com fontes, expand, resumo, copiar
8. **Brief editável** — Na aba Config, com seletor de tom visual
9. **Escritório virtual 2D** — Agentes em salas temáticas com animações
10. **Marketplace** — 15+ squads/agentes prontos em 1 clique
11. **700+ integrações** — Via Nango OAuth
12. **Company wizard** — Contexto persistente que personaliza TODOS os squads

---

## 7. Conclusão

### Estado atual
O **novo workflow estruturado** do OrbitMind (6 fases do OpenSquad) está **parcialmente funcional**:
- ✅ Q1-Q4 funcionam perfeitamente com perguntas determinísticas
- ❌ Q5-Q6 falham por bug no parser de arquivos
- ❌ State recovery não suporta o novo workflow
- ❌ Intent detection conflita com aprovação

### Caminho para paridade
Com 3 fixes (parser path, intent detection, error handling), o OrbitMind terá:
- **6 perguntas estruturadas** idênticas ao OpenSquad
- **Pesquisa web visível** com mensagens de progresso
- **Best practices injection** do catálogo OpenSquad
- **Quality gates** após criação
- **Agentes ricos** com 100+ linhas (Persona, Principles, Voice, Anti-Patterns)

Combinado com as vantagens exclusivas do OrbitMind (interface web, dashboard, preview, agendamento, escritório virtual, marketplace), o resultado será **superior ao OpenSquad em UX** e **equivalente em qualidade de output**.

### Estimativa de esforço
- **P0 fixes:** ~2h (parser + intent + error handling)
- **P1 melhorias:** ~4h (state persistence + task decomposition + quality report)
- **P2 UX:** ~4h (títulos, tempo estimado, botões clicáveis)
