# Auditoria OrbitMind + mapeamento de Squads da Adalink — 2026-09-30

Varredura somente leitura de `orbitmind-platform`, `adalink-platform` (backend `apps/agents-service`) e `Adalink-Agents-Pipeline` (front `apps/web`).
`pnpm typecheck` passa nos 4 pacotes — os bugs abaixo não aparecem no `tsc` por causa de casts `as` e tipagem estrutural.

Legenda de severidade: 🔴 crítico · 🟠 alto · 🟡 médio · ⚪ baixo. Tudo com `arquivo:linha` foi lido no código; "suspeita" = não confirmado.

---

## Parte 1 — Navegação lenta (meta: instantânea em todas as telas)

### Causa raiz
8 das 14 rotas do dashboard são `"use client"` inteiras e buscam dados em `useEffect`. Cada clique vira:
spinner do `(dashboard)/loading.tsx` → download do chunk → mount → `fetch /api/*` (cada rota refaz `auth()` + DB) → **segundo spinner** (`PageLoader`). E nada fica em cache entre navegações.

| Rota | Tipo | Fonte de dados | Veredito |
|---|---|---|---|
| /dashboard | Server | 8 queries em `Promise.all`, `unstable_cache` 30s | Rápido |
| /squads | Server | `getSquadsByOrgId` (GROUP BY global) | Rápido/médio |
| /squads/[id] | Server + abas client | 2 queries em série + JSONB pesado; abas com waterfall + polling | Médio |
| /orcamentos, /help | Server | — | Rápido |
| /squads/new | redirect → /chat | — | Lento (hop extra) |
| /agents | Client | `/api/squads` + `/api/agents` em useEffect | Lento |
| /board | Client | waterfall squads → tasks + agents | Lento |
| /chat | Client | 2 fetches + subquery correlacionada + react-markdown estático | Lento |
| /marketplace | Client | 2 fetches | Lento |
| /settings | Client | 3 fetches + fetch por aba | Lento |
| /integrations | Client | catálogo Nango 700+ providers por visita | Lento |
| /pipeline | Client | 3 + 2N chamadas **seriais** ao GitHub via Nango, sem cache | Muito lento |
| /office | Client | 2 `dynamic()` aninhados, HDR de CDN, waterfall squads → agents | Muito lento |

### 🔴 Críticos
- **C1. Páginas client com fetch em useEffect** — `agents/page.tsx:52-62`, `board/page.tsx:40-56`, `chat/page.tsx:85-87`, `marketplace/page.tsx:46-51`, `settings/page.tsx:81-101`, `pipeline/page.tsx:70-72`, `integrations/page.tsx:66-76`, `office/hooks/use-office-state.ts:98-116`.
  **Correção:** `page.tsx` vira Server Component que chama as queries de `lib/db/queries` em `Promise.all` e passa props para um filho `"use client"` só com a parte interativa. `loading.tsx` com skeleton por rota.
- **C2. /pipeline** — `lib/integrations/actions/github.ts:227-305` faz `getFileContent` um por vez dentro de `for`. Recarrega tudo após toggle/trigger.
  **Correção:** listagem só com metadados, YAML sob demanda no editor, `Promise.all` com limite, `unstable_cache` por org.

