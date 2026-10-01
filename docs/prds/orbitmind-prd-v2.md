# PRD v2 — OrbitMind: plataforma sólida, instantânea e com motor de squads de verdade

> **Status:** Aprovado para execução
> **Data:** 2026-09-30
> **Versão:** 2.0
> **Substitui:** partes de engine, pipeline e realtime do [PRD v1](orbitmind-prd-v1.md)
> **Base:** [Auditoria de 2026-09-30](../analysis/auditoria-2026-09-30.md). Todo item deste PRD nasce de um achado dela ou do mapeamento da Adalink.

---

## 0. Como as sessões usam este documento (leia primeiro)

Este PRD é o **backlog vivo** da plataforma. Cada sessão de trabalho segue este protocolo:

1. **Escolher o próximo item.** Pegue o primeiro item não marcado do **marco atual** (seção 6) cujas dependências (`dep:`) já estejam com *Implementado* e *Testado* marcados. Não pule de marco sem que o anterior esteja fechado, exceto itens marcados como `[paralelo]`.
2. **Branch.** Use `feat/<id-minúsculo>-<slug>`, ex.: `feat/sec-01-tenant-guards`. Itens pequenos do mesmo épico podem compartilhar uma branch, desde que o PR liste todos os IDs.
3. **Implementar** seguindo o `CLAUDE.md` (TS strict, Zod na borda, Server Components por padrão, Conventional Commits).
4. **Marcar *Implementado*** só quando o código estiver em PR aberto ou mergeado, com typecheck e lint verdes. Acrescente ao fim da linha: `✅ <PR ou commit> (<data>)`.
5. **Marcar *Testado*** só com **evidência**:
   - teste automatizado que cobre o critério de aceite, passando no CI. Cite o arquivo: `🧪 apps/web/tests/sec/tenant.test.ts`;
   - ou, quando for impossível automatizar (ex.: visual 3D), roteiro manual executado e registrado no **Log de sessões** (seção 9), com data e resultado.
   - Typecheck passando **não** conta como teste.
6. **Ao encerrar a sessão**, adicione uma linha ao Log de sessões: data, itens tocados, estado e bloqueios.
7. **Não renumere nem apague IDs.** Item descartado vira ~~riscado~~ com o motivo. Item novo ganha o próximo número do épico.
8. **Se descobrir que um critério de aceite está errado**, corrija o critério no PR e registre no log. Não marque o item com o critério antigo.

Formato dos itens:

```
- [ ] **ID** Implementado — o que construir. (dep: IDs)
  - [ ] Testado — critério de aceite verificável.
```

---

## 1. Contexto e problema

A auditoria de 2026-09-30 mostrou que a plataforma **parece** completa, mas na prática:

- **Navegação lenta:** 8 de 14 telas buscam dados no cliente depois de montar (spinner duplo). Não há cache entre navegações, e `/pipeline` faz chamadas seriais ao GitHub.
- **Vazamento entre empresas:** cerca de 15 rotas não checam a organização (IDOR), e as conversas do Arquiteto são compartilhadas entre todas as orgs.
- **Motor que finge funcionar:**
  - veto, review, paralelo e `dependsOn` nunca rodam (snake_case vs camelCase);
  - falhas são gravadas como "completed";
  - runs simultâneos colidem;
  - checkpoints vivem em memória.
- **Nada durável:** execução fire-and-forget dentro de route handlers, agendamentos que nunca disparam e um WebSocket que não conecta.
- **Integrações quebradas:** o Nango usa `connectionId = orgId`, erros são engolidos e a UI mostra sucesso.
- **Migration defasada** do schema.

Enquanto isso, a Adalink (`adalink-platform` + `Adalink-Agents-Pipeline`) amadureceu squads como **DAG de agentes**, com:
- aprovação humana (aprovar, rejeitar, devolver a um agente);
- cost-guards e parada de emergência;
- Copiloto do Arquiteto com plano revisável;
- timeline de colaboração entre agentes;
- triggers (cron, webhook, GitHub);
- marketplace;
- esteira dev com Claude Agent SDK em sandbox.

Ela também tem lacunas que vamos superar:
- créditos e detecção de loop inertes;
- polling em vez de tempo real;
- sem versionamento;
- aprovação que nunca expira;
- Copiloto sem streaming.

## 2. Objetivos

| # | Objetivo | Métrica de sucesso |
|---|---|---|
| O1 | Navegação instantânea | Em build de produção, após prefetch: troca de rota do dashboard ≤ **300 ms** até o conteúdo final, **sem spinner duplo**. Voltar a uma rota visitada ≤ **100 ms**. Verificado por `pnpm perf:nav` (FND-05). |
| O2 | Isolamento multi-tenant total | Suíte cross-tenant cobre **100%** das rotas e Server Actions com recurso de org, e todas retornam 404/403. |
| O3 | Execução durável | Um run sobrevive a restart do worker e a N instâncias. Nenhum run fica em RUNNING sem heartbeat por mais de 10 min. |
| O4 | Motor de squads completo | DAG com os 10 tipos de nó, HITL completo e cost-guards funcionais. Status final sempre correto. |
| O5 | Tempo real de verdade | Eventos de run chegam à UI em ≤ 1 s via SSE; polling só como fallback. |
| O6 | Paridade + superação da Adalink | Todas as capacidades da seção 4 do mapeamento implementadas, mais as 6 melhorias listadas em 3.2. |
| O7 | Qualidade verificável | CI com typecheck, lint, unit, integração, e2e e build em todo PR. |

### 2.1 Não-objetivos (nesta versão)
- Billing e cobrança real (Stripe). Exibimos uso e custo, mas não cobramos.
- Deploy na Vercel para execução de squads. A Vercel pode servir o front, mas o worker exige processo contínuo (D-01).
- Canal WhatsApp como trigger (fica para v2.1).
- App mobile.

---

## 3. Decisões de arquitetura

| ID | Decisão | Motivo | Alternativa descartada |
|---|---|---|---|
| **D-01** | Dois processos: **web** (Next.js) e **worker** (Node, `apps/worker`). Deploy em host de processo contínuo (Render/Docker). | Pipelines duram minutos; route handler serverless congela após a resposta. | Vercel Functions com `after()`: limite de duração e checkpoint impossível. |
| **D-02** | Fila **pg-boss** sobre o mesmo Postgres: jobs de run, resume, schedule, delay e manutenção. | Zero infraestrutura nova, transacional com os dados, com cron nativo. | Trigger.dev/Inngest: mais um serviço e custo; BullMQ: exige Redis. |
| **D-03** | Tempo real via **SSE** (route handler) + **Postgres LISTEN/NOTIFY**. Aposentar `ws` e o `server.ts` quando o SSE cobrir o escritório (hoje o escritório usa o WS com token curto de `/api/ws-token` + polling de segurança, entregue na branch `worktree-feat-office-gather-redesign`). | Funciona atrás de qualquer proxy, reconecta com `Last-Event-ID` e dispensa servidor custom. | Manter o WS: exige servidor custom e não roda em serverless. |
| **D-04** | Squad = **DAG em tabelas** (`squad_nodes`, `squad_edges`) dentro de uma **`squad_versions`**. Publicar congela a versão; runs apontam para ela. | Edição sem quebrar runs em andamento; marketplace com versão; auditoria. | Pipeline em `squads.config` jsonb (atual): sem integridade, sem versão. |
| **D-05** | **Biblioteca de agentes da org**: `agents.org_id`, e o agente deixa de pertencer a um squad. O nó AGENT referencia o agente, e o **tier é do nó**. | O mesmo agente participa de várias squads; persona única. | Manter `agents.squad_id` NOT NULL. |
| **D-06** | LLM via `ai` + AI Gateway (mantém). Tier LIGHT = `generateText` com tools. Tier DEEP = **Claude Agent SDK** em sandbox (E2B default, porta com provider nulo). | Já integrado; DEEP é o diferencial da esteira dev. | — |
| **D-07** | Front: **RSC + Server Actions + `router.refresh()` + SSE**. Sem TanStack Query. | Alinhado ao CLAUDE.md e menos JS no cliente. | TanStack Query (Adalink): mais bundle e duplica o cache do Next. |
| **D-08** | Testes: **Vitest** (unit + integração com Postgres real via docker) e **Playwright** (e2e + perf). | Rápido, ESM nativo, e o engine já usa. | Jest. |
| **D-09** | Custo em **micro-USD (bigint)** calculado por `pricing.ts` a partir dos tokens, gravado por step e por run. Cost-guard compara com esse valor. | A Adalink tem cost-guard inerte porque ninguém preenchia o custo. | Créditos abstratos. |
| **D-10** | `run_id` = **UUID**. | O timestamp de segundo atual colide. | — |
| **D-11** | `squad.yaml` continua existindo como **formato de import/export**, normalizado com `.transform` snake→camel no Zod. O pipeline linear legado é migrado para DAG. | Compatibilidade com templates e com o OpenSquad. | Abandonar o YAML. |
| **D-12** | i18n com **next-intl** (pt-BR default, en, es). | Já instalado; locales existem. | — |
| **D-13** | Armazenamento de arquivos **S3-compatível** (MinIO no docker local, R2/S3 em produção). | Anexos do chat, imagens de checkpoint, assets de skills. | Base64 no banco. |

### 3.1 Arquitetura alvo

```
┌───────────── web (Next.js 15) ─────────────┐        ┌──────── worker (Node) ────────┐
│ RSC pages ─ Server Actions ─ Route Handlers│        │ pg-boss consumers             │
│  • /api/runs/[id]/events  (SSE)            │◄─NOTIFY─┤  • run.execute / run.resume   │
│  • /api/org/stream        (SSE)            │        │  • squad.schedule.tick        │
│  • /api/v1/*   (Bearer token)              │        │  • node.delay.wake            │
│  • /api/hooks/*  (HMAC público)            │─enqueue►│  • maintenance.reaper (5 min) │
└──────────────────┬─────────────────────────┘        │  • maintenance.notify-failed  │
                   │                                  │  • chat.reply / architect.turn│
                   ▼                                  └───────────────┬───────────────┘
          ┌──────────────────── PostgreSQL 16 ────────────────────────▼──┐
          │ dados de domínio · pgboss.* · LISTEN/NOTIFY run_events        │
          └───────────────────────────────────────────────────────────────┘
                   S3 (MinIO/R2) · AI Gateway · Nango · E2B · GitHub
```

### 3.2 Onde superamos a Adalink

