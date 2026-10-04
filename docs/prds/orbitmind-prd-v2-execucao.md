# PRD v2: checklist de execução

> **Para quem:** o agente que vai implementar o PRD v2, item por item.
> **Criado em:** 2026-10-03, a partir da leitura completa do [PRD v2](orbitmind-prd-v2.md), da [auditoria](../analysis/auditoria-2026-09-30.md) e do estado do repositório nesse dia.
> **Relação com o PRD:** o PRD continua sendo a fonte de verdade de *o que* fazer e de *quando está pronto* (critérios de aceite e checkboxes Implementado/Testado). Este arquivo define **a ordem** de execução, **as regras** de trabalho e **as armadilhas** já conhecidas. Um passo daqui só é marcado quando todos os IDs dele estiverem com Implementado **e** Testado marcados no PRD.

---

## 1. Regras duras (valem para todo passo)

1. **Sem stub, sem parcial, sem gambiarra.** Isso inclui:
   - função que retorna valor fixo, `throw new Error("not implemented")`, TODO/FIXME, rota 410 ou "em breve" falso, botão sem ação;
   - `try/catch` que engole erro, `as any`, `as unknown as X` para calar o `tsc`, `@ts-ignore`;
   - `eslint-disable` sem justificativa;
   - teste com `.skip`/`.todo`, ou teste que não falharia se o código estivesse errado.
2. **Mock só dentro de teste**, e só onde o critério do PRD permite: adapter de LLM, providers OAuth (GitHub, Slack, Google…), Vercel Sandbox e transport de email. Código de produção nunca tem caminho mock ou demo, exceto o `?demo=1` do escritório, que o próprio OBS-07 pede.
3. **Não feche item pela metade.** Se faltar chave, decisão ou dependência, pare e pergunte ao Wesley. Nesse caso não marque o item, não entregue parte dele e não deixe o "resto para depois".
4. **Parciais herdados viram completos.** Do HITL-03, ENG-06, OBS-02, SEC-02 e PERF-11 já existe uma parte. Ao chegar neles:
   - aproveite o que existe;
   - leve até o critério do PRD;
   - apague o que ficar obsoleto (ex.: a rota `runs/[runId]/revise` linear quando o reassign em DAG existir).
5. **Antes de marcar Implementado,** rode e cole o resumo no PR:
   - `pnpm typecheck`, `pnpm lint` e `pnpm test`;
   - `pnpm build` quando mexer em `apps/web` (demora: rode em background).
6. **Antes de marcar Testado:** o teste citado com 🧪 cobre o critério de aceite **e** falharia sem a mudança. Confira isso revertendo a mudança mentalmente ou de fato. Typecheck não conta.
7. **Decisões D-01 a D-14 estão tomadas.** Não reabra nenhuma. Se uma se mostrar inviável, registre no Log e pergunte antes de mudar.
8. **Repositórios da Adalink são só leitura.** Nada de checkout, restore, commit ou `pnpm install` neles (ver §3).
9. **O `CLAUDE.md` global** em `C:\Users\Users\Documents\github` é do cg_platform e **não vale aqui**. Valem o `CLAUDE.md` da raiz deste repositório e este arquivo.
10. **Ao fim de cada marco, pare.** Mande ao Wesley:
    - o que ficou Implementado + Testado;
    - o que ficou pendente e por quê;
    - o que vem a seguir.

    Depois espere a revisão do Opus antes de seguir.

## 2. Fluxo git por item

Decidido em 2026-10-03: **tudo vai para a `main`**. A `main` não tem proteção de branch.

1. Atualize a main: `git checkout main && git pull`. Crie a branch `feat/<id-minusculo>-<slug>` a partir dela. Itens pequenos do mesmo épico podem dividir branch, desde que o PR liste todos os IDs.
2. Faça commits em português, no padrão Conventional Commits, explicando o **porquê** da mudança.
3. Rode as verificações da regra 5 e faça push.
4. Abra a PR para a `main` com `gh pr create`. O body tem Summary (bullets com os IDs) e Test Plan (comandos rodados, saída resumida, testes 🧪).
5. Faça um commit na própria branch que:
   - marca Implementado/Testado no PRD com `✅ PR #N (data)` e `🧪 caminho`;
   - adiciona a linha no Log de sessões (seção 9).