### 🟠 Altos
- **A1. Sem cache de navegação** — `next.config.ts` sem `experimental.staleTimes`; no Next 15 o default dinâmico é 0s. **Correção:** `staleTimes: { dynamic: 30, static: 180 }`.
- **A2. Dev sem Turbopack** — `package.json` `"dev": "next dev"`. Primeira visita compila sob demanda. Usar `--turbopack` e medir sempre em `next build && next start`.
- **A3. onborda + framer-motion em todas as rotas** — `(dashboard)/layout.tsx:24` → `onboarding-provider.tsx:4`, que ainda faz `fetch /api/organizations` a cada load. **Correção:** ler `onboardingCompleted` no layout (server) e `next/dynamic` do tour só quando necessário.
- **A4. SessionProvider global** — `app/layout.tsx:29` sem prop `session` → GET `/api/auth/session` no mount e a cada foco. Único consumidor: `top-bar.tsx:18`. **Correção:** passar nome/email como props e remover o provider.
- **A5. Reload completo em vez de navegação SPA** — `marketplace/page.tsx:77`, `pipeline/page.tsx:116,149,172`, `chat-panel.tsx:197`, `squad-actions.tsx:46` (`location.reload`), `top-bar.tsx:63` (`<a href>`). Trocar por `<Link>` / `router.push` / `router.refresh`.
- **A6. Timers nunca cancelados** — `chat/page.tsx:171`, `chat-panel.tsx:163,187`, `pipeline-section.tsx:113-125` (polling infinito também em `waiting_approval`). Continuam disparando depois de sair da tela.
- **A7. /chat** — `message-bubble.tsx:3-4` importa react-markdown estático; `listArchitectConversations` (`messages.ts:54-75`) usa subquery correlacionada sobre `metadata->>'conversationId'` sem índice.
- **A8. /office** — `office-scene.tsx:75` `<Environment preset="night">` baixa HDR externo (canvas preto até terminar); reflector 1024 + shadow 2048 + bloom + 2000 stars.
- **A9. /integrations** — catálogo Nango com cache só em memória e sem cache negativo; centenas de `<img>` sem lazy.

### 🟡 Médios
- `revalidate = 30` inócuo em `dashboard`, `squads`, `squads/[id]` (o layout chama `auth()` → rota sempre dinâmica).
- `layout.tsx:15-19` conta orçamentos a cada render para admins, sem cache.
- `lib/db/queries/squads.ts:22-29` faz `GROUP BY` em **todos** os agents/tasks do banco (sem filtro de org).
- `select()` completo com `config`/`inputData`/`outputData` JSONB onde só se usa id/nome/somas (`squads.ts:14`, `executions.ts:12-18`).
- Índices compostos faltando: `executions(squad_id, started_at desc)`, `executions(squad_id, run_id)`, `messages(squad_id, created_at desc)` + expressão `metadata->>'conversationId'`, `audit_logs(org_id, created_at desc)`.
- `lib/db/index.ts` sem singleton em `globalThis` (pools extras no HMR).

### Ordem de ataque
1. C1 (RSC + `Promise.all`) → 2. A1 (`staleTimes`) → 3. C2 → 4. A3/A4 → 5. A5/A6 → 6. queries e índices → 7. medir em build de produção.

---

## Parte 2 — Funcionalidades que jamais funcionariam

### Engine / pipeline
1. 🔴 **Veto conditions, review loop, paralelo, `dependsOn`, `checkpoint-select` estão mortos.** O Zod usa snake_case (`packages/shared/src/validators.ts:52-84`: `veto_conditions`, `depends_on`, `parallel_with`, `on_reject`, `source_step_id`) e o runner lê camelCase (`packages/engine/src/pipeline.ts:114,148,156,190,220`). Sempre `undefined`.
2. 🔴 **Falha e cancelamento gravados como "completed".** `runner.run()` retorna `stateMachine.fail()` sem lançar (`pipeline.ts:234-237`) e a rota grava `status: "completed"` (`api/squads/[squadId]/run/route.ts:209`; idem cron). Rejeitar checkpoint → "cancelled" → sobrescrito para "completed".
3. 🔴 **`runId` é timestamp de segundo** (`pipeline.ts:91`) e `updatePipelineRun`/`saveStepOutput` filtram só por `runId` → runs simultâneos (até de orgs diferentes) se sobrescrevem.
4. 🟠 **Modo task chain inalcançável** — `agentDefinitions = undefined` em todas as rotas (`run/route.ts:188`, `cron/route.ts:229`, `v1/.../run/route.ts:172`).
5. 🟠 **Squads do marketplace executam 0 steps e terminam "completed"** — pipeline do seed sem `agentId` (`lib/db/seed.ts:391-396`) e o runner pula steps sem agente (`pipeline.ts:169`).
6. 🟠 **Eventos async não aguardados** — `onStepStart/onStepComplete` são async mas tipados como `void`; execução pode ficar "running" para sempre.
7. 🟠 **Skills de publicação nunca chegam ao LLM** — Arquiteto grava `instagram_publisher` (underscore, `architect-workflow.ts:91-97`), registry usa `instagram-publisher` (`skill-registry.ts`); e as rotas passam `skillConfigs = {}`. Instagram/LinkedIn/Canva/Blotato/Apify sempre "não configurado".
8. 🟡 **Budget, PipelineLogger, AuditLogger, IntegrationHooks, Sherlock** exportados e nunca usados. `pipeline_logs`, `content_analytics`, `investigations` nunca recebem escrita. O Sherlock passa só a URL ao LLM (resultado alucinado).