1. Tempo real por SSE (lá é polling de 2 a 3 s).
2. Cost-guards funcionais (lá crédito e loop são inertes, e o kill-switch tem nome invertido).
3. Versionamento de squad e marketplace com "atualização disponível" (lá o `version` é ornamental).
4. Timeout configurável de aprovação (lá o run fica PAUSED para sempre).
5. Copiloto com streaming e edição de squad existente (lá é request/response e a edição foi removida).
6. DELAY durável sem teto, e LOOP/PARALLEL respeitando pause/cancel (lá o teto é 60 s e o sub-grafo ignora sinais).

---

## 4. Modelo de dados alvo (resumo)

Todas as PKs são UUID v4 e todo timestamp é `timestamptz`. Toda tabela de domínio tem `org_id`, direto ou por FK obrigatória.

| Tabela | Colunas-chave (novas em **negrito**) |
|---|---|
| `squads` | id, org_id, name, code, description, icon, **status (draft\|active\|paused\|archived)**, **domain**, **trigger_type**, **trigger_config**, **current_version_id**, **draft_version_id**, **max_cost_per_run_micros**, **max_steps_per_run**, **runs_enabled** (kill switch), template_id, created_by |
| **`squad_versions`** | id, squad_id, number, status (draft\|published), published_at, published_by, canvas (jsonb: viewport) |
| **`squad_nodes`** | id, version_id, **key** (alias estável), type (enum dos 10), label, position_x/y, agent_id?, tier (light\|deep)?, instructions, config jsonb, checkpoint bool |
| **`squad_edges`** | id, version_id, source_node_id, target_node_id, source_handle, label, condition jsonb |
| `agents` | id, **org_id**, name, role, icon, **persona_color, persona_trait, persona_register**, model_tier, monthly_budget_tokens, budget_used_tokens, status, config. **`squad_id` removido.** |
| **`agent_connector_grants`** | agent_id, integration_id, access_level (none\|read\|read_write), approval_policy (never\|always_side_effects) |
| `pipeline_runs` → **`runs`** | id (uuid), org_id, squad_id, **version_id**, status (pending\|running\|paused\|completed\|failed\|cancelled), **trigger_type**, **input**, **output**, **error**, **control_signal**, **pause_reason (manual\|checkpoint)**, **paused_at_node_id**, **checkpoint jsonb**, **cost_micros**, **tokens**, **steps_executed**, **last_heartbeat_at**, **is_dry_run**, started_at, completed_at, **approval_expires_at** |
| `executions` → **`run_steps`** | id, run_id, node_id, agent_id?, status, input, output, tokens, cost_micros, model, started_at, completed_at, error |
| **`run_events`** | id (bigserial), run_id, org_id, type (RunStarted\|StepStarted\|ToolCall\|StepFinished\|RunFinished\|Message\|Handoff\|Ask\|Reply\|Approval), node_id, step_index, status, duration_ms, tokens, cost_micros, body (≤ 8000), body_truncated, from_agent_id, to_agent_id, thread_id, created_at |
| **`pending_actions`** | id, org_id, run_id?, agent_id, action, params_encrypted, summary, risk_level, status, expires_at, decided_by |
| `schedules` | + **mode (once\|cron\|interval)**, **run_at**, **interval_seconds**, **input**, **job_id**, **total_runs**, **failed_runs** |
| **`squad_webhooks`** | id, org_id, squad_id, endpoint_path (unique), secret_hash, allowed_methods, enabled, last_received_at |
| **`github_subscriptions`** | id, org_id, repo_owner, repo_name, github_hook_id, secret_encrypted, events[], enabled |
| **`event_subscriptions`** | id, org_id, event_type, filters jsonb, squad_id, enabled |
| **`squad_architect_plans`** | id, org_id, user_id, conversation_id, status (draft\|approved\|rejected), briefing, domain, proposed_name, description, agents_plan jsonb, connectors_plan jsonb, estimated_cost_micros, raw_output, approved_by/at, approved_cost_micros, created_squad_id, target_squad_id? |
| **`architect_conversations`** | id, org_id, user_id, title, state jsonb, updated_at |
| `marketplace_items` | + **source_squad_id**, **version_snapshot jsonb**, **version_number** |
| `marketplace_acquisitions` | + **installed_squad_id**, **installed_version_number**, unique (org_id, item_id) |
| **`org_invites`** | id, org_id, email, role, token_hash, expires_at, accepted_at |
| **`notifications`** | id, org_id, user_id, type, payload, read_at |
| `api_tokens` | (existe) + uso real |
| `pipeline_logs` | **removida** (substituída por `run_events`) |

---

## 5. Épicos e checklist

### FND — Fundação de qualidade

- [ ] **FND-01** Implementado — Vitest configurado em `packages/shared`, `packages/engine` e `apps/web`, com `pnpm test` na raiz via turbo.
  - [ ] Testado — `pnpm test` roda na raiz e executa ao menos 1 teste por pacote.
- [ ] **FND-02** Implementado — Serviço `postgres-test` no docker-compose (porta 5435) + helper `withTestDb()` que aplica as migrations uma vez e trunca entre testes. (dep: DB-01)
  - [ ] Testado — Um teste de integração cria e lê um squad no banco de teste; rodar duas vezes não deixa lixo.
- [ ] **FND-03** Implementado — Playwright configurado com seed determinístico: **org A** e **org B**, cada uma com usuários owner/admin/member/viewer, e fixture de login por papel.
  - [ ] Testado — O e2e "login como viewer da org A e ver dashboard" passa.
- [ ] **FND-04** Implementado — CI no GitHub Actions (`.github/workflows/ci.yml`): install com cache pnpm, typecheck, lint, test (com serviço Postgres), build e e2e, em PR para `develop` e `main`.
  - [ ] Testado — Um PR de teste mostra todos os jobs verdes; um PR com erro de tipo falha.
- [ ] **FND-05** Implementado — `pnpm perf:nav`: Playwright contra `next build && next start` que navega por todas as rotas do dashboard pela sidebar, mede o tempo até um `data-ready` da página e falha acima do orçamento de O1. Roda no CI. (dep: FND-03)
  - [ ] Testado — O relatório lista todas as rotas com tempo; forçar um `sleep` numa página faz o script falhar.
- [ ] **FND-06** Implementado — `lib/env.ts` valida env com Zod no boot (web e worker). Um único `.env.example` completo na raiz, documentando todas as variáveis realmente lidas (incluindo `NANGO_SECRET_KEY`, `ENCRYPTION_KEY`, `AI_GATEWAY_*`, `S3_*`, `E2B_API_KEY`) e removendo as não usadas (GitLab, Discord, Telegram).
  - [ ] Testado — Unit: env sem `DATABASE_URL` lança erro com mensagem clara; grep de `process.env.` fora de `env.ts` retorna vazio (regra de lint).
- [ ] **FND-07** Implementado — Regra de lint/CI que proíbe `void (async` e `.catch(` solto em `app/api/**` e em Server Actions (execução fire-and-forget).
  - [ ] Testado — Um arquivo de exemplo com fire-and-forget faz o lint falhar.

### DB — Banco e queries

- [ ] **DB-01** Implementado — Migrations regeneradas para refletir `schema.ts` (incluindo `pipeline_runs`/`runs`, `quote_requests` e enums; `llm_providers` corrigida). `db:migrate` em banco vazio cria tudo. Documentar `db:migrate` como o caminho oficial (não `db:push`).
  - [ ] Testado — CI roda `db:migrate` em Postgres limpo seguido de `drizzle-kit check` sem diff.
- [ ] **DB-02** Implementado — Índices compostos: `run_steps(run_id)`, `runs(squad_id, started_at desc)`, `runs(org_id, status)`, `messages(squad_id, created_at desc)`, `run_events(run_id, id)`, `audit_logs(org_id, created_at desc)`, `tasks(squad_id, status)`, `tasks(status, completed_at)`. (dep: DB-01)
  - [ ] Testado — `EXPLAIN` das queries de listagem principais usa índice (teste de integração checa o plano de 3 queries críticas).
- [ ] **DB-03** Implementado — Pool Postgres singleton em `globalThis` em dev, com `max` configurável (`DB_POOL_MAX`) e pools separados para web e worker.
  - [ ] Testado — Unit: importar o módulo duas vezes devolve a mesma instância.
- [ ] **DB-04** Implementado — `getSquadsByOrgId`: contagens filtradas pela org (join ou `inArray`), sem GROUP BY global.
  - [ ] Testado — Integração: com 2 orgs, as contagens da org A não incluem agentes da org B.
- [ ] **DB-05** Implementado — Listagens com colunas explícitas (sem `config`, `input_data`, `output_data` quando não usados). Somas de custo e tokens feitas em SQL (`sum`).
  - [ ] Testado — Integração: o payload de `/squads` não contém `config`; a métrica de custo do mês bate com a soma manual do seed.
- [ ] **DB-06** Implementado — `getSquadWithAgents` em uma query (join) ou em `Promise.all`.
  - [ ] Testado — Unit/integração retorna o mesmo shape de antes.
- [ ] **DB-07** Implementado — Seed idempotente: 2 orgs demo, squads válidos (todo nó AGENT com `agent_id`), itens de marketplace executáveis, API token de demo. (dep: ENG-02)
  - [ ] Testado — Rodar `db:seed` duas vezes não duplica nada; o squad demo roda até o fim no e2e.

### SEC — Segurança e multi-tenant

- [ ] **SEC-01** Implementado — `lib/auth/guards.ts` com `requireSession()`, `requireRole(min)`, `requireSquad(squadId)` (carrega com `org_id` da sessão ou 404), `requireIntegration(id)`, `requireRun(runId)`. Queries de domínio passam a exigir `orgId` na assinatura.
  - [ ] Testado — Unit dos guards: sessão ausente → 401; papel insuficiente → 403; recurso de outra org → 404.
- [ ] **SEC-02** Implementado — Guards aplicados em **todas** as rotas e Server Actions com recurso de org:
  - `squads/[id]` (GET, PATCH, DELETE), `squads/[id]/agents`, `tasks`, `tasks/[id]`, `chat`, `chat/[squadId]`, `memories`;
  - `run`, `runs`, `runs/[id]`, `approve`, `reject`, `schedules`, `schedules/[id]`;
  - `marketplace/[id]/acquire` (valida `squadId`);
  - `integrations/[id]`, `/actions`, `/test`, `integrations/github/*`.

  (dep: SEC-01)
  - [ ] Testado — Suíte `tests/security/cross-tenant.test.ts` gera um caso por rota e método: o usuário da org B acessa recurso da org A → 404. Um teste de meta-cobertura falha se existir `route.ts` sem caso na suíte.
- [ ] **SEC-03** Implementado — Arquiteto isolado por tenant: remover o squad fixo compartilhado; conversas em `architect_conversations (org_id, user_id)`; o snapshot nunca restaura `orgId` diferente da sessão; `history` lista só as conversas do usuário. (dep: SEC-01)
  - [ ] Testado — Integração: a org B lista conversas e recebe só as suas; POST com `conversationId` da org A → 404 e nenhuma ação executada.