6. Com o CI verde (a partir do FND-04) e as verificações locais verdes, rode `gh pr merge --squash --delete-branch`.
7. Se o CI falhar, corrija na mesma branch. Nunca mergeie com vermelho.

## 3. Ambiente local (armadilhas conhecidas)

- **Postgres:** suba com `docker compose up -d` na raiz (porta 5434). No `DATABASE_URL`, use **127.0.0.1**, nunca `localhost` (no Windows o Node tenta IPv6 primeiro e a conexão estoura o timeout).
- **Seed:** login `admin@orbitmind.com` / `admin123`. O squad "QA · Escritório" (`qa-office`) começa num checkpoint e serve para testar sem LLM.
- **Arquivos `.env`:** o `.env` real está em `apps/web/.env`, porque o Next só lê env da pasta do app. Hoje existe também um `.env` e um `.env.example` na raiz.
  - Os valores vazios hoje: `AI_GATEWAY_API_KEY`, `NANGO_SECRET_KEY`, `NANGO_PUBLIC_KEY`, `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`.
  - Nunca invente nem commite segredo.
- **Servidor:**
  - `pnpm dev` e `pnpm start` sobem o `server.ts` (Next + WS).
  - O Next puro está em `dev:next` e `start:next`.
  - A máquina é lenta e o `next dev` leva minutos por rota. Para QA, use `next build` + `tsx server.ts --prod`.
  - Processo longo vai em background (`Start-Process` ou `run_in_background`), nunca em comando com timeout curto.