### Execução em produção
9. 🔴 **Fire-and-forget em route handlers** — `void (async…)` em `run/route.ts:206`, cron, v1, chat, architect. Na Vercel o processo congela após a resposta e o pipeline morre. Sem fila, sem `after()`, sem `maxDuration`.
10. 🔴 **Checkpoint em memória** — Promise num `Map` em `globalThis` (`lib/engine/checkpoint-manager.ts:16-31`). Não sobrevive a restart nem a mais de uma instância.
11. 🔴 **Agendamentos nunca disparam** — POST não calcula `nextRunAt` (`schedules/route.ts:41`) e o cron filtra `lte(nextRunAt, now)`; `/api/cron` não é pública no middleware; só exporta POST com `x-cron-secret` (Vercel Cron manda GET + Bearer); não existe `vercel.json`.
12. 🔴 **WebSocket não funciona em nenhum modo** — `pnpm dev` não sobe `server.ts`; `use-squad-socket.ts:31` envia literal `token=session`; o Escritório conecta sem token e é derrubado; ninguém emite `HANDOFF_START`/`STEP_CHANGE` (`onStateChange: () => {}`). Suspeita forte: `wsManager` importado nas rotas é outra instância com zero clientes.
13. 🟠 **API pública `/api/v1/squads/{id}/run` inalcançável** — middleware redireciona para `/login`; não há UI/rota para criar API tokens; `input` descartado; checkpoints autoaprovados.

### Banco
14. 🔴 **Migration defasada** — `0000_third_red_skull.sql` não cria `pipeline_runs`, `quote_requests` nem seus enums; `llm_providers` tem colunas NOT NULL que não existem no schema. Com `db:migrate` quebram pipeline, checkpoints, Orçamentos, layout de admin e criação de provider. Só `db:push` funciona.

### Integrações
15. 🔴 **Nango com `connectionId = orgId`** (`github-helpers.ts:23`, `actions/route.ts:40`, `github-sync.ts:38`) enquanto o Connect UI gera outro id e o front descarta o payload (`integrations/page.tsx:109-125`). Toda chamada real falha — e `request()` nunca lança, então a UI reporta sucesso.
16. 🟠 38 de 39 classes "premium" são código morto; ~20 `fetchOptions` apontam para rotas inexistentes.
17. 🟠 Webhooks resolvem org por `payload.orbitmind_org_id` (nenhum provider envia); nenhum webhook é registrado; Slack/Jira/Linear são stubs; Slack manda form-urlencoded e quebra o `JSON.parse`.
18. ⚪ `/api/inngest` é stub 410 (Inngest não é dependência).

### Auth, UI e CLI
19. 🔴 **Login com GitHub quebra o app** — sem adapter nem criação de org → `orgId = ""` → toda query dá 500.
20. 🟠 Convidar membro: senha temporária nunca devolvida/enviada; botão sem `onClick` (`settings/page.tsx:192`).
21. 🟠 Botões mortos: "Nova Task" (`board/page.tsx:99`), "Deletar Organização", "Upgrade", "3/100 execuções" fixo (`app-sidebar.tsx:116`), anexo do chat, `AngleSelector`/`ToneSelector`/Aprovar-Editar-Rejeitar do chat (dependem de `metadata.type` que ninguém produz), imagens do checkpoint nunca enviadas (`checkpoint-review.tsx:52`).
22. 🟠 Status do agente nunca muda no banco; o Escritório mostra status/handoff de **demonstração** (`use-office-state.ts:31-33,71-87`).
23. 🟡 i18n inexistente (`next-intl` instalado, `locales/*.json` sem uso).
24. 🟡 CLI sem entrypoint (`bin` → `dist/index.js`, não há `src/index.ts`); `deploy` stub; porta default 5432 vs docker 5434.