- [ ] **SEC-04** Implementado — RBAC por papel, aplicado no servidor:

  | Papel | Pode |
  |---|---|
  | viewer | ler |
  | member | chat, tasks, rodar squad ativo, aprovar checkpoints próprios |
  | admin | criar/editar/publicar squads, integrações, schedules, webhooks, cost-guards, aprovar qualquer |
  | owner | tudo acima + membros, org, tokens de API, deletar org |

  Matriz única em `packages/shared/src/rbac.ts`. (dep: SEC-01)
  - [ ] Testado — Suíte `tests/security/rbac.test.ts` percorre a matriz inteira (papel × ação) contra as rotas e actions.
- [ ] **SEC-05** Implementado — Middleware: `/api/*` sem sessão → 401 JSON (nunca redirect HTML). Matcher exclui assets estáticos (`\.(png|jpg|svg|glb|hdr|woff2?)$`). Rotas públicas explícitas: `/`, `/login`, `/register`, `/invite/*`, `/api/auth/*`, `/api/hooks/*`, `/api/v1/*` (auth por Bearer), `POST /api/quote-requests`.
  - [ ] Testado — e2e/integração: `fetch('/api/squads')` sem cookie → 401 JSON; `/office/sprites/x.png` não passa pelo middleware.
- [ ] **SEC-06** Implementado — Webhooks de integração: secret gerado na criação e guardado cifrado; HMAC obrigatório com `timingSafeEqual`; org resolvida pela integração da URL, **nunca** pelo corpo; suporte a `application/x-www-form-urlencoded` (Slack).
  - [ ] Testado — Unit: assinatura válida → 200; inválida ou ausente → 401; corpo com `orbitmind_org_id` falso é ignorado.
- [ ] **SEC-07** Implementado — `safeFetch()` em `packages/engine`: só http(s); bloqueia IPs privados, loopback, link-local e metadata (checagem após DNS e em cada redirect); timeout de 15 s; limite de 5 MB. Usado por `web_fetch`, `ImageFetcher`, download de imagem do LinkedIn e Sherlock.
  - [ ] Testado — Unit: `http://169.254.169.254`, `http://localhost`, `http://10.0.0.1` e um redirect para IP privado são bloqueados; URL pública passa.
- [ ] **SEC-08** Implementado — `images.remotePatterns` restrito aos hosts usados de fato (avatar do GitHub, logos do Nango, bucket S3).
  - [ ] Testado — `/_next/image?url=https://evil.com/x.png` → 400.
- [ ] **SEC-09** Implementado — Remover `simpleMarkdown` + `dangerouslySetInnerHTML` (`pipeline-chat.tsx`, `checkpoint-review.tsx`) e usar o renderer de markdown seguro compartilhado (react-markdown sem HTML cru, `urlTransform` que bloqueia `javascript:`).
  - [ ] Testado — Unit: output com `<img src=x onerror=alert(1)>` e `[x](javascript:alert(1))` renderiza inerte.
- [ ] **SEC-10** Implementado — `/api/integrations/[id]/test`: sem fallback que lista conexões do ambiente Nango; nenhum `console.log` de credencial.
  - [ ] Testado — Unit/integração: integração sem `connectionId` → erro claro; grep por log de token no arquivo vazio.
- [ ] **SEC-11** Implementado — `callbackUrl` do login aceita só path relativo iniciado por `/` (sem `//`).
  - [ ] Testado — e2e: `/login?callbackUrl=https://evil.com` redireciona para `/dashboard`.
- [ ] **SEC-12** Implementado — `ENCRYPTION_KEY` dedicada (32 bytes, base64) com salt/IV aleatório por registro (AES-256-GCM, formato versionado `v1:`). Script `pnpm secrets:migrate` recifra os dados antigos derivados do `NEXTAUTH_SECRET`.
  - [ ] Testado — Unit: round-trip; dados `v0` antigos são lidos e regravados como `v1`; trocar o `NEXTAUTH_SECRET` não afeta a leitura.
- [ ] **SEC-13** Implementado — Login com GitHub completo: no primeiro login, cria usuário + org + membership owner; a sessão sempre tem `orgId` válido; conta existente com mesmo email é vinculada.
  - [ ] Testado — Integração com provider mockado: primeiro login cria a org; segundo login reusa; sessão nunca tem `orgId` vazio.
- [ ] **SEC-14** Implementado — Email normalizado (trim + lowercase) em registro, login e convite; índice único em `lower(email)`.
  - [ ] Testado — Registrar `A@X.com` e depois `a@x.com` → conflito; login com maiúsculas funciona.
- [ ] **SEC-15** Implementado — Rate limit do `POST /api/quote-requests` persistido no Postgres, com IP confiável (primeiro hop do proxy configurado em `TRUSTED_PROXY_HOPS`); notificação do lead por email para `PLATFORM_ADMIN_EMAILS`.
  - [ ] Testado — Integração: a 6ª requisição em 10 min → 429 mesmo após restart; lead gera email (transport mockado).
- [ ] **SEC-16** Implementado — Tokens de Apify e Instagram enviados por header quando a API aceitar; nunca logados.
  - [ ] Testado — Unit das skills: a URL montada não contém o token.
- [ ] **SEC-17** Implementado — Integração só fica `active` após confirmação do servidor (callback/webhook do Nango ou verificação da conexão). O PATCH manual de `status` é proibido.
  - [ ] Testado — Integração: PATCH `{status:'active'}` é ignorado ou recusado.
- [ ] **SEC-18** Implementado — Audit log em ações sensíveis: squad (criar, editar, publicar, deletar), run (aprovar, rejeitar, devolver, cancelar, parada de emergência), integrações, membros, tokens de API, org.
  - [ ] Testado — Integração: cada ação gera exatamente 1 linha de audit com ator, org e alvo.

### PERF — Navegação instantânea

- [ ] **PERF-01** Implementado — `experimental.staleTimes: { dynamic: 30, static: 180 }` em `next.config.ts`.
  - [ ] Testado — `perf:nav`: voltar a uma rota visitada ≤ 100 ms, sem request RSC novo.
- [ ] **PERF-02** Implementado — `next dev --turbopack`. O README orienta medir performance apenas em `build && start`.
  - [ ] Testado — `pnpm dev` sobe com Turbopack sem erros em todas as rotas (smoke e2e em dev).
- [ ] **PERF-03** Implementado — Padrão de página: `page.tsx` Server Component busca com `Promise.all` e passa props a um `*-client.tsx` mínimo; `loading.tsx` com skeleton **do layout real**; `PageLoader` interno removido. Documentado em `docs/architecture/frontend-patterns.md`.
  - [ ] Testado — Lint custom ou teste falha se uma `page.tsx` do dashboard tiver `"use client"`.
- [ ] **PERF-04** Implementado — `/agents` no padrão PERF-03. (dep: PERF-03)
  - [ ] Testado — `perf:nav` dentro do orçamento; sem request a `/api/agents` no cliente ao abrir.
- [ ] **PERF-05** Implementado — `/board` no padrão, com squad selecionado via `?squad=`, sem waterfall. (dep: PERF-03)
  - [ ] Testado — `perf:nav` ok; trocar o squad não mostra spinner de página inteira.
- [ ] **PERF-06** Implementado — `/chat` no padrão (squads + conversas no servidor); renderer de markdown via `next/dynamic`; query de conversas sem subquery correlacionada. (dep: PERF-03, SEC-03)
  - [ ] Testado — `perf:nav` ok; o bundle inicial de `/chat` não contém `react-markdown` (checagem via `next build` + analyzer em CI).
- [ ] **PERF-07** Implementado — `/marketplace` no padrão. (dep: PERF-03)
  - [ ] Testado — `perf:nav` ok.
- [ ] **PERF-08** Implementado — `/settings` no padrão, com abas via `?tab=` e dados da aba carregados no servidor. (dep: PERF-03)
  - [ ] Testado — `perf:nav` ok; trocar de aba não mostra `SectionLoader`.
- [ ] **PERF-09** Implementado — `/integrations` no padrão. Catálogo Nango com `unstable_cache` (1 h), cache negativo de 60 s em falha, envio só de premium + contagens e genéricos paginados sob demanda, `<img loading="lazy">`. (dep: PERF-03)
  - [ ] Testado — `perf:nav` ok com Nango fora do ar (mock); a página abre em ≤ 300 ms.
- [ ] **PERF-10** Implementado — `/pipeline`: listagem só com metadados; YAML e skill buscados ao abrir o editor; chamadas ao GitHub em `Promise.all` com limite de concorrência 4; `unstable_cache` por org (60 s) invalidado em toggle e trigger. (dep: INT-01)
  - [ ] Testado — Integração com GitHub mockado com latência de 200 ms e 10 workflows: listagem em < 1 s (antes: 3 + 2N seriais).