- **Playwright:** está em `node_modules/.pnpm/playwright@1.58.2`. Use o Chrome instalado. Para WebGL headless, use `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- **Docker Desktop:** sobe containers de outros projetos (cg_platform, orbita…). Não mexa neles.
- **Worktree antiga:** `.claude/worktrees/feat-office-gather-redesign` (branch `worktree-feat-office-gather-redesign`) **já está mergeada na main** (commit 0e6ca12). Não trabalhe nela. Removê-la só com o OK do Wesley.
- **Escritório:** é PixiJS 8 e não há mais `three` nas dependências. Qualquer mudança visual precisa continuar batendo com as pranchas do [design aprovado](https://claude.ai/artifact/9rexnXJsmz6XsE88aJcvNW). Confira em `/office-preview` (só em dev ou com `OFFICE_PREVIEW=1`).
- **Referências da Adalink:**
  - `C:\Users\Users\Documents\github\adalink-platform\apps\agents-service` (backend): os arquivos estão no disco e podem ser lidos normalmente.
  - `C:\Users\Users\Documents\github\Adalink-Agents-Pipeline` (front): **a pasta `apps/web` está vazia no disco**, mas existe no git (branch `chore/skill-review-local`). Leia sem alterar o repositório:
    ```bash
    git -C ../Adalink-Agents-Pipeline ls-tree -r --name-only HEAD apps/web/src/features/squads
    git -C ../Adalink-Agents-Pipeline show HEAD:apps/web/src/features/squads/<arquivo>
    ```
  - Cenários de regressão (QA-01): `Adalink-Agents-Pipeline/.claude/skills/regression-test/SKILL.md`, seção 9 (linha ~1214).

## 4. Estado do repositório em 2026-10-03 (ponto de partida)

- **Testes:**
  - não há Vitest, Playwright Test nem pasta `tests/`;
  - existem duas verificações soltas que rodam com `npx tsx`: `packages/engine/src/pipeline.revise.check.ts` e `apps/web/lib/office/review-parse.check.ts`.
- **Lint e CI:**
  - **não há ESLint instalado nem configurado**: o `next lint` do web não tem config e o `eslint src/` do engine não tem o pacote. Hoje `pnpm lint` não roda de verdade, e por isso o FND-08 vem primeiro;
  - não há `.github/` (sem CI).
- **Banco:**
  - uma única migration, `0000_third_red_skull.sql`, defasada: não tem `pipeline_runs` nem `quote_requests`, e a `llm_providers` está errada;
  - o banco local foi criado com `db:push`.
- **Dependências que ainda não existem:** pg-boss, worker, Server Actions (nenhum arquivo `"use server"`), lib de email, S3/MinIO.
- **Nango:** usado em 16 arquivos (`lib/integrations/nango-client.ts`, `generic-catalog.ts`, as rotas de `api/integrations/*`, `schema.ts`, `seed.ts`, `help/page.tsx`…) e nas dependências `@nangohq/frontend` e `@nangohq/node`. **Sai inteiro** no INT-01 (D-15).
- **Fire-and-forget (`void (async`)** em `api/cron`, `api/squads/[squadId]/run` e `api/v1/squads/[squadId]/run`. Chat e arquiteto também disparam trabalho solto: confira com grep por `.catch(`.
- **Uso de env:** `process.env.` aparece em 16 arquivos.
- **Templates:** `templates/squads` tem `dev-team`, `instagram-carousel`, `marketing-agency` e `support-team`.
- **Rotas:** 59 `route.ts` em `apps/web/app/api`. A meta-cobertura do SEC-02 precisa de um caso para cada uma.

## 5. Decisões tomadas em 2026-10-03 e 2026-10-04 (além das D-01 a D-13)

| Decisão | Efeito |
|---|---|
| **Ordem pelas dependências reais** | Os marcos M2 a M4 se entrelaçam conforme a §7. A mudança fica registrada no Log do PRD. |
| **D-14: email via Resend SDK** | Variáveis `RESEND_API_KEY` e `EMAIL_FROM`, módulo único `lib/email.ts`, transport mockado nos testes. Sem a chave, o envio falha com erro claro (sem log falso de sucesso). Usado por RUN-06, SEC-15, HITL-05, HITL-07, UI-03 e UI-15. |
| **D-15: sem Nango** | Integrações com OAuth 2.0 próprio por provider (PKCE, `state` assinado e preso à org e ao usuário) e token/API key para quem aceita. Credenciais cifradas pelo SEC-12 e renovadas antes do uso. Por isso o **SEC-12 sobe para antes do INT-01** (passo 1.6). O catálogo vira local e estático (PERF-09). |
| **D-06 revisada: Vercel Sandbox** | O Tier DEEP roda no Vercel Sandbox (`@vercel/sandbox`), como na Adalink. Porte `vercel-sandbox.provider.ts` e `null-sandbox.provider.ts`; **não** porte o `e2b-sandbox.provider.ts` nem o fallback entre providers da `sandbox-provider.factory.ts`. |
| **perf:nav no CI só relata até o PERF-24** | O job do FND-05 roda em todo PR e publica o relatório, mas só reprova o CI a partir do PERF-24. O script em si falha de verdade acima do orçamento (é o teste do FND-05). |
| **FND-07 anda com o RUN-02** | A regra de lint contra fire-and-forget só fica verde quando o RUN-02 tira o trabalho das rotas. Implementar os dois juntos evita uma allowlist temporária. |
| **Itens novos** | **FND-08:** ESLint em todos os pacotes. **OBS-12:** aposentar `ws`, `server.ts` e `/api/ws-token` depois do OBS-07 (D-03). Os dois já estão no PRD. |

## 6. Chaves e acessos externos: pedir ao Wesley **antes** do passo

| Precisa de | Para | Quando pedir |
|---|---|---|
| `AI_GATEWAY_API_KEY` | Validação manual de run com agente real (ENG-09 em diante; OBS-07; ARC-02; DB-07 "roda até o fim"). Os testes automatizados usam o adapter mock. | Início do passo 3.9 |
| GitHub OAuth App (`GITHUB_CLIENT_ID/SECRET`) com callback local | Validação manual do INT-01 (conectar o GitHub, `/pipeline`) e do SEC-13 (login). Um app só serve aos dois: o login pede escopos mínimos e a conexão pede `repo` e `admin:repo_hook`. | Início do passo 1.6 |
| Apps OAuth de Slack, Google (Drive), Meta (Instagram) e LinkedIn; credencial de aplicação do WordPress | Validação manual de cada integração premium (INT-04, INT-06) | Passo 6.3 |
| `RESEND_API_KEY` + domínio verificado | Envio real de email (os testes usam mock) | Primeiro item com email (RUN-06 ou SEC-15) |
| `VERCEL_SANDBOX_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID` + chave Anthropic para o Claude Agent SDK | DEV-02 (tier DEEP) | Passo 5.0 |
| Repositório `orbitmind-sandbox-repo` + token GitHub com escrita | DEV-06 (execução real da esteira) | Passo 7.x |
| Conta Render (opcional) | O RUN-08 é testado com `docker-compose.prod.yml` local. Deploy real só se o Wesley pedir. | — |

---

## 7. Sequência de execução

Formato: `- [ ] passo · IDs · branch sugerida`, seguido das armadilhas específicas do passo.

### M0: Fundação

- [ ] **0.1 · FND-08 · `feat/fnd-08-eslint`**: ESLint 9 flat config na raiz, com `typescript-eslint` e as regras do Next (`@next/eslint-plugin-next`).
  - Script `lint` em todos os pacotes (`shared` e `cli` não têm hoje). No web, troque `next lint` por `eslint .`.
  - Corrija os erros existentes de verdade. `eslint-disable` em massa não vale.
  - Teste: `pnpm lint` verde, e um erro proposital faz o lint falhar (registre no Log).
- [ ] **0.2 · FND-01 · `feat/fnd-01-vitest`**: Vitest em `shared`, `engine` e `web`, com a tarefa `test` no `turbo.json` e `pnpm test` na raiz.
  - Migre as duas verificações para `*.test.ts` e apague os `.check.ts`.
- [ ] **0.3 · FND-06 · `feat/fnd-06-env`**: schema Zod do env compartilhado por web e worker (sugestão: `packages/shared/src/env.ts`, exportado por entrada própria, consumido por `apps/web/lib/env.ts`).
  - Regra de lint que proíbe `process.env.` fora do módulo de env.
  - `.env.example` único na raiz. Remova `apps/web/.env.example` e as variáveis GitLab, Discord e Telegram.
  - Armadilha: o Next lê env de `apps/web`. Carregue o da raiz com `loadEnvConfig` do `@next/env` no `next.config.ts` ou documente onde o `.env` mora. Decida e registre.
- [ ] **0.4 · DB-01 · `feat/db-01-migrations`**: apague a migration defasada e gere uma baseline nova a partir do `schema.ts`.
  - O banco local veio do `db:push`, então o `db:migrate` não roda em cima dele. **Pergunte ao Wesley antes de apagar o volume `postgres_data`.** O seed recria os dados.
  - Armadilha: `drizzle-kit check` não compara o schema com as migrations. Para provar "sem diff", rode `drizzle-kit generate` e `git diff --exit-code` na pasta de migrations. Corrija o critério no PRD (regra 8 da seção 0).
- [ ] **0.5 · DB-03 · `feat/db-03-pool`**: pool singleton em `globalThis` e `DB_POOL_MAX`. O pool do worker é criado no RUN-01, mas a API já nasce preparada para ele.
- [ ] **0.6 · FND-02 · `feat/fnd-02-test-db`**: serviço `postgres-test` (5435) no compose e `withTestDb()`, que migra uma vez e trunca entre testes.
- [ ] **0.7 · SEC-01 · `feat/sec-01-guards`**: guards em `lib/auth/guards.ts`. Queries de domínio passam a exigir `orgId` na assinatura.
- [ ] **0.8 · SEC-05 · `feat/sec-05-middleware`**: `/api/*` sem sessão devolve 401 JSON; matcher sem assets; rotas públicas explícitas.
- [ ] **0.9 · SEC-02 · `feat/sec-02-cross-tenant`**: guard em **todas** as rotas, completando o parcial existente.
  - A suíte `tests/security/cross-tenant.test.ts` chama os handlers direto, com `auth()` mockado e duas orgs no banco de teste.
  - Um teste de meta-cobertura varre os `route.ts` e falha se algum ficar sem caso.
- [ ] **0.10 · SEC-03 · `feat/sec-03-architect-tenant`**: tabela `architect_conversations` (migration), remoção do squad fixo `…a0c41ec70001`, snapshot preso à org da sessão.
  - Decida e registre o que acontece com as conversas antigas que estão em `messages.metadata`: migrar para a org certa ou descartar.
- [ ] **0.11 · SEC-04 · `feat/sec-04-rbac`**: matriz em `packages/shared/src/rbac.ts` aplicada no servidor, com a suíte `tests/security/rbac.test.ts`.
  - "Aprovar checkpoints próprios" (member) exige saber quem disparou o run. Confira se `pipeline_runs` guarda isso. Se não guardar, adicione a coluna na migration deste passo.
- [ ] **0.12 · FND-03 · `feat/fnd-03-playwright`**: `@playwright/test`, um seed de teste determinístico separado do seed demo (org A e org B × owner, admin, member e viewer) e fixture de login por papel.
- [ ] **0.13 · FND-05 · `feat/fnd-05-perf-nav`**: `pnpm perf:nav` contra `next build && next start`.
  - Cada `page.tsx` do dashboard ganha um marcador `data-ready` no conteúdo final.
  - O script falha acima do orçamento.
- [ ] **0.14 · FND-04 · `feat/fnd-04-ci`**: `.github/workflows/ci.yml` com install (cache pnpm), typecheck, lint, test (serviço Postgres), `db:migrate` + checagem de diff (DB-01), build, e2e e perf:nav (só relatório, §5).
  - Teste: abrir uma PR descartável com erro de tipo, ver o CI falhar, registrar e fechar a PR sem merge.
- [ ] **0.15 · Fechar M0**: CI verde; suítes cross-tenant e RBAC cobrindo 100% das rotas. **Pare e reporte (regra 10).**

### M1: Navegação instantânea

- [ ] **1.1 · PERF-01, PERF-02 · `feat/perf-01-02-cache-turbopack`**
- [ ] **1.2 · DB-04, DB-05, DB-06 · `feat/db-04-06-queries`**: as somas de custo e tokens são feitas em SQL.
- [ ] **1.3 · PERF-03 · `feat/perf-03-page-pattern`**:
  - padrão RSC + `*-client.tsx` + `loading.tsx` com o skeleton do layout real;
  - `docs/architecture/frontend-patterns.md`;
  - teste que falha se uma `page.tsx` do dashboard tiver `"use client"`. Esse teste só fica verde depois que `/pipeline` (1.9) e `/office` (1.10) forem convertidas, então ele entra no passo 1.10 e o **PERF-03 é marcado lá**;
  - aqui entram só o padrão, a doc e a primeira página.
- [ ] **1.4 · PERF-04, PERF-05, PERF-07, PERF-08, PERF-12**: uma branch por página.
- [ ] **1.5 · PERF-06 · `/chat`**: markdown por `next/dynamic` e conversas sem subquery correlacionada (usa a tabela do SEC-03).
- [ ] **1.6 · SEC-12 → INT-01 → PERF-09**: puxados para cá. O INT-01 tem exceção explícita na §6 do PRD, e o SEC-12 entra junto porque o INT-01 grava as credenciais com a cifra dele.
  - SEC-12: `ENCRYPTION_KEY` dedicada, AES-256-GCM com formato `v1:` e `pnpm secrets:migrate`.
  - INT-01: conexões próprias (D-15).
    - OAuth start/callback com PKCE e `state` assinado;
    - token/API key validado no provider;
    - `integrationFetch` com renovação do token;
    - remove todo o Nango: dependências, `nango-client.ts`, `generic-catalog.ts`, colunas e textos do help.
    - Os testes usam provider OAuth mockado. A validação manual com o GitHub real pede o OAuth App (§6).
  - Depois o PERF-09: `/integrations` no padrão, com catálogo local e estático, status das conexões lido no servidor e nenhuma requisição externa.
- [ ] **1.7 · PERF-13, PERF-14, PERF-15, PERF-16**: link direto, onboarding no layout server, fim do `SessionProvider` e fim do `window.location`/`<a href>` (com regra de lint).
- [ ] **1.8 · PERF-18, PERF-19, PERF-20, PERF-21, PERF-22**: cache por tags de org, fontes da landing, `sideEffects` no shared e remoção de `/public/office/sprites` (antes, confirme por grep que nada usa).
- [ ] **1.9 · PERF-10 · `/pipeline`**: listagem só com metadados, YAML sob demanda, `Promise.all` com limite 4 e cache por org. Usa a credencial do GitHub do INT-01 (1.6).
- [ ] **1.10 · PERF-11 · `/office`**: um `dynamic`, dados por RSC, qualidade adaptativa e prefetch no hover.
  - Validação manual registrada: primeiro frame ≤ 1,5 s em build de produção, nenhuma requisição externa e `/office-preview` igual às pranchas 01, 02 e 04.
  - Com isso nenhuma `page.tsx` do dashboard tem mais `"use client"`: ligue aqui o teste do PERF-03 e marque o PERF-03.
- [ ] **1.11 · Fechar M1**: perf:nav dentro do orçamento em todas as rotas que não dependem de OBS. **Pare e reporte.**

### M2 + M3: Runtime durável e motor DAG (sequência única)

O schema do ENG-01 vem primeiro porque `runs`, `run_steps`, `control_signal`, `checkpoint` e `last_heartbeat_at` são a base de todos os itens RUN.

- [ ] **3.1 · ENG-01 + resto do DB-02 · `feat/eng-01-dag-schema`**:
  - schema da §4 do PRD: `squad_versions/nodes/edges`, `runs` (renomeia `pipeline_runs`, `id` uuid, D-10), `run_steps` (renomeia `executions`), `run_events` e enums;
  - adaptar todas as queries e rotas ao rename;
  - os índices do DB-02 que dependem dessas tabelas entram aqui, e o DB-02 é marcado neste passo;
  - teste: a migration aplica e reverte com dados do seed.
- [ ] **3.2 · RUN-01 · `feat/run-01-worker`**: `apps/worker` com pg-boss, env do FND-06, pool próprio (DB-03), scripts `pnpm worker` e `pnpm dev` (web + worker).
  - O RUN-01 cria as filas listadas no PRD (`createQueue`) e o mecanismo de registro de handlers.
  - Cada **handler** entra no item que implementa o trabalho dele: `run.execute` no 3.7, `run.resume` no 3.8, `node.delay.wake` no 3.11 e assim por diante. Nada de handler vazio ou que só loga (regra 1).
  - Teste: um job de teste é consumido em menos de 2 s.
- [ ] **3.3 · ENG-22**: IDs canônicos de skill + migração dos dados gravados com underscore.
- [ ] **3.4 · ENG-03, ENG-04, ENG-05, ENG-07**: YAML ↔ DAG (`.transform` snake→camel), `validateSquadGraph` (≥ 15 casos), `assertAcyclic` e `resolveTemplates`. Tudo puro em `packages/engine`.
- [ ] **3.5 · ENG-02**: migração dos pipelines lineares para DAG publicado e de `agents.squad_id` para `agents.org_id` (D-05; é a parte de dados do SQD-07).
- [ ] **3.6 · ENG-06 + OBS-01 + ENG-08 + ENG-10 + ENG-11 + ENG-17 + ENG-18**: o runner completo, num PR só porque é um arquivo central.
  - Kahn + `ReachabilityTracker`, `run_steps` e `run_events` (AG-UI + `NOTIFY`) a cada nó, checkpoint jsonb, status final correto;
  - executores TRIGGER, END, CONDITION, ROUTER e APPROVAL;
  - controle cooperativo PAUSE/CANCEL;
  - cost-guards com `pricing.ts` em micro-USD (D-09).
  - Completa o parcial do ENG-06. Pode dividir em 2 ou 3 PRs se ficar grande, desde que cada um feche os próprios IDs.
- [ ] **3.7 · RUN-02 + FND-07**: rotas e actions só enfileiram e respondem 202; regra de lint contra `void (async` e `.catch(` solto em `app/api/**` e actions. Remove todo fire-and-forget (cron, run, v1, chat, architect).
- [ ] **3.8 · RUN-04, RUN-07, RUN-05, RUN-09**: checkpoint durável (apaga o `checkpoint-manager.ts`), idempotência por `singletonKey`, heartbeat + reaper e graceful shutdown.
  - Os testes reiniciam o worker de verdade (processo filho), não simulam.
- [ ] **3.9 · ENG-09, ENG-12, ENG-21**: executor AGENT (tier respeitado, tools com credencial, custo gravado), veto/review e budget mensal (job de reset). Testes com adapter mock. **Peça a `AI_GATEWAY_API_KEY`** para a validação manual de um run real.
- [ ] **3.10 · ENG-13 + HITL-06**: implementados juntos, porque um depende do outro.
  - Executor ACTION + `pending_actions`, com transição atômica e params cifrados.
  - Cria `agent_connector_grants`; a UI de grants é o SQD-09.
- [ ] **3.11 · ENG-14, ENG-15, ENG-16**: DELAY durável por pg-boss, LOOP e PARALLEL respeitando pause/cancel.
- [ ] **3.12 · ENG-24, ENG-25, ENG-20, ENG-19**: versionamento (rascunho → publicar), só squad ativo roda, dry-run e parada de emergência.
  - O botão da parada fica na tela de squads atual. O SQD-11 depois move o botão para a aba Configurações.
- [ ] **3.13 · HITL-01, HITL-02, HITL-03**: aprovar com output editado, rejeitar e devolver ao agente (reassign em DAG por BFS, 409 com ACTION no trecho).
  - Substitui a rota `revise` linear e o `parseRevisionResponse`, que ficam obsoletos.
- [ ] **3.14 · DB-07**: seed idempotente com 2 orgs, squads válidos, marketplace executável e token de API demo.
- [ ] **3.15 · SEC-06 a SEC-16 (menos o SEC-12, feito no 1.6)**: segurança independente do motor. Uma branch por item ou por par.
  - SEC-07 `safeFetch`;
  - SEC-13 login GitHub, com o mesmo OAuth App do INT-01;
  - SEC-15 com email via Resend (D-14).
- [ ] **3.16 · SEC-17, SEC-18**: integração só fica `active` com confirmação do servidor; audit log em toda ação sensível (liga o `AuditLogger`).
- [ ] **3.17 · RUN-10, RUN-11**: `/api/v1` com Bearer, input em `{{trigger.*}}` e política supervised; UI de tokens (owner).
- [ ] **3.18 · RUN-06**: aviso de falha in-app + email, deduplicado por squad e dia. Cria a tabela `notifications`, que o UI-15 usa.
- [ ] **3.19 · TRG-01 + TRG-02 + RUN-12**: implementados juntos, para os schedules nunca pararem de disparar.
  - Parser once/cron/interval portado da Adalink; disparo por `squad.schedule.tick`;
  - depois disso, remoção de `/api/cron` e `/api/inngest`.
- [ ] **3.20 · RUN-08**: Dockerfile multi-stage (web e worker), `render.yaml`, healthchecks, `docker-compose.prod.yml` com smoke e2e e `docs/runbook.md` (versão inicial; o DOC-04 completa).
- [ ] **3.21 · ENG-23**: código morto resolvido e `knip` no CI.
  - O que ainda não tem consumidor é **removido**: `IntegrationHookManager` (volta com o TRG-05 se precisar) e `generateAngles` (volta com o UI-08 se precisar).
- [ ] **3.22 · Fechar M2 + M3**: um run sobrevive a restart, `/api/v1` funciona com token, todos os tipos de nó estão testados e o seed migrado roda. **Pare e reporte.**

### M4: Tempo real e HITL

- [ ] **4.1 · OBS-02 · `feat/obs-02-sse`**: SSE `runs/[runId]/events` (replay por `Last-Event-ID` + LISTEN) e `/api/org/stream`, com heartbeat de 15 s e guard de org. Completa o parcial (hoje é WS).
- [ ] **4.2 · OBS-03**: hook `useEventStream` com reconexão exponencial e fallback de polling.
- [ ] **4.3 · RUN-03**: chat e Arquiteto rodando no worker, com resposta por stream.
- [ ] **4.4 · OBS-06, OBS-04, OBS-05**: status real do agente; página de run com 3 modos (portar `squad-run-timeline.tsx` e `aggregateAgUi` com os testes da Adalink, lidos por `git show`); lista de runs.
- [ ] **4.5 · OBS-08, OBS-09, OBS-10, OBS-11**: remove `pipeline_logs`; `ask_agent`; métricas reais no dashboard; resumo humanizado.
- [ ] **4.6 · OBS-07 → OBS-12**:
  - o escritório passa a consumir `/api/org/stream` e os dados demo ficam só atrás de `?demo=1`. Conferir com as pranchas no `/office-preview`;
  - depois disso, aposentar `ws`, `server.ts` e `/api/ws-token`; `pnpm dev` e `pnpm start` voltam a ser o Next puro + worker.
- [ ] **4.7 · UI-07**: puxado do M7. Upload S3 com MinIO no compose, URL assinada, limites de tamanho e tipo.
- [ ] **4.8 · HITL-04, HITL-05, HITL-07**: banner de aprovação com imagem que chega ao próximo nó, timeout por `approval.expire` e central `/approvals` com contador ao vivo.
- [ ] **4.9 · PERF-17, PERF-23, UI-06, UI-15**: fim do polling solto, UI otimista, chat por stream (sem travar com 60 mensagens) e sino de notificações.
- [ ] **4.10 · PERF-24**: liga o bloqueio do perf:nav no CI e exige 3 execuções verdes seguidas.
- [ ] **4.11 · Fechar M4.** **Pare e reporte.**

### M5: Produto

- [ ] **5.0 · DEV-01 a DEV-05**: puxados do M7 porque o SQD-02 inclui o template `dev-pipeline`. **Peça `VERCEL_SANDBOX_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID` e a chave Anthropic** antes do DEV-02.
  - DEV-01: porte `vercel-sandbox.provider.ts` e `null-sandbox.provider.ts` da Adalink (`apps/agents-service/src/infrastructure/modules/squads/sandbox/`), com os specs. O E2B fica de fora (D-06).
  - Se o Wesley preferir não fazer agora, o SQD-02 fica para o M7. Ele **não** é marcado sem o `dev-pipeline`.
- [ ] **5.1 · SQD-01, SQD-02**: 13 domínios com `resolveDomainMeta` seguro; catálogo de templates, todos validados e executáveis em dry-run.
- [ ] **5.2 · SQD-07, SQD-08, SQD-09**: biblioteca de agentes (UI), persona no prompt e na UI, grants de conector.
- [ ] **5.3 · ARC-01 a ARC-09**: Copiloto.
  - Plano persistido, streaming do raciocínio por SSE e `generateObject`;
  - edição XOR, custo pelo `pricing.ts`, `connected` calculado no servidor;
  - claim atômico, edição de squad existente por diff;
  - sem estado global (completa o ARC-08);
  - Sherlock real.
- [ ] **5.4 · ARC-10, SQD-03, SQD-04, SQD-05, SQD-06, SQD-10, SQD-11**: modal do Copiloto, hub `/squads` com abas, overview em 1 query, criação pelos 3 caminhos, detalhe, duplicar e configurações editáveis.
- [ ] **5.5 · TRG-05, TRG-03, TRG-04, TRG-06**: assinaturas de evento, webhook por squad, GitHub e UI de gatilhos.
- [ ] **5.6 · QA-02 fluxos 1, 2 e 3**: specs e2e escritos agora, porque são o critério de saída do M5. O QA-02 só é marcado quando os 6 fluxos existirem.
- [ ] **5.7 · Fechar M5.** **Pare e reporte.**

### M6: Builder, marketplace e integrações

- [ ] **6.1 · BLD-06, BLD-01, BLD-02, BLD-03, BLD-04, BLD-07, BLD-05**: os conversores DTO ↔ xyflow vêm primeiro.
- [ ] **6.2 · MKT-01 a MKT-07**: o MKT-02 corrige o 500 de re-adquirir; o MKT-07 roda cada item do seed em dry-run.
- [ ] **6.3 · INT-02 a INT-08**:
  - INT-03: desconectar revoga o token no provider e apaga a credencial;
  - INT-04: catálogo honesto. Cada integração premium tem conexão própria (app OAuth ou token) e ações funcionando. As outras aparecem como "em breve" e **as classes mortas são apagadas**. Peça os apps OAuth de cada provider premium (§6);
  - INT-08: Slack, Jira e Linear são implementados de verdade ou removidos. Nada de stub.
- [ ] **6.4 · QA-02 fluxo 4** (marketplace).
- [ ] **6.5 · Fechar M6.** **Pare e reporte.**

### M7: Esteira dev e acabamento

- [ ] **7.1 · DEV-06**: execução real no `orbitmind-sandbox-repo`. Peça o repositório e o token.
- [ ] **7.2 · UI-01 a UI-05, UI-08, UI-10 a UI-14**: o UI-03 usa email via Resend; o UI-08 liga ou remove os componentes do chat.
- [ ] **7.3 · UI-09**: i18n com next-intl. Extraia as strings de **todas** as telas, inclusive as criadas do M1 ao M6.
- [ ] **7.4 · CLI-01, CLI-02, CLI-03**
- [ ] **7.5 · DOC-01 a DOC-04**: o DOC-01 tira do CLAUDE.md a frase "o main ainda tem a versão three.js", que já não vale.
- [ ] **7.6 · QA-01**: cenários da seção 9 da Adalink, com o mapeamento cenário → teste no PR.
- [ ] **7.7 · QA-02 fluxos 5 e 6** (reassign e parada de emergência) + marcar o QA-02.
- [ ] **7.8 · QA-03**: 30 runs concorrentes de 2 orgs, com relatório no PR.
- [ ] **7.9 · QA-04**: `/security-review` no estado final, sem achados críticos ou altos.
- [ ] **7.10 · Fechar o PRD**: os 194 itens com Implementado + Testado, Log completo e CI verde. **Pare e reporte para a revisão final do Opus.**