### Outros bugs
- 🟠 Estado global `_currentConversationId` no Arquiteto (`architect-handler.ts:147`) — concorrência mistura conversas.
- 🟠 Primeira mensagem ao Arquiteto sem seed: FK falha antes de `ensureArchitectSquad`; o squad fica pertencendo à primeira org.
- 🟠 `modelTier` ignorado (`gateway-client.ts:166`: `defaultModel` sempre vence).
- 🟠 Polling do chat trava com ≥ 50 mensagens (`chat-panel.tsx:180` vs limite 50).
- 🟠 Re-adquirir squad do marketplace → 500 por `squads_org_code_idx`.
- 🟡 Middleware responde redirect HTML para `/api/*` sem cookie (front quebra no `.json()`).
- 🟡 Board: só 1º squad, sem coluna "blocked", PATCH a cada tecla, desatribuir não persiste.
- 🟡 `NEXTAUTH_SECRET` reutilizado como chave de criptografia com salt fixo (`lib/crypto.ts`).
- ⚪ `CLAUDE.md` diz PixiJS; o código usa React Three Fiber.

---

## Parte 3 — Segurança (multi-tenant)

🔴 **IDOR generalizado** — exigem login mas não checam `squad.orgId === session.orgId`:
`squads/[squadId]` PATCH/DELETE · `squads/[squadId]/agents` · `tasks` e `tasks/[taskId]` · `chat` e `chat/[squadId]` · `memories` · `pipeline-run` · `runs` e `runs/[runId]` · `schedules` (o cron depois executa squad alheio) · `marketplace/[itemId]/acquire` · `integrations/[integrationId]` e `/actions` e `/test`.

🔴 **Conversas do Arquiteto compartilhadas entre todas as orgs** — squad fixo `…a0c41ec70001`; `history?list=true` lista tudo (`history/route.ts:19-21`). Provável escalonamento: o snapshot restaura o `orgId` gravado (`architect-handler.ts:437-452`), então postar com o `conversationId` de outra org age na org da vítima.

🔴 **Webhook público** — HMAC só se existir `config.webhookSecret` (ninguém grava); org vem do corpo.

🟠 `/api/integrations/[id]/test` cai para listar conexões de todo o ambiente Nango e usa token de outro tenant; loga credenciais.
🟠 SSRF: `web_fetch` sem allowlist/bloqueio de IP interno (`tool-executor.ts:186`); `images.remotePatterns: "**"` = proxy aberto.
🟠 RBAC praticamente inexistente (viewer roda pipeline e apaga squad).
🟡 Suspeita de XSS em `simpleMarkdown` + `dangerouslySetInnerHTML` (`pipeline-chat.tsx:399`, `checkpoint-review.tsx:440`).

---

## Parte 4 — O que a Adalink avançou em Squads

### Decisão estruturante
Na Adalink, **squad = workflow**: `AgentWorkflow` com `kind=SQUAD` rodando no mesmo motor de DAG que processos (`kind=WORKFLOW`) e agentes autônomos (`kind=AGENT`). No OrbitMind o pipeline é uma lista linear em `squads.config` — é daí que vem a maior parte do gap.

### Backend — `adalink-platform/apps/agents-service` (AS)