- [ ] **PERF-11** Implementado — `/office` (escritório isométrico em PixiJS 8, design aprovado em https://claude.ai/artifact/9rexnXJsmz6XsE88aJcvNW): um único `dynamic`; dados iniciais via RSC; `import()` da cena só no navegador; qualidade adaptativa (blur de sombras e luzes reduzido em GPU fraca / `devicePixelRatio` limitado); prefetch do chunk no hover do link.
  - [ ] Testado — Manual registrado no log: primeiro frame visível ≤ 1,5 s em build de produção; nenhuma requisição externa na aba Network; `/office-preview` (só em dev) bate com as pranchas 01, 02 e 04.
- [ ] **PERF-12** Implementado — `/squads/[id]`: abas via `?tab=` com dados no servidor; nenhum waterfall client; JSONB pesado fora das listagens. (dep: PERF-03)
  - [ ] Testado — `perf:nav` ok em todas as abas.
- [ ] **PERF-13** Implementado — Link "Novo squad" aponta direto para o destino final, sem página de redirect.
  - [ ] Testado — e2e: clicar em "Novo squad" leva a 1 navegação.
- [ ] **PERF-14** Implementado — Onboarding: `onboardingCompleted` (por **usuário**) lido no layout server; `Onborda`/framer-motion via `next/dynamic` só quando pendente; sem fetch de `/api/organizations` no cliente.
  - [ ] Testado — Com o onboarding concluído, o chunk do onborda não é baixado (e2e intercepta requests).
- [ ] **PERF-15** Implementado — `SessionProvider` removido do root; `TopBar` recebe nome e email por props do layout.
  - [ ] Testado — Nenhuma request a `/api/auth/session` durante a navegação (e2e).
- [ ] **PERF-16** Implementado — Trocar todo `window.location`, `<a href>` interno e `location.reload()` por `<Link>`, `router.push` ou `router.refresh()`.
  - [ ] Testado — Regra de lint (`no-restricted-syntax`) falha para `window.location.href =` e `<a href="/...">` em `app/` e `components/`.
- [ ] **PERF-17** Implementado — Nenhum `setTimeout`/`setInterval` de polling sem cleanup. O polling de chat e runs é substituído pelo stream SSE (OBS-02/03), com fallback de polling limpo no unmount. (dep: OBS-03)
  - [ ] Testado — e2e: sair da página de run não gera mais requests a `/api/squads/*/runs` (intercept por 10 s).
- [ ] **PERF-18** Implementado — Contagem de orçamentos do layout com `unstable_cache` + `revalidateTag('quotes')` no PATCH.
  - [ ] Testado — Integração: 2 renders seguidos fazem 1 query; o PATCH invalida.
- [ ] **PERF-19** Implementado — Remover `revalidate`/`force-dynamic` enganosos. Cache real via `unstable_cache` com tags por org (`org:{id}:squads`, etc.) e `revalidateTag` em toda mutation.
  - [ ] Testado — Integração: criar squad invalida a lista na próxima navegação.
- [ ] **PERF-20** Implementado — Fontes da landing (Instrument Serif, Geist Mono) e `landing.css` só no layout da landing/auth.
  - [ ] Testado — O HTML de `/dashboard` não pré-carrega as fontes da landing.
- [ ] **PERF-21** Implementado — `@orbitmind/shared` com `"sideEffects": false` e entradas separadas (`/types`, `/validators`, `/rbac`), para componentes client não puxarem Zod à toa.
  - [ ] Testado — Analyzer: o chunk compartilhado do dashboard não contém zod além do necessário (registro do tamanho antes e depois no PR).
- [ ] **PERF-22** Implementado — Confirmar que `/public/office/sprites` (≈ 18 MB, 2.782 arquivos) não é usado e remover.
  - [ ] Testado — Build e `/office` funcionam sem os arquivos; grep sem referências.
- [ ] **PERF-23** Implementado — Mutations de UI otimistas (`useOptimistic`) em board, toggles e status, para resposta instantânea ao clique.
  - [ ] Testado — e2e: mover um card atualiza a UI antes da resposta (rede lenta simulada).
- [ ] **PERF-24** Implementado — Orçamento O1 atingido em **todas** as rotas.
  - [ ] Testado — `perf:nav` verde no CI por 3 execuções seguidas.

### RUN — Runtime durável

- [ ] **RUN-01** Implementado — `apps/worker` (Node + tsx/tsup) com pg-boss: filas `run.execute`, `run.resume`, `node.delay.wake`, `squad.schedule.tick`, `maintenance.reaper`, `maintenance.notify-failed`, `chat.reply`, `architect.turn`, `approval.expire`. Scripts `pnpm dev` (web + worker) e `pnpm worker`. (dep: DB-01)
  - [ ] Testado — Integração: enfileirar um job de teste é consumido pelo worker em < 2 s.
- [ ] **RUN-02** Implementado — Rotas e actions de execução só **enfileiram** e respondem `202 {runId}`; nenhum trabalho longo em route handler. (dep: RUN-01, FND-07)
  - [ ] Testado — Lint FND-07 verde; integração: POST `run` retorna em < 200 ms com run PENDING.
- [ ] **RUN-03** Implementado — Chat de squad e Arquiteto processados no worker (`chat.reply`, `architect.turn`), com resposta via stream. (dep: RUN-01, OBS-02)
  - [ ] Testado — Integração: mensagem gera job; resposta gravada; SSE entrega.
- [ ] **RUN-04** Implementado — Checkpoint durável: a pausa grava o `checkpoint` jsonb e encerra o job; aprovar enfileira `run.resume`, que continua do ponto salvo. `checkpoint-manager.ts` em memória é removido. (dep: ENG-06)
  - [ ] Testado — Integração: pausar, **reiniciar o worker**, aprovar → o run completa sem reexecutar os steps concluídos.
- [ ] **RUN-05** Implementado — Heartbeat a cada 30 s em `runs.last_heartbeat_at` durante a execução + reaper (a cada 5 min) que marca FAILED os runs `never_started`/`unresponsive` após 10 min, com mensagem amigável.
  - [ ] Testado — Integração: run com heartbeat parado há 11 min → FAILED pelo reaper; run ativo não é tocado.
- [ ] **RUN-06** Implementado — Aviso de falha ao dono do squad (notificação in-app + email), deduplicado por squad/dia.
  - [ ] Testado — Integração: 3 falhas no mesmo dia → 1 aviso.
- [ ] **RUN-07** Implementado — Idempotência: `singletonKey` do pg-boss por `runId:fase`. Redelivery de um job já iniciado não reexecuta nós com efeito colateral (retoma do checkpoint).
  - [ ] Testado — Integração: entregar o mesmo job 2× → 1 execução por nó.
- [ ] **RUN-08** Implementado — Deploy: `Dockerfile` multi-stage (web e worker), `render.yaml` (web service + background worker + Postgres) e healthchecks (`/api/health` e worker com ping de fila). Documentado em `docs/runbook.md`.
  - [ ] Testado — `docker compose -f docker-compose.prod.yml up` sobe web + worker + db e o e2e smoke passa contra ele.
- [ ] **RUN-09** Implementado — Graceful shutdown do worker (SIGTERM): para de pegar jobs, grava checkpoint do run em andamento e o reenfileira.
  - [ ] Testado — Integração: SIGTERM no meio de um run → o run é retomado por outro worker e completa.
- [ ] **RUN-10** Implementado — API pública `/api/v1`:
  - auth Bearer (hash SHA-256 do token), escopo de org, `squad.org_id` comparado;
  - `input` respeitado; cria `runs` com `trigger_type=api`;
  - política de checkpoint por token (`autonomy: autonomous|supervised`), sem autoaprovar por padrão;
  - `GET /api/v1/runs/{id}` para status.

  (dep: SEC-05, RUN-02)
  - [ ] Testado — Integração: token da org B em squad da org A → 404; o input chega ao `{{trigger.*}}`; checkpoint pausa em modo supervised.
- [ ] **RUN-11** Implementado — UI de tokens de API em Settings (owner): criar (exibido 1×), listar (prefixo, último uso) e revogar. (dep: RUN-10)
  - [ ] Testado — e2e: criar token, chamar a API, revogar e a chamada seguinte dar 401.
- [ ] **RUN-12** Implementado — Remover `/api/cron` e `/api/inngest`; schedules passam a rodar pelo pg-boss (TRG-02).
  - [ ] Testado — As rotas não existem (404); os schedules continuam disparando (TRG-02).

### ENG — Motor de squads (DAG)

- [ ] **ENG-01** Implementado — Schema da seção 4: `squad_versions`, `squad_nodes` e `squad_edges`; novos campos de `squads` e `runs`; `run_steps`; `run_events`; enums. (dep: DB-01)
  - [ ] Testado — Migration aplica e reverte em banco com dados do seed.
- [ ] **ENG-02** Implementado — Migração de dados: pipelines lineares existentes (`squads.config`) viram versão publicada com DAG `TRIGGER → steps → END`. Checkpoints viram nós `APPROVAL`; veto/review viram config do nó AGENT. Agentes passam a pertencer à org (SQD-07). (dep: ENG-01)
  - [ ] Testado — Integração: um squad do seed antigo migrado roda e produz os mesmos steps.
- [ ] **ENG-03** Implementado — Import/export `squad.yaml` ↔ DAG. O Zod normaliza snake_case → camelCase (`.transform`) — **corrige veto, `depends_on`, `parallel_with`, `on_reject` e `source_step_id`**. `depends_on`/`parallel_with` viram arestas e nós PARALLEL.
  - [ ] Testado — Unit: os 4 templates de `templates/squads` fazem round-trip YAML → DAG → YAML sem perda; `veto_conditions` chega ao nó.
- [ ] **ENG-04** Implementado — `validateSquadGraph(version, ctx)` puro em `packages/engine`, que retorna `issues[{nodeId, field, severity, message, hint}]`:
  - exatamente 1 TRIGGER; ≥ 1 END alcançável; nós desconectados;
  - AGENT sem `agent_id`; agente de outra org;
  - ACTION sem skill/operação; parâmetro obrigatório vazio;
  - `{{alias}}` apontando para nó não ancestral;
  - CONDITION/ROUTER sem arestas de saída declaradas; APPROVAL sem aresta "rejeitado" (warning);
  - skill sem credencial (error se `checkBindings`).
  - [ ] Testado — Unit: um caso por regra (≥ 15 casos), incluindo o falso positivo "rascunho corrige o persistido".
- [ ] **ENG-05** Implementado — `assertAcyclic` incluindo sub-grafos de LOOP/PARALLEL; salvar um grafo com ciclo → 422.
  - [ ] Testado — Unit: ciclo simples, ciclo em sub-grafo e DAG diamante válido.
- [ ] **ENG-06** Implementado — Runner em `packages/engine`:
  - ordem topológica de Kahn + `ReachabilityTracker` (poda por decisão, join, fallback legado);
  - fail-fast;
  - persiste `run_steps` e `run_events` a cada nó;
  - checkpoint jsonb após cada nó;
  - status final correto (**falha ou cancelamento nunca viram completed**);
  - todos os callbacks `await`ados.

  (dep: ENG-01)
  - [ ] Testado — Unit/integração: linear, diamante, branch podado, join, nó falhando (→ FAILED com output parcial), resume pulando concluídos.
- [ ] **ENG-07** Implementado — `resolveTemplates`: `{{alias.campo}}` e `{{trigger.x}}` com índice de array; valor cru quando é placeholder único; `state = Object.create(null)`; alias = `key` estável do nó.
  - [ ] Testado — Unit: caminhos aninhados, placeholder ausente → `''`, `__proto__` não polui.
- [ ] **ENG-08** Implementado — Executores TRIGGER e END.
  - [ ] Testado — Unit.
- [ ] **ENG-09** Implementado — Executor AGENT:
  - system prompt = persona + role + `instructions` do nó + feedback de reassign;
  - **modelo pelo tier/model_tier respeitado** (corrige `defaultModel` sempre vencendo);
  - tools a partir de skills com **IDs canônicos**, com credenciais via `getSkillWithSecrets`, filtradas por `agent_connector_grants`;
  - tokens e custo em micro-USD registrados;
  - `recordLlmUsage` + budget do agente.

  (dep: ENG-06, ENG-22)
  - [ ] Testado — Unit com adapter mock: tier `fast` usa o modelo fast; uma skill com credencial chega como tool; o custo é gravado no step.
- [ ] **ENG-10** Implementado — Executores CONDITION (sem `eval`: `exists/missing`, `== != > >= < <=`, `&&`/`||`) e ROUTER (`on`, `routes[]`, `default`).
  - [ ] Testado — Unit: tabela de operadores, coerção numérica, expressão inválida → false.
- [ ] **ENG-11** Implementado — Executor APPROVAL + `checkpoint: true` em qualquer nó (pausa **antes** do nó); decisões em `state.__approvals[nodeId]`. (dep: ENG-06)
  - [ ] Testado — Unit: pausa com `pause_reason=checkpoint`; aprovado segue "aprovado"; rejeitado segue "rejeitado".
- [ ] **ENG-12** Implementado — Veto e review no nó AGENT: `vetoConditions` avaliadas por LLM barato após o output; até `maxVetoRetries` reexecuções com o motivo; esgotou → segue `onReject` (aresta) ou FAILED.
  - [ ] Testado — Unit: veto aprova na 2ª tentativa; esgota → aresta de rejeição.
- [ ] **ENG-13** Implementado — Executor ACTION (skill ou operação de integração com efeito colateral), passando pela política de aprovação (HITL-06). Em dry-run devolve preview.
  - [ ] Testado — Unit: política `always_side_effects` cria `pending_action` e pausa; dry-run não chama a API.
- [ ] **ENG-14** Implementado — Executor DELAY durável (qualquer duração): grava checkpoint e agenda `node.delay.wake` no pg-boss; o run fica `paused` com motivo `delay`. **Sem o teto de 60 s da Adalink.**
  - [ ] Testado — Integração: delay de 3 s com o worker reiniciado no meio → retoma e completa.
- [ ] **ENG-15** Implementado — Executor LOOP: for-each (`items`, `itemVar`, máx. 1000) e `retryUntilGreen {conditionPath, maxAttempts ≤ 20}`; sub-grafo via `SubGraphRunner` (profundidade ≤ 3); **respeita pause/cancel entre iterações**.
  - [ ] Testado — Unit: itera, para na falha, verde na 3ª tentativa, esgota → FAILED de negócio, cancelamento no meio para o loop.
- [ ] **ENG-16** Implementado — Executor PARALLEL: branches concorrentes (máx. 5 por vez, 50 no total), best-effort (`partial`, `failedBranches`), **outputs preservados no state** (corrige `executeStepSafe`), respeita cancel.
  - [ ] Testado — Unit: 3 branches, 1 falha → `partial` com os outputs das outras; todas falham → FAILED.
- [ ] **ENG-17** Implementado — Controle cooperativo: `control_signal` PAUSE/CANCEL lido antes de cada nó e entre iterações/branches; `pause_reason=manual`.
  - [ ] Testado — Integração: cancelar durante o nó 2 → nó 3 não roda, status `cancelled`; pausar e retomar → completa.
- [ ] **ENG-18** Implementado — Cost-guards antes de cada nó, em ordem: `runs_enabled=false` (kill switch, **nome não invertido**) > `max_cost_per_run_micros` > `max_steps_per_run` > loop detectado (mesma aresta ≥ 5×). O custo é **realmente somado** (D-09). Abortar → FAILED com motivo legível.
  - [ ] Testado — Unit: cada guard dispara isoladamente; precedência respeitada; custo acumulado bate com a soma dos steps.
- [ ] **ENG-19** Implementado — Parada de emergência da org: pausa todos os runs ativos (lotes de 15), desliga os schedules ativos opcionalmente e registra audit. Botão em Squads → Configurações (admin).
  - [ ] Testado — Integração: 20 runs ativos → todos `paused`; falha de 1 não aborta os outros.
- [ ] **ENG-20** Implementado — Dry-run: ACTION em preview, sem efeitos colaterais, sem cobrança, auto-aprova checkpoints, fora das métricas (`is_dry_run`). Opção "LLM real" ou "mock".
  - [ ] Testado — Integração: dry-run de squad com ACTION de publicação não chama a API externa e não aparece no dashboard.
- [ ] **ENG-21** Implementado — Budget mensal do agente aplicado no pipeline: ao estourar, o nó falha com mensagem clara (ou aguarda aprovação, conforme config); o reset mensal ocorre por job.
  - [ ] Testado — Integração: agente sem budget → FAILED com motivo `budget`; o reset zera no dia 1.
- [ ] **ENG-22** Implementado — IDs canônicos de skill (kebab-case) com mapa de aliases (`instagram_publisher` → `instagram-publisher`) e migração dos dados gravados com underscore.
  - [ ] Testado — Unit: alias resolve; a migração converte o seed antigo.
- [ ] **ENG-23** Implementado — Código morto do engine resolvido: `PipelineLogger` substituído por `run_events`; `AuditLogger` ligado a SEC-18; `BudgetTracker` usado por ENG-21; `IntegrationHookManager` removido ou ligado a TRG-05; `generateAngles` ligado a UI-08 ou removido. Nenhum export sem consumidor.
  - [ ] Testado — `knip` (ou `ts-prune`) no CI sem exports órfãos em `packages/engine`.
- [ ] **ENG-24** Implementado — Versionamento: editar sempre mexe no `draft_version`; "Publicar" valida (ENG-04), congela e vira `current_version`; runs gravam `version_id`; histórico de versões com "restaurar como rascunho".
  - [ ] Testado — Integração: editar o rascunho durante um run não altera o run; restaurar a v1 cria um rascunho igual à v1.
- [ ] **ENG-25** Implementado — Só squads `active` com versão publicada rodam de verdade (422 caso contrário); dry-run roda em qualquer status.
  - [ ] Testado — Integração: squad `draft` → 422 no run e 202 no dry-run.

### OBS — Observabilidade e tempo real

- [ ] **OBS-01** Implementado — Runner grava `run_events` no formato AG-UI (RunStarted, StepStarted, ToolCall, StepFinished, RunFinished, Message, Handoff, Ask, Reply, Approval) com `body` ≤ 8000 + `body_truncated`, `from_agent_id` e `to_agent_id`. Faz `NOTIFY run_events, '<runId>:<eventId>'`. (dep: ENG-06)
  - [ ] Testado — Integração: um run de 3 nós gera a sequência esperada; o Handoff aponta para o agente do próximo nó.
- [ ] **OBS-02** Implementado — SSE:
  - `GET /api/runs/[runId]/events` (replay desde `Last-Event-ID` + live via LISTEN);
  - `GET /api/org/stream` (status de agentes, runs e aprovações da org);
  - heartbeat de comentário a cada 15 s; auth + guard de org.

  (dep: OBS-01, SEC-01)
  - [ ] Testado — Integração: um cliente conecta, recebe o replay e os eventos novos em ≤ 1 s; reconecta com `Last-Event-ID` sem duplicar; outra org → 404.
- [ ] **OBS-03** Implementado — Hook `useEventStream(url)` com reconexão exponencial e fallback de polling (3 s) até `RunFinished`, com cleanup no unmount. (dep: OBS-02)
  - [ ] Testado — Unit com EventSource mock: reconecta; cai para polling quando o SSE falha 3×; para no RunFinished.
- [ ] **OBS-04** Implementado — Página de run `/squads/[id]/runs/[runId]` (RSC + stream) com resumo (status, steps, duração, custo, tokens) e **3 modos**: Timeline 2D, Colunas por agente (swimlane) e Grafo (nós do DAG com status e duração). `aggregateAgUi` em `packages/shared`. Controles: pausar, retomar, cancelar. (dep: OBS-03)
  - [ ] Testado — Unit de `aggregateAgUi` (port dos testes da Adalink: acumula colaboração, `truncateText`, badge Reply↔Ask por `threadId`) + e2e: rodar o squad demo e ver os eventos aparecerem ao vivo.
- [ ] **OBS-05** Implementado — Lista de runs por squad e global (filtros status/squad/período) com status, trigger, duração e custo, paginada.
  - [ ] Testado — e2e: filtros funcionam; paginação sem duplicatas.
- [ ] **OBS-06** Implementado — Status real do agente (`idle|working|paused`) atualizado pelo runner e emitido em `/api/org/stream`.
  - [ ] Testado — Integração: durante o nó, o agente fica `working`; depois volta a `idle`.
- [ ] **OBS-07** Implementado — Escritório isométrico (PixiJS) consome `/api/org/stream` no lugar do WS + polling atuais: posição e animação pelo status real, handoff animado a partir de eventos Handoff, balão com o `body` resumido. **Dados de demonstração removidos** (ficam atrás de `?demo=1`). (dep: OBS-06)
  - [ ] Testado — Manual registrado: rodar o squad demo e ver agentes trabalhando e handoffs no escritório; sem run, todos idle.
- [ ] **OBS-08** Implementado — Tabela `pipeline_logs` removida (migração) e consultas migradas para `run_events`.
  - [ ] Testado — grep sem referências; migration aplicada.
- [ ] **OBS-09** Implementado — Tool `ask_agent` (agente pergunta a outro agente da org): síncrona, máx. 5 por run, profundidade 3, alvo precisa estar ativo; gera Ask/Reply com `threadId`; o agente perguntado roda sem tools. (dep: ENG-09)
  - [ ] Testado — Unit: limite de 5; profundidade; alvo de outra org → FORBIDDEN; eventos Ask/Reply pareados.
- [ ] **OBS-10** Implementado — Dashboard com métricas reais de runs: sucesso %, custo e tokens do mês (soma correta, não "últimas 20"), top squads por custo, runs com falha recentes.
  - [ ] Testado — Integração: os valores batem com o seed controlado.
- [ ] **OBS-11** Implementado — Resumo humanizado da run (LLM barato, sob demanda, cacheado) na página de run.
  - [ ] Testado — Unit com adapter mock: gera 1× e reutiliza o cache.

### HITL — Aprovação humana

- [ ] **HITL-01** Implementado — Server Action `approveRun(runId, {editedOutput?})`: aprova o checkpoint pendente (opcionalmente com output editado) e enfileira `run.resume`. (dep: RUN-04, ENG-11)
  - [ ] Testado — Integração: output editado é o que o próximo nó recebe.
- [ ] **HITL-02** Implementado — `rejectRun(runId, reason?)`: segue a aresta "rejeitado" se existir; senão FAILED com "Rejeitado: <motivo>".
  - [ ] Testado — Integração: os dois caminhos.
- [ ] **HITL-03** Implementado — `reassignRun(runId, targetNodeId, feedback)`: rebobina os nós entre alvo e aprovação (BFS descendentes ∩ ancestrais); 409 se houver ACTION no trecho; o feedback entra no prompt do alvo; a aprovação pausa de novo.
  - [ ] Testado — Integração: o alvo reexecuta com o feedback e pausa de novo; ACTION no trecho → 409.
- [ ] **HITL-04** Implementado — Banner de aprovação na página de run e no chat do squad: mostra o output do nó anterior (markdown seguro), permite editar, **anexar imagens (S3) que chegam de fato ao próximo nó** (corrige `stepImages`) e escolher aprovar, rejeitar ou devolver. (dep: HITL-01..03, UI-07)
  - [ ] Testado — e2e: aprovar com imagem anexada → o próximo nó recebe a URL da imagem no input.
- [ ] **HITL-05** Implementado — Timeout de aprovação por nó (`expiresIn`, default 72 h) com ação ao expirar (`cancel` ou `approve`) via job `approval.expire`; aviso 24 h antes.
  - [ ] Testado — Integração: timeout de 2 s → a ação configurada é aplicada; audit registrado.
- [ ] **HITL-06** Implementado — `pending_actions` para ações com efeito colateral quando a política do agente for `always_side_effects`: params cifrados, resumo legível, nível de risco, TTL, aprovar/negar com transição atômica (`UPDATE … WHERE status='pending'`), execução única. (dep: ENG-13)
  - [ ] Testado — Integração: 2 aprovações concorrentes → 1 execução; expirada → não executa.
- [ ] **HITL-07** Implementado — Central de aprovações `/approvals` (checkpoints + pending actions da org) com contador na sidebar ao vivo via `/api/org/stream` e notificação in-app/email.
  - [ ] Testado — e2e: um run pausa → o contador sobe sem refresh; aprovar pela central → o run segue.

### ARC — Copiloto do Arquiteto

- [ ] **ARC-01** Implementado — `squad_architect_plans` + regras de domínio (1 a 8 agentes, tier light/deep, provider kebab-case, só draft é editável). (dep: ENG-01)
  - [ ] Testado — Unit: validações de shape e de editabilidade.
- [ ] **ARC-02** Implementado — Geração em 2 etapas: raciocínio em markdown (**streaming para a UI**) + `generateObject` com Zod (domain, proposedName, description, agentsPlan, connectorsPlan, pontos de aprovação sugeridos). Roda no worker (`architect.turn`). (dep: RUN-03)
  - [ ] Testado — Integração com adapter mock: o plano persiste em draft; os tokens do raciocínio chegam por SSE antes do plano final.
- [ ] **ARC-03** Implementado — Edição XOR: `patch` (campos) **ou** `followupMessage` (regera com o briefing acrescido); recalcula o custo.
  - [ ] Testado — Unit: ambos ou nenhum → 422; plano aprovado → 409.
- [ ] **ARC-04** Implementado — Custo estimado por run a partir do `pricing.ts` (tokens médios por tier e modelo) exibido no plano.
  - [ ] Testado — Unit: plano 2 light + 1 deep = valor esperado.
- [ ] **ARC-05** Implementado — `connected` de cada conector calculado no servidor a partir de `org_integrations` ativas; botão "Conectar" inline (Nango) que recarrega o plano ao concluir. (dep: INT-01)
  - [ ] Testado — Integração: conectar o GitHub → o plano recarregado mostra `connected: true`.
- [ ] **ARC-06** Implementado — Aprovar: claim atômico (`UPDATE … WHERE status='draft'`) + transação que cria o squad (draft), reaproveita agentes da biblioteca por nome (case-insensitive) ou cria, monta o DAG `TRIGGER → agentes → (APPROVAL sugeridos) → END` e valida. Responde `{planId, squadId}`; corrida → 409. (dep: SQD-07, ENG-04)
  - [ ] Testado — Integração: 2 aprovações simultâneas → 1 squad; falha no meio → nada criado (rollback).
- [ ] **ARC-07** Implementado — Editar squad existente pelo Copiloto: plano com `target_squad_id` gera um **diff** aplicado ao rascunho da squad (não duplica); a UI mostra o diff antes de aplicar. (dep: ENG-24)
  - [ ] Testado — Integração: pedir "adicione um revisor" → o rascunho ganha 1 nó; nenhuma squad nova.
- [ ] **ARC-08** Implementado — Sem estado global de módulo (`_currentConversationId` removido); estado da conversa em `architect_conversations.state`; conversas listáveis, renomeáveis e deletáveis pelo dono. (dep: SEC-03)
  - [ ] Testado — Integração: 2 conversas concorrentes do mesmo usuário não se misturam.
- [ ] **ARC-09** Implementado — Sherlock real: `safeFetch` + extração de conteúdo legível (Readability) + resumo por LLM com citação das URLs; falha de fetch explícita (nunca inventa). (dep: SEC-07)
  - [ ] Testado — Integração com servidor HTTP local: o resumo contém trecho real da página; URL inacessível → mensagem de erro, não conteúdo alucinado.
- [ ] **ARC-10** Implementado — Tela do Copiloto em modal (a partir de `/squads` e do chat) com sugestões de briefing, streaming, plan card (agentes, tier, conectores, custo, domínio) e CTA "Aprovar e criar" → navega para a squad.
  - [ ] Testado — e2e: briefing → plano → ajuste por follow-up → aprovar → squad criada com os agentes do plano.

### SQD — Produto Squads

- [ ] **SQD-01** Implementado — 13 domínios (DEV, MARKETING, HR, CS, PROJECTS, FINANCE, SALES, LEGAL, DATA, ECOMMERCE, IT_SUPPORT, OPERATIONS, CUSTOM) com ícone, cor, líder e i18n; `resolveDomainMeta` seguro (`Object.hasOwn`, desconhecido → CUSTOM).
  - [ ] Testado — Unit: `toString`/`__proto__` → CUSTOM; ícones e cores únicos.
- [ ] **SQD-02** Implementado — Catálogo de templates por domínio, cada um **validado e executável**:
  - os 4 atuais (`dev-team`, `instagram-carousel`, `marketing-agency`, `support-team`);
  - `dev-pipeline` (DEV-05), `marketing-content`, `hr-recruiting`, `cs-triage`, `projects-management`, `finance-reconcile`;
  - 1 por domínio novo (SALES, LEGAL, DATA, ECOMMERCE, IT_SUPPORT, OPERATIONS).

  (dep: ENG-03)
  - [ ] Testado — Unit: todos os templates passam no `validateSquadGraph` sem errors; e2e: 3 templates rodam em dry-run até o fim.
- [ ] **SQD-03** Implementado — Hub `/squads` (RSC) com abas `?tab=`: Minhas squads, Agentes, Execuções, Agendamentos, Integrações e Configurações. Filtro por domínio e busca.
  - [ ] Testado — e2e: cada aba carrega sem spinner duplo; tab inválida → default.
- [ ] **SQD-04** Implementado — Overview agregado em **uma** query: total, ativas, runs do mês, roster (agentes ordenados por nº de squads) e "colaboração ao vivo" (último Handoff/Message) atualizada via stream.
  - [ ] Testado — Integração: valores corretos no seed; no máximo 1 query SQL (contagem via log do drizzle).
- [ ] **SQD-05** Implementado — Criar squad: em branco, a partir de template (galeria com preview do grafo) ou pelo Copiloto. Server Action com Zod; nasce `draft`.
  - [ ] Testado — e2e: os 3 caminhos criam a squad e levam ao detalhe.
- [ ] **SQD-06** Implementado — Detalhe da squad:
  - header (domínio, status, versão);
  - composição (agentes na ordem do grafo, persona, badge de tier);
  - ações: abrir builder, executar (input JSON opcional), dry-run, publicar versão, pausar e arquivar;
  - cost-guards editáveis (admin);
  - histórico de versões;
  - zona de perigo (deletar com confirmação).

  (dep: ENG-24)
  - [ ] Testado — e2e: editar cost-guard persiste; member não vê a zona de perigo nem os campos de admin.
- [ ] **SQD-07** Implementado — Biblioteca de agentes da org: migração `agents.squad_id` → `agents.org_id` + referência pelos nós; aba Agentes com "Contratar agente" (wizard com persona, modelo, skills, budget); detalhe e edição do agente; "usado em N squads". (dep: ENG-02)
  - [ ] Testado — Integração: o mesmo agente em 2 squads; editar a persona reflete nas duas.
- [ ] **SQD-08** Implementado — Persona (cor, traço, registro de linguagem) aplicada no prompt do AGENT e na UI (avatar, swimlane, escritório).
  - [ ] Testado — Unit: o prompt contém traço e registro; a UI usa a cor.
- [ ] **SQD-09** Implementado — Grants de conector por agente (`none|read|read_write`, política de aprovação): `read` filtra tools com efeito colateral. (dep: ENG-09)
  - [ ] Testado — Unit: agente com `read` não recebe a tool `publish`.
- [ ] **SQD-10** Implementado — Duplicar squad (copia a versão atual como rascunho de uma squad nova, nome "(cópia)").
  - [ ] Testado — Integração: a cópia é independente.
- [ ] **SQD-11** Implementado — Aba Configurações **editável** (tabela de squads com kill switch, tetos e status inline) + parada de emergência (ENG-19). A Adalink só tem leitura.
  - [ ] Testado — e2e: alternar o kill switch na tabela persiste e bloqueia o próximo run.

### TRG — Gatilhos

- [ ] **TRG-01** Implementado — Agendamentos `once|cron|interval` com timezone IANA **editável**, `next_run_at` sempre calculado (cron-parser), `describeCron` em pt-BR, presets, input opcional, ativar/desativar. Parser portado de `schedule-trigger-config.ts` da Adalink.
  - [ ] Testado — Unit: parser (cron inválido, `runAt` no passado, timezone inválida, intervalo mínimo); `next_run_at` correto em América/São_Paulo.
- [ ] **TRG-02** Implementado — Disparo via pg-boss (`squad.schedule.tick`): cria o run com `trigger_type=schedule`, atualiza contadores e `next_run_at`; pula se a squad não estiver ativa; `once` se desativa após disparar. (dep: RUN-01)
  - [ ] Testado — Integração: um cron de 1 min dispara 2 vezes em 2 min; squad pausada → pulado e registrado.
- [ ] **TRG-03** Implementado — Webhooks por squad: `endpoint_path` único (slug), secret com hash, métodos permitidos, rotacionar secret, ativar/desativar. Rota pública `/api/hooks/squads/[path]` com HMAC (`x-orbitmind-signature: sha256=`) ou `?token=`; o corpo vira `{{trigger.body}}`.
  - [ ] Testado — Integração: assinatura válida → 202 + run; inválida → 401; desativado → 404.
- [ ] **TRG-04** Implementado — GitHub: criar a assinatura cria o hook no repo via API (secret nosso); receiver `/api/hooks/github/[subscriptionId]` com `X-Hub-Signature-256`, sempre 200; normalizador (`issues`, `pull_request`, `issue_comment`, `push`) → evento interno `github.*`. (dep: INT-01, TRG-05)
  - [ ] Testado — Unit do normalizador (4 eventos + ping → null) + integração: payload assinado de issue aberta dispara a squad inscrita.
- [ ] **TRG-05** Implementado — Assinaturas de evento (`event_subscriptions`): eventos internos (`squad.run.completed`, `squad.run.failed`, `github.*`, `custom`) com filtros de igualdade; encadear squads com anti-loop (profundidade ≤ 3).
  - [ ] Testado — Integração: squad A concluída dispara squad B; um ciclo A→B→A para na profundidade 3.
- [ ] **TRG-06** Implementado — UI de gatilhos na squad (aba Agendamentos): lista de schedules, webhooks e GitHub com URL copiável e último disparo.
  - [ ] Testado — e2e: criar os 3 tipos pela UI.

### BLD — Builder visual

- [ ] **BLD-01** Implementado — `/squads/[id]/builder` com `@xyflow/react` via `next/dynamic` (`ssr:false`), carregando o rascunho no servidor; catálogo de nós (10 tipos) com busca; arrastar, conectar e deletar; minimap e controles. (dep: ENG-24)
  - [ ] Testado — e2e: montar TRIGGER → AGENT → END e salvar; recarregar mostra o mesmo grafo.
- [ ] **BLD-02** Implementado — Painel de configuração por nó:
  - AGENT: agente da biblioteca, tier, instruções, variáveis com **seletor de ancestrais** `{{alias}}`, veto;
  - CONDITION/ROUTER: expressão e rotas;
  - APPROVAL: mensagem e timeout;
  - ACTION: skill, operação e parâmetros;
  - LOOP, PARALLEL e DELAY.
  - [ ] Testado — e2e: configurar cada tipo de nó e salvar; o seletor só oferece ancestrais.
- [ ] **BLD-03** Implementado — Undo/redo (50 níveis) com atalhos, autosave do rascunho (debounce 1 s) e indicador "salvo/salvando".
  - [ ] Testado — Unit do histórico + e2e: Ctrl+Z desfaz a adição de nó.
- [ ] **BLD-04** Implementado — Validação ao vivo (ENG-04) com badges por nó e diálogo de publicação que lista errors (bloqueiam) e warnings.
  - [ ] Testado — e2e: um nó AGENT sem agente mostra o badge; publicar fica bloqueado até corrigir.
- [ ] **BLD-05** Implementado — Executar ou dry-run a partir do builder com painel ao vivo e **destaque do nó ativo** via SSE (a Adalink deixou isso inerte). (dep: OBS-02)
  - [ ] Testado — e2e: durante o run, o nó em execução fica destacado e os concluídos ficam verdes.
- [ ] **BLD-06** Implementado — Posições persistidas (round-trip) e tipos de nó sempre normalizados em maiúsculas (evita os bugs da Adalink).
  - [ ] Testado — Unit dos conversores DTO ↔ xyflow.
- [ ] **BLD-07** Implementado — Auto-layout (elkjs/dagre) para squads importados, migrados ou gerados pelo Copiloto.
  - [ ] Testado — Unit: grafo sem posições recebe posições sem sobreposição.

### MKT — Marketplace

- [ ] **MKT-01** Implementado — Publicar squad no marketplace (admin): snapshot imutável da versão publicada (grafo + agentes sem segredos), número de versão, categoria/domínio, descrição e capa. (dep: ENG-24)
  - [ ] Testado — Integração: o snapshot não contém credenciais nem IDs de integração da org de origem.
- [ ] **MKT-02** Implementado — Instalar em transação, idempotente por `(org_id, item_id)`: cria a squad (draft), os agentes na biblioteca e o grafo; código único com sufixo (**corrige o 500 de re-adquirir**).
  - [ ] Testado — Integração: instalar 2× → 1 squad (a 2ª devolve a existente); instalação concorrente → 1 squad.
- [ ] **MKT-03** Implementado — Pós-instalação: checklist do que falta (conectar integrações exigidas, revisar agentes, publicar), com links.
  - [ ] Testado — e2e: instalar um item que exige GitHub mostra o passo "Conectar GitHub".
- [ ] **MKT-04** Implementado — Atualizações: nova versão publicada no item → badge "atualização disponível" para quem instalou; atualizar gera um rascunho novo com diff (não sobrescreve customizações sem confirmação).
  - [ ] Testado — Integração: publicar v2 → a org instaladora vê a atualização; aplicar cria o rascunho v2.
- [ ] **MKT-05** Implementado — Desinstalar (arquiva a squad instalada e remove a aquisição).
  - [ ] Testado — Integração.
- [ ] **MKT-06** Implementado — Página de detalhe do item com preview do grafo (read-only), agentes, integrações exigidas e custo estimado.
  - [ ] Testado — e2e.
- [ ] **MKT-07** Implementado — Itens do seed válidos e executáveis (**corrige "0 steps"**). (dep: DB-07)
  - [ ] Testado — e2e: instalar cada item do seed e rodar em dry-run até o fim.

### INT — Integrações

- [ ] **INT-01** Implementado — Nango correto: `createConnectSession` com `allowed_integrations` = o provider clicado; o front envia `event.payload.connectionId` ao servidor; `org_integrations` grava `connection_id` + `provider_config_key`; todas as chamadas usam esses valores (**corrige `connectionId = orgId`**).
  - [ ] Testado — Integração com Nango mockado: conectar grava o id real; a chamada de proxy usa esse id.
- [ ] **INT-02** Implementado — Erros de integração propagam: `request()` lança `IntegrationError` tipado; a UI mostra a falha real (sem "sucesso" falso em run, toggle ou installer).
  - [ ] Testado — Unit: 401 do provider → erro com mensagem amigável; e2e: toggle com falha mostra toast de erro.
- [ ] **INT-03** Implementado — Desconectar remove a conexão no Nango e marca `disconnected`.
  - [ ] Testado — Integração: a chamada DELETE ao Nango ocorre.
- [ ] **INT-04** Implementado — Catálogo honesto: premium = somente integrações implementadas de ponta a ponta (GitHub, Slack, WordPress, Instagram, LinkedIn, Google Drive — confirmar lista no PR). As demais ficam como "em breve"; as ~20 rotas inexistentes de `fetchOptions` e as 38 classes mortas são removidas ou implementadas.
  - [ ] Testado — Unit: todo `fetchOptions` aponta para uma rota existente (teste varre o catálogo); `knip` sem classes órfãs.
- [ ] **INT-05** Implementado — Ao conectar o GitHub, oferecer registrar webhooks (TRG-04).
  - [ ] Testado — e2e com mock.
- [ ] **INT-06** Implementado — Skills com credenciais funcionando de ponta a ponta (Instagram, LinkedIn, Canva, Blotato, Apify): configurar em Settings → teste de skill → uso em run. (dep: ENG-09, ENG-22)
  - [ ] Testado — Integração com APIs mockadas: um run com a skill `instagram-publisher` chama a API com o token configurado.
- [ ] **INT-07** Implementado — Tela `/pipeline` (esteira GitHub) funcionando com o `connectionId` correto: listar, toggle, disparar e editar agentes do repo. (dep: INT-01, PERF-10)
  - [ ] Testado — Integração com GitHub mockado: os 4 fluxos.
- [ ] **INT-08** Implementado — Webhooks de integração (Slack, Jira, Linear) implementados ou removidos — sem stubs vazios. Decisão registrada no PR.
  - [ ] Testado — Unit dos handlers mantidos.

### DEV — Esteira de desenvolvimento autônoma

- [ ] **DEV-01** Implementado — Porta `SandboxProvider` (`create`, `exec`, `writeFile`, `readFile`, `gitClone`, `destroy`) com E2B + `NullSandboxProvider`; validações anti-injeção (repo só HTTPS, ref e dir por regex, `--` antes dos args) e token via `GIT_ASKPASS`.
  - [ ] Testado — Unit: repoUrl malicioso, ref com `;` e dir com `..` são rejeitados; o token nunca aparece nos args.
- [ ] **DEV-02** Implementado — Tier DEEP: Claude Agent SDK no sandbox (clone, Read/Write/Edit/Bash, commit) com timeout de 15 min e uso/custo extraídos; sem sandbox configurado → erro claro (ou fallback LIGHT se configurado). (dep: DEV-01, ENG-09)
  - [ ] Testado — Integração com sandbox fake: o nó DEEP produz alterações de arquivo e custo registrado.
- [ ] **DEV-03** Implementado — Operações GitHub de escrita como ACTION/skill: get ref, criar branch, commit de arquivo, abrir PR, listar arquivos do PR, criar review, merge (squash), release, status de commit.
  - [ ] Testado — Unit com a API do GitHub mockada: cada operação monta a request correta.
- [ ] **DEV-04** Implementado — LOOP `retryUntilGreen` lendo o status de CI do commit. (dep: ENG-15, DEV-03)
  - [ ] Testado — Integração: CI falha 2× e passa na 3ª → verde.
- [ ] **DEV-05** Implementado — Template `dev-pipeline`: issue aberta → Implementador (DEEP) → branch → PR → auto-fix até verde → revisão humana (APPROVAL) → merge → Docs (LIGHT) → release. (dep: DEV-02..04, TRG-04)
  - [ ] Testado — `validateSquadGraph` sem errors + dry-run completo.
- [ ] **DEV-06** Implementado — Execução real em repositório de teste (`orbitmind-sandbox-repo`) documentada.
  - [ ] Testado — Manual registrado no log: uma issue real gerou um PR mergeado pela esteira.

### UI — Funcionalidades de interface quebradas

- [ ] **UI-01** Implementado — "Nova task" no board (dialog + Server Action) com squad, agente, prioridade e tipo.
  - [ ] Testado — e2e.
- [ ] **UI-02** Implementado — Board: seletor de squad (`?squad=`), coluna **blocked**, desatribuir agente persiste, edição com debounce (sem PATCH por tecla), drag-and-drop otimista.
  - [ ] Testado — e2e: os 4 comportamentos.
- [ ] **UI-03** Implementado — Membros: convidar por email (link com token de uso único, expira em 7 dias); a página `/invite/[token]` define a senha e entra na org; listar membros, trocar papel e remover (owner/admin).
  - [ ] Testado — e2e: convite → aceite → login do convidado na org com o papel certo; token expirado → erro.
- [ ] **UI-04** Implementado — Deletar organização (owner): confirmação digitando o nome, exclusão em cascata, cancelamento de jobs e logout.
  - [ ] Testado — Integração: após deletar, não restam linhas da org em nenhuma tabela.
- [ ] **UI-05** Implementado — Plano e uso reais na sidebar e em Settings (runs do mês, custo do mês, limites do plano); sem valores fixos. O botão "Upgrade" vira "Falar com vendas" (mailto) até existir billing.
  - [ ] Testado — Integração: o contador reflete os runs do seed; grep sem `value={3}` / "3/100".
- [ ] **UI-06** Implementado — Chat: resposta via stream (sem polling), histórico paginado ("carregar anteriores"), **sem o travamento com ≥ 50 mensagens**, indicador de digitação correto. (dep: RUN-03, OBS-03)
  - [ ] Testado — e2e: conversa com 60 mensagens recebe a resposta nova.
- [ ] **UI-07** Implementado — Upload de arquivos (S3/MinIO, D-13): anexos no chat e imagens no checkpoint, com URL assinada, limite de tamanho e tipos permitidos. MinIO adicionado ao docker-compose.
  - [ ] Testado — Integração: upload → URL assinada acessível; tipo proibido → 400.
- [ ] **UI-08** Implementado — Componentes interativos do chat (seletor de ângulo, tom e aprovar/editar/rejeitar) ligados a mensagens estruturadas emitidas pelo backend (`metadata.type`), ou removidos.
  - [ ] Testado — e2e: um squad de conteúdo apresenta ângulos e a escolha chega ao próximo nó.
- [ ] **UI-09** Implementado — i18n real com next-intl: pt-BR, en e es; strings extraídas de todas as telas; idioma por usuário (fallback: org) em Settings. (dep: D-12)
  - [ ] Testado — e2e: trocar para inglês traduz sidebar, squads e run; teste de chaves faltantes no CI.
- [ ] **UI-10** Implementado — Rótulos de modelo reais por provider e tier na tela de agentes (sem "Opus"/"Haiku" fixos).
  - [ ] Testado — Unit do mapeamento.
- [ ] **UI-11** Implementado — Estados padrão em todas as telas: skeleton, erro com "Tentar de novo" (`error.tsx` por rota) e vazio com CTA.
  - [ ] Testado — e2e: forçar erro de API em 3 rotas mostra o `error.tsx`.
- [ ] **UI-12** Implementado — Card de agente abre o detalhe e a edição (SQD-07).
  - [ ] Testado — e2e.
- [ ] **UI-13** Implementado — Help atualizado com as funcionalidades novas (DAG, aprovações, gatilhos, marketplace, API).
  - [ ] Testado — Revisão manual registrada.
- [ ] **UI-14** Implementado — Onboarding por usuário: member não fica preso num tour que reabre (corrige o 403 silencioso). (dep: PERF-14)
  - [ ] Testado — e2e: um member conclui o tour e ele não reabre.
- [ ] **UI-15** Implementado — Notificações in-app (sino na TopBar) alimentadas por `notifications` + `/api/org/stream`.
  - [ ] Testado — e2e: um run falha → notificação aparece sem refresh.

### CLI — `orbitmind` CLI

- [ ] **CLI-01** Implementado — `packages/cli/src/index.ts` com commander (`init`, `doctor`, `deploy`) e `bin` funcional; publicado como `@orbitmind/cli`.
  - [ ] Testado — Unit/integração: `node dist/index.js --help` lista os comandos.
- [ ] **CLI-02** Implementado — `init`: porta 5434, gera `.env` completo (incluindo `ENCRYPTION_KEY`, `AI_GATEWAY_API_KEY`), sobe o docker, roda migrate + seed.
  - [ ] Testado — Integração em diretório temporário: `.env` gerado passa na validação do FND-06.
- [ ] **CLI-03** Implementado — `doctor` (checa env, db, worker, AI Gateway) e `deploy` (gera `render.yaml`/Dockerfile a partir do template).
  - [ ] Testado — Unit: `doctor` reporta um env faltando; `deploy` gera arquivos válidos.

### DOC — Documentação

- [ ] **DOC-01** Implementado — `CLAUDE.md` atualizado: escritório em PixiJS 8 (isométrico 2.5D; o `main` ainda tem a versão three.js até o merge da branch do redesign), worker + pg-boss, SSE, padrão de páginas, testes, protocolo deste PRD.
  - [ ] Testado — Revisão manual registrada.
- [ ] **DOC-02** Implementado — README com setup real (web + worker + MinIO), números reais e arquitetura nova.
  - [ ] Testado — Uma sessão nova segue o README do zero e sobe o app (registrado no log).
- [ ] **DOC-03** Implementado — `docs/architecture/`: `dag-spec.md` (substitui `pipeline-spec.md`), `realtime-spec.md`, `frontend-patterns.md`, `rbac.md`.
  - [ ] Testado — Revisão manual registrada.
- [ ] **DOC-04** Implementado — `docs/runbook.md`: filas, reaper, rotação de chaves, parada de emergência, restore de backup e troubleshooting.
  - [ ] Testado — Revisão manual registrada.

### QA — Regressão e carga

- [ ] **QA-01** Implementado — Cenários de regressão da Adalink (seção 9 do `.claude/skills/regression-test/SKILL.md` em `Adalink-Agents-Pipeline`) convertidos em testes: domínio desconhecido, contrato de `squadId`, reassign pausa de novo, round-trip de posição, tipo de nó em maiúsculas, plano com conector sem aviso, etc.
  - [ ] Testado — Os testes existem e passam; o PR lista o mapeamento cenário → teste.
- [ ] **QA-02** Implementado — E2E dos fluxos principais:
  - (1) Copiloto → squad → publicar → rodar → aprovar → concluir;
  - (2) agendar e disparar;
  - (3) webhook dispara;
  - (4) marketplace instalar e rodar;
  - (5) reassign;
  - (6) parada de emergência.
  - [ ] Testado — Os 6 specs verdes no CI.
- [ ] **QA-03** Implementado — Teste de carga leve: 30 runs concorrentes de 2 orgs sem colisão, com custo correto por run e reaper ocioso.
  - [ ] Testado — Relatório anexado ao PR (tempo, erros = 0).
- [ ] **QA-04** Implementado — Revisão de segurança final (`/security-review`) sobre o branch consolidado, sem achados críticos ou altos abertos.
  - [ ] Testado — Relatório registrado no log.

---

## 6. Marcos e sequência

| Marco | Objetivo | Itens | Critério de saída |
|---|---|---|---|
| **M0 — Fundação** | Base segura e testável | FND-01..07, DB-01, DB-03, SEC-01..05 | CI verde; suíte cross-tenant e RBAC cobrindo 100% das rotas atuais |
| **M1 — Instantâneo** `[paralelo com M2]` | O1 atingido | PERF-01..16, PERF-18..22, DB-02, DB-04..06 | `perf:nav` verde (exceto rotas que dependem de OBS) |
| **M2 — Runtime durável** | Nada roda fire-and-forget | RUN-01..12, SEC-06..18 | Run sobrevive a restart; `/api/v1` funcional com token |
| **M3 — Motor DAG** | Squads como grafo | ENG-01..25, DB-07, HITL-01..03 | Todos os tipos de nó testados; seed migrado roda |
| **M4 — Tempo real e HITL** | O5 atingido | OBS-01..11, HITL-04..07, PERF-17, PERF-23..24, UI-06, UI-15 | Timeline ao vivo; escritório real; central de aprovações |
| **M5 — Produto** | Paridade com a Adalink | SQD-01..11, ARC-01..10, TRG-01..06 | E2E QA-02 fluxos 1, 2 e 3 verdes |
| **M6 — Builder, marketplace e integrações** | Criação visual e ecossistema | BLD-01..07, MKT-01..07, INT-01..08 | E2E QA-02 fluxo 4 verde |
| **M7 — Esteira dev e acabamento** | Diferencial + polimento | DEV-01..06, UI-01..05, UI-07..14, CLI-01..03, DOC-01..04, QA-01, QA-03, QA-04 | Todos os itens marcados; QA-04 sem achados altos |

**Exceção de ordem:** INT-01 pode ser puxado para M2, porque PERF-10 e ARC-05 dependem dele.

## 7. Definição de pronto (vale para todo item)

- Código em PR com Summary + Test Plan citando os IDs do PRD.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` e `pnpm build` verdes no CI.
- Guards de org e papel em toda rota ou action nova (a suíte SEC-02 falha se faltar).
- Nenhuma página do dashboard com `"use client"` na `page.tsx`; nenhuma rota fora do orçamento `perf:nav`.
- Strings de UI em i18n (a partir de UI-09).
- Migrations geradas (`db:generate`), nunca só `db:push`.
- Checkbox *Implementado* e *Testado* marcados com evidência, e linha no Log de sessões.

## 8. Riscos

| Risco | Mitigação |
|---|---|
| Migração de `agents.squad_id` → `org_id` e do pipeline linear para DAG quebrar dados existentes | ENG-02 com teste de migração sobre snapshot do seed antigo; backup antes de aplicar em produção |
| pg-boss com carga alta no mesmo Postgres | Pools separados (DB-03); se a fila crescer, mover o pg-boss para outro schema ou banco (troca de connection string) |
| Custo de LLM nos testes | Adapter mock por padrão; testes com LLM real só sob a tag `@live`, fora do CI |
| SSE atrás de proxies que fazem buffer | Header `X-Accel-Buffering: no`, heartbeat de 15 s e fallback de polling (OBS-03) |
| E2B indisponível ou caro | Porta com provider nulo; DEEP opcional por squad |
| Escopo grande demais por sessão | Itens pequenos e independentes; protocolo da seção 0 força um item por vez com evidência |

## 9. Log de sessões

| Data | Sessão/autor | Itens | Resultado | Bloqueios / notas |
|---|---|---|---|---|
| 2026-09-30 | Claude (auditoria) | — | PRD criado a partir da auditoria | O worktree `.claude/worktrees/feat-office-gather-redesign` é o redesign do escritório (PixiJS), não código órfão |
| 2026-09-30 | Claude (escritório) | PERF-11 (parcial), SEC-02 (parcial: `pipeline-run`, `runs/[runId]`, `squads/[id]/agents` GET), HITL-03 (parcial: "Devolver para ajustes" no checkpoint) | Escritório igual às pranchas 01, 02 e 04 na branch `worktree-feat-office-gather-redesign`; `packages/engine/src/pipeline.revise.check.ts` e `apps/web/lib/office/review-parse.check.ts` passando | Falta merge da branch; validação da página real `/office` feita com build de produção |
| 2026-10-01 | Claude (escritório) | OBS-02 (parcial: WS do escritório funcionando ponta a ponta), ENG-06 (parcial: run rejeitado grava `cancelled`, falha grava `failed`) | Tempo real verificado com build de produção + `server.ts`: PIPELINE_STARTED/CHECKPOINT_REACHED/CHECKPOINT_RESOLVED/PIPELINE_CANCELLED chegam pelo WS e o painel abre/fecha sozinho; rotação, som e caminhada conferidos por captura | `AI_GATEWAY_API_KEY` vazio no .env local impede testar etapas com agente; checkpoint ainda em memória (RUN-04) |