| Capacidade | Como funciona | Referência |
|---|---|---|
| **Grafo DAG** | Nós `TRIGGER, AGENT, ROUTER, CONDITION, ACTION, DELAY, LOOP, PARALLEL, END, APPROVAL` + arestas com `sourceHandle`/`condition`/`label`. Ordem topológica (Kahn), poda de branch por decisão, join. Execução sequencial; paralelismo real só dentro de `PARALLEL` (máx. 5 concorrentes). | `application/execution/workflow-graph.ts`, `workflow-branching.ts`, `executors/*` |
| **Contexto entre agentes** | `state[nodeId]` + alias pelo label normalizado; templates `{{alias.campo}}` restritos a ancestrais; `state` com `Object.create(null)` (anti `__proto__`). | `template-resolver.ts`, `domain/workflows/label-alias.ts` |
| **Validação de publish** | `validateProcess` puro: agente sem `agentId`, conector sem operação, parâmetro obrigatório vazio, variável apontando para não-ancestral, schedule inválido, ciclo (incl. sub-grafos). `error` bloqueia (422), `warning` só loga. `validate-draft` sempre 200 com issues + resumo. | `domain/workflows/validate-process.ts`, `workflow-publish-guard.service.ts` |
| **Ciclo de run** | `PENDING → RUNNING → COMPLETED/FAILED/CANCELLED/PAUSED`; `controlSignal` PAUSE/CANCEL cooperativo lido antes de cada step; `checkpoint` jsonb para retomar; `pauseReason` MANUAL/CHECKPOINT. | `control-workflow-run.use-case.ts`, `prisma-workflow-run.repository.ts` |
| **Aprovação humana** | Nó `APPROVAL` ou `config.checkpoint=true` pausa. Ações: aprovar (resume), rejeitar (segue aresta "rejeitado"; sem ela → FAILED), **devolver a um agente** com feedback (rebobina por BFS; 409 se houver nó não-AGENT no trecho; pausa de novo). | `approval-node.executor.ts`, `workflow-runs.controller.ts` |
| **Cost-guards** | Por squad: `maxCreditsPerRun`, `maxStepsPerRun`, kill-switch, loop detectado (mesma aresta ≥ 5). ⚠️ Na Adalink crédito e loop estão **inertes** (nenhum executor preenche `creditsSpent`; `maxEdgeRepeats` nunca atualiza) e `killSwitchEnabled=false` é que mata — nome invertido. | `domain/squads/squad-cost-guard.ts` |
| **Parada de emergência** | Pausa todos os runs ativos de squads da org em lotes de 15. | `emergency-stop-squads.use-case.ts` |
| **Durabilidade** | Heartbeat (`lastHeartbeatAt`, 60s) + reaper a cada 5 min (never_started / unresponsive) + aviso de falha ao dono deduplicado por dia + clamp de duração INT4. Dispatch Trigger.dev com idempotency key e fallback in-process. | `reap-stalled-runs.use-case.ts`, `notify-failed-workflow-runs.use-case.ts`, `trigger-dev-workflow-run.dispatcher.ts` |
| **Triggers** | MANUAL, dry-run (sem efeitos colaterais, fora das métricas), SCHEDULE (once/cron/interval com timezone IANA e reconciliação `pending:`), WEBHOOK (HMAC `timingSafeEqual`), EVENT (fan-out por `EventSubscription`), GitHub (`X-Hub-Signature-256` + normalizador, sempre 200), CHANNEL_MESSAGE (WhatsApp). | `schedule-trigger-config.ts`, `webhooks-github/*` |
| **Copiloto do Arquiteto** | Briefing → 2 chamadas LLM (reasoner em markdown + `generateObject` com Zod) → plano DRAFT (1–8 agentes com tier LIGHT/DEEP, conectores com `connected` calculado no servidor, custo determinístico LIGHT=15/DEEP=60/+10) → editar por patch **ou** follow-up → aprovar com claim atômico (`UPDATE … WHERE status='DRAFT'`) cria TRIGGER → agentes → END; reaproveita agentes da biblioteca por nome. | `architecture-plan.use-case.ts`, `squad-architecture-plan-generator.service.ts`, `domain/squads/squad-architecture-plan.ts` |
| **Colaboração entre agentes** | Timeline com `body` integral (≤ 8000), `agentId`, `toAgentId`, `threadId`; eventos AG-UI `Message/Handoff/Ask/Reply`; tool `ask_agent` síncrona (máx. 5 por run, profundidade 3, DLP antes de gravar). | `ag-ui-event.ts`, `ask-agent.tool.ts`, `mastra-inline-agent-node.invoker.ts` |
| **Tier DEEP** | Claude Agent SDK em sandbox efêmero (E2B default, Vercel alternativo), `git clone` com `GIT_ASKPASS`, validação anti-injeção de repo/ref/dir. LOOP `retryUntilGreen` (até 20 tentativas). Template `dev-pipeline`: issue → implementar → branch → PR → auto-fix até CI verde → revisão humana → merge → docs → release. | `squads/sandbox/*`, `sandbox-deep-agent-node.invoker.ts`, `loop-node.executor.ts` |
| **Templates** | 7 templates por domínio (dev, marketing, RH, CS, projetos, financeiro, CS-WhatsApp) com `connectorSteps` data-driven; 13 domínios (12 + CUSTOM). | `domain/squads/squad-templates.catalog.ts` |
| **Marketplace** | Publicar/despublicar squad; instalar = clonar grafo (descarta `agentId`/`connectionId` da org de origem). Provisionamento pago idempotente por `${orgId}:${productId}`. ⚠️ Sem versionamento (clone congelado) e refund não desprovisiona. | `squad-management.use-case.ts`, `marketplace-provision/*` |
| **Grants por agente** | `accessLevel` NONE/READ/READ_WRITE por conector (READ filtra tools com efeito colateral); `PendingAction` para ações sensíveis (params cifrados, TTL, transição atômica). | `get-autonomous-agent-tools.use-case.ts`, `connector-approval-gate.service.ts` |
| **Persona** | `personaColor`, `personaTrait`, `personaRegister` no agente. | `schema.prisma` l.336-346 |

### Front — `Adalink-Agents-Pipeline/apps/web/src/features/squads`

- **Hub `/squads`** com 6 abas em `?tab=` (minhas squads, agentes, execuções, agendamento, integrações, configurações); hero com stats reais e "colaboração ao vivo" vindos de **um único** `GET /v1/squads/overview` (substituiu 25 requests).
- **Wizard** em branco ou template; **galeria de templates** com preview.
- **Detalhe**: hub de composição (agentes na ordem do grafo, persona, badge de tier), cost-guards editáveis (admin), publicar no marketplace, zona de perigo.
- **Timeline da run** (`squad-run-timeline.tsx`, 818 linhas) com 3 modos — Timeline 2D, Colunas (swimlane por agente), Grafo — e `aggregateAgUi` puro; badge Reply↔Ask por `threadId`.
- **Banner de aprovação** com aprovar / rejeitar com motivo / devolver a agente com feedback obrigatório.
- **Copiloto** em modal (request/response, sem streaming), plan card com "Conectar" inline via Nango.
- **Builder** `@xyflow/react` com catálogo de nós, undo/redo 50 níveis, validação de publish. ⚠️ Sem painel de config por nó no builder legado — o canvas de "processos" tem (`step-config-panel.tsx`).
- **Agendamento** cron com presets e `describeCron`; webhooks com rotacionar secret. A versão mais madura é `features/processos/lib/schedule-trigger-config.ts` (once/cron/interval).
- **Real-time = polling** (TanStack Query, 2–3s, para no estado terminal). Não há WS/SSE para runs.
- 53 arquivos de teste + seção 9 do `.claude/skills/regression-test/SKILL.md` documentam as regras de negócio.

### Onde o OrbitMind pode superar a Adalink
- Streaming do plano do Arquiteto (lá é request/response).
- Real-time de verdade (lá é polling) — desde que o WS seja consertado ou trocado por SSE.
- Cost-guards que funcionam (lá crédito e loop estão inertes).
- Timeout em runs pausados em aprovação (lá ficam PAUSED para sempre).
- Versionamento de squad publicada (lá o `version` é ornamental).
- Editar squad existente pelo Copiloto (lá foi removido porque duplicava).

---

## Parte 5 — Plano de portabilidade para o OrbitMind

Stack alvo: Next.js 15 App Router + Server Actions + Drizzle, motor em `packages/engine`. Sem NestJS/Prisma/Trigger.dev obrigatório.

### Fase 0 — Pré-requisitos (antes de portar qualquer coisa)
| # | Item | Esforço |
|---|---|---|
| 0.1 | Corrigir IDOR: helper `assertSquadInOrg(squadId, orgId)` em todas as rotas listadas na Parte 3; separar conversas do Arquiteto por org | M |
| 0.2 | Regenerar migrations a partir do schema atual | P |
| 0.3 | Decidir o runtime de execução: worker long-lived (Render/Railway + `server.ts`) **ou** fila durável (pg-boss / Trigger.dev / Inngest). Fire-and-forget em route handler não serve | M |
| 0.4 | Performance: Parte 1, itens C1 + A1 + A3/A4/A5/A6 | M |

### Fase 1 — Motor
| # | Item | Esforço | Fonte |
|---|---|---|---|
| 1.1 | Schema Drizzle do DAG: `squad_nodes`, `squad_edges`; `squads` ganha `status draft`, `domain`, `trigger_type/config`, cost-guards; `pipeline_runs` ganha `control_signal`, `pause_reason`, `paused_at_node_id`, `checkpoint jsonb`, `credits_spent`, `last_heartbeat_at`; `runId` vira UUID | M | `schema.prisma` l.602-1192, l.2829 |
| 1.2 | `validateProcess` + `assertAcyclic` puros em `packages/engine`; publicar = Server Action que valida e só então ativa | M | `validate-process.ts`, `workflow-publish-guard.service.ts` |
| 1.3 | Runner de DAG: Kahn + poda de branch + executores por tipo (AGENT, CONDITION, APPROVAL, END; depois ROUTER/LOOP/PARALLEL/DELAY) + `{{alias.campo}}` + sinal cooperativo + checkpoint em jsonb (substitui o `Map` em memória) | G | `execute-workflow-run.use-case.ts`, `workflow-branching.ts`, `executors/*` |
| 1.4 | Cost-guards e kill-switch (com nome não invertido) ligados ao `budget.ts`; parada de emergência da org | P | `squad-cost-guard.ts` |
| 1.5 | Heartbeat + reaper + aviso de falha | M | `reap-stalled-runs.use-case.ts` |

### Fase 2 — Execução visível
| # | Item | Esforço | Fonte |
|---|---|---|---|
| 2.1 | Tabela `run_events` (formato AG-UI) + timeline com 3 modos + `aggregateAgUi` em `packages/shared` | M | `squad-run-timeline.tsx`, `ag-ui-event.ts` |
| 2.2 | Controle de run + aprovação com reject/reassign (Server Actions + Zod) | M | `control-workflow-run.use-case.ts`, `run-approval-banner.tsx` |
| 2.3 | Real-time: WS consertado ou SSE via route handler, com fallback de polling até `RunFinished`; alimenta também o Escritório | M | — |
| 2.4 | Tool `ask_agent` + eventos Handoff/Ask/Reply | M | `ask-agent.tool.ts` |

### Fase 3 — Produto
| # | Item | Esforço | Fonte |
|---|---|---|---|
| 3.1 | Domínios (13) com `resolveDomainMeta` seguro + templates por domínio em `templates/` | P | `constants.ts`, `squad-templates.catalog.ts` |
| 3.2 | Hub `/squads` em RSC com abas `?tab=` + overview agregado em 1 query | M | `squads-shell.tsx`, `squads-overview` |
| 3.3 | Copiloto do Arquiteto com plano persistido (`squad_architect_plans`), claim atômico, custo determinístico, `connected` do servidor — **com streaming** | G | `architecture-plan.use-case.ts` |
| 3.4 | Triggers: schedule once/cron/interval com timezone editável e `nextRunAt` calculado; webhook com HMAC; GitHub com normalizador | M | `schedule-trigger-config.ts`, `webhooks-github/*` |
| 3.5 | Marketplace: publicar com snapshot versionado, instalar em transação, idempotência por `(org, item)` | M | `marketplace-provision/*` |
| 3.6 | Biblioteca de agentes da org (N:M com squads, tier por vínculo) + persona + `accessLevel` por conector | M/G | `resolve-library-agent.ts` |
| 3.7 | RBAC server-side (owner/admin para publicar, deletar e editar cost-guards) | P | `feature-flags.ts`, `sidebar-visibility.ts` |

### Fase 4 — Diferencial
| # | Item | Esforço | Fonte |
|---|---|---|---|
| 4.1 | Builder visual `@xyflow/react` com painel de config por nó (via `next/dynamic` `ssr:false`) | G | `orchestration-canvas.tsx`, `step-config-panel.tsx` |
| 4.2 | Tier DEEP (Claude Agent SDK em sandbox) + ops de escrita no GitHub + LOOP `retryUntilGreen` → esteira dev nativa | G | `squads/sandbox/*`, `github/operations.ts` |
| 4.3 | Dry-run sem efeitos colaterais | M | `workflow-runs.controller.ts` |
| 4.4 | Testes de regressão a partir da seção 9 do `regression-test/SKILL.md` | M (contínuo) | — |

### Armadilhas da Adalink para não repetir
- `version` ornamental sem tabela de versões.
- Executores stub (ADR-0021).
- `killSwitchEnabled=false` significar "desligado".
- Contrato `APPROVAL` ausente em `libs/contracts` enquanto o banco e o front o usam.
- Comparar tipo de nó em minúsculo; schema rígido de `position` no canvas.
- Refund sem desprovisionamento.
