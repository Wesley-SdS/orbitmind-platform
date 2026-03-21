# PRD — OrbitMind Platform

> **Produto:** OrbitMind Platform
> **Status:** Draft
> **Autor:** ORBIT-ARCHITECT
> **Data:** 2026-03-21
> **Versão:** 1.0

---

## 1. Visão do Produto

OrbitMind é uma plataforma de orquestração de squads de agentes IA que permite a qualquer empresa montar, configurar e operar equipes autônomas de agentes — de agências de marketing a times de desenvolvimento, suporte ao cliente, compliance, e operações internas.

### Tagline
**"Squads de IA que trabalham para você — do chat à entrega."**

### Diferencial competitivo
Nenhum concorrente combina os três pilares que a OrbitMind já validou:

1. **Pipeline autônomo end-to-end** — validado com 41+ PRs merged automaticamente na Adalink
2. **Interface web moderna** — chat + dashboard + board, zero terminal
3. **Escritório virtual** — visualização estilo Gather dos agentes trabalhando em tempo real

### Primeiro case
**Agência de marketing 100% autônoma** — pesquisa de mercado, estratégia, criação de conteúdo, design, publicação em redes sociais, análise de métricas. Tudo via chat ou board, sem terminal.

---

## 2. Personas

### CEO / Founder
- Quer visão macro: quanto custa, quanto produz, está funcionando?
- Usa: Dashboard de métricas, budget overview, escritório virtual
- Nunca abre terminal

### CTO / Tech Lead
- Quer controle: quais agentes, qual pipeline, integrações
- Usa: Configuração de squads, pipeline editor, integrations
- Pode usar terminal opcionalmente

### Product Owner / Project Manager
- Quer gestão: tasks, prioridades, status, aprovações
- Usa: Board Kanban, chat com agentes, checkpoints
- Nunca abre terminal

### Operador / End User
- Quer resultados: pedir algo no chat e receber pronto
- Usa: Chat interface, notificações
- Nunca abre terminal

---

## 3. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    OrbitMind Platform                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Chat   │  │  Board   │  │ Dashboard │  │ Virtual │ │
│  │ Interface │  │  Kanban  │  │ Métricas  │  │ Office  │ │
│  └────┬─────┘  └────┬─────┘  └────┬──────┘  └────┬────┘ │
│       │              │              │              │      │
│  ┌────┴──────────────┴──────────────┴──────────────┴───┐ │
│  │              Next.js API + WebSocket                  │ │
│  └────┬──────────────┬──────────────┬──────────────┬───┘ │
│       │              │              │              │      │
│  ┌────┴────┐  ┌──────┴─────┐  ┌────┴────┐  ┌─────┴───┐ │
│  │ Engine  │  │Integrations│  │  Auth   │  │ Realtime│ │
│  │ (Squad  │  │ (GitHub,   │  │(NextAuth│  │  (WS)   │ │
│  │ Runner) │  │  Discord)  │  │ + RBAC) │  │         │ │
│  └────┬────┘  └──────┬─────┘  └────┬────┘  └─────────┘ │
│       │              │              │                    │
│  ┌────┴──────────────┴──────────────┴──────────────────┐ │
│  │                   PostgreSQL 16                       │ │
│  │  Organizations │ Squads │ Agents │ Tasks │ Audit     │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                    │
    ┌────┴────┐          ┌───┴───┐
    │ GitHub  │          │Discord│
    │ GitLab  │          │Telegram
    │ Actions │          │Slack  │
    └─────────┘          └───────┘
```

---

## 4. Features — Roadmap por Fase

### Fase 1: Foundation (Semanas 1-2)
**Objetivo:** Setup do monorepo, auth, schema, design system

- [ ] Monorepo Turborepo (apps/web + packages/engine + packages/cli + packages/shared)
- [ ] Next.js 15 App Router + TypeScript strict
- [ ] PostgreSQL 16 + Drizzle ORM com schema completo
- [ ] Auth (NextAuth ou Better Auth) com multi-tenant por Organization
- [ ] Design system base (shadcn/ui customizado)
- [ ] Layout autenticado com sidebar navigation
- [ ] CRUD de Organizations e convite de membros

### Fase 2: Chat + Engine (Semanas 3-4)
**Objetivo:** Interface de chat funcional + engine de execução de squads

- [ ] Chat interface moderna (mensagens, agentes com avatar, typing indicator)
- [ ] Squad engine: parser de squad.yaml, state machine, pipeline runner
- [ ] Agent adapter: suporte a Claude Code como primeiro runtime
- [ ] Criação de squad via chat (Architect agent faz perguntas e configura)
- [ ] Execução de squad via chat (usuário manda mensagem → pipeline roda)
- [ ] Real-time updates via WebSocket (status de cada agente atualiza em tempo real)
- [ ] Template de squad: Marketing Agency pré-configurado

### Fase 3: Board + Tasks (Semanas 5-6)
**Objetivo:** Gestão visual de tarefas e pipeline

- [ ] Kanban board com colunas configuráveis (Backlog → In Progress → Review → Done)
- [ ] Task cards com agent assignment, priority, status
- [ ] Pipeline visualization (flowchart do squad.yaml)
- [ ] Checkpoints: pausa a execução e pede aprovação humana no board
- [ ] Drag and drop de tasks entre colunas
- [ ] Filtros por agente, status, prioridade

### Fase 4: Integrations (Semanas 7-8)
**Objetivo:** Conectar com GitHub, Discord, Telegram

- [ ] GitHub integration: criar repos, issues, PRs via API
- [ ] GitHub webhooks: receber eventos de PR/merge/review
- [ ] GitLab integration (mesmo adapter pattern)
- [ ] Discord integration: bot que cria squads, recebe comandos, envia notificações
- [ ] Telegram integration: bot de notificações e comandos básicos
- [ ] Pipeline CI/CD integration: conectar engine com GitHub Actions workflows
- [ ] Importar pipeline OrbitMind existente (Vektus/Adalink) como template

### Fase 5: Metrics + Budget (Semanas 9-10)
**Objetivo:** Visibilidade financeira e operacional

- [ ] Dashboard de métricas: tasks completed, PRs merged, squads running
- [ ] Budget por agente: limite mensal de tokens, warning a 80%, pause a 100%
- [ ] Cost tracking: custo estimado por execution (tokens × preço do modelo)
- [ ] Audit log: toda ação registrada, filtros por agente/squad/período
- [ ] Org overview: cards com status de todos os squads ativos
- [ ] Export de relatórios (CSV, PDF)

### Fase 6: Virtual Office (Semanas 11-12)
**Objetivo:** Escritório virtual estilo Gather

- [ ] Canvas 2D com salas temáticas (Dev Room, Design Room, Review Room, etc.)
- [ ] Avatares de agentes que se movem entre salas conforme trabalham
- [ ] Indicadores visuais: working (animação), idle (sentado), delivering (caminhando)
- [ ] Handoff animations: envelope viajando de um agente para outro
- [ ] Click em agente abre painel lateral com status, logs, métricas
- [ ] Real-time sync via WebSocket (todos os viewers veem a mesma coisa)
- [ ] Customização de layout de salas por squad

### Fase 7: CLI + Onboarding (Semanas 13-14)
**Objetivo:** Setup em 5 minutos para novos clientes

- [ ] `npx orbitmind init` — wizard interativo
- [ ] Escolha de template (Marketing Agency, Dev Team, Support Team)
- [ ] Conecta GitHub/GitLab automaticamente (OAuth flow)
- [ ] Cria repo, board, workflows, webhooks em uma sequência
- [ ] Gera CLAUDE.md customizado para o projeto
- [ ] Deploy de squad na plataforma web
- [ ] Documentação interativa no onboarding (guided tour)

---

## 5. Schema do Banco de Dados

### Entidades principais

**Organization**
- id (uuid PK), name, slug (unique), plan (free|pro|enterprise)
- logoUrl, settings (jsonb), createdAt, updatedAt

**User**
- id (uuid PK), orgId (FK), name, email (unique), role (owner|admin|member|viewer)
- passwordHash, avatarUrl, createdAt, updatedAt

**Squad**
- id (uuid PK), orgId (FK), name, code (unique per org), description, icon
- config (jsonb — o squad.yaml completo), status (active|paused|archived)
- templateId (nullable — referência ao template original)
- createdAt, updatedAt, createdBy (FK User)

**Agent**
- id (uuid PK), squadId (FK), name, role, icon
- modelTier (powerful|fast), runtimeType (claude-code|codex|custom)
- monthlyBudgetTokens, budgetUsedTokens, status (idle|working|paused)
- config (jsonb — persona, instructions, skills)
- createdAt, updatedAt

**Task**
- id (uuid PK), squadId (FK), assignedAgentId (FK nullable)
- title, description, status (backlog|ready|in_progress|in_review|done|blocked)
- priority (p0|p1|p2|p3), type (feature|fix|content|research|review)
- metadata (jsonb — labels, external refs, checkpoint data)
- parentTaskId (FK nullable — subtasks)
- createdAt, updatedAt, completedAt

**Execution**
- id (uuid PK), squadId (FK), taskId (FK nullable), agentId (FK)
- pipelineStep, status (running|completed|failed|cancelled)
- inputData (jsonb), outputData (jsonb)
- tokensUsed, estimatedCost, durationMs
- startedAt, completedAt, error (text nullable)

**AuditLog**
- id (uuid PK), orgId (FK), squadId (FK nullable)
- action (enum: squad.created, agent.started, task.completed, budget.exceeded, etc.)
- actorType (user|agent|system), actorId
- metadata (jsonb), createdAt

**Integration**
- id (uuid PK), orgId (FK)
- type (github|gitlab|discord|telegram|slack)
- config (jsonb — encrypted tokens, webhook URLs, repo/channel mappings)
- status (active|inactive|error), lastSyncAt
- createdAt, updatedAt

**Message** (para o chat)
- id (uuid PK), squadId (FK), senderId (FK User nullable), agentId (FK nullable)
- content (text), role (user|agent|system)
- metadata (jsonb — citations, attachments)
- createdAt

---

## 6. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 15 (App Router) | SSR, API routes, estável, equipe já domina |
| UI | Tailwind CSS + shadcn/ui | Customizável, design system consistente |
| Real-time | WebSocket (native) | Atualizações do escritório virtual e chat |
| Canvas 2D | PixiJS 8 ou React-Konva | Performance para o virtual office |
| Backend | Next.js API Routes | Colocalizado, sem server separado |
| Banco | PostgreSQL 16 + Drizzle ORM | Relacional, JSONB, types safe |
| Auth | NextAuth v5 ou Better Auth | Multi-tenant, OAuth providers |
| Monorepo | Turborepo + pnpm | Build cache, workspaces |
| Hosting | Vercel (web) + VPS (engine workers) | Serverless + long-running agents |
| AI Runtime | Claude Code (OAuth) | Plano Max, validado no Vektus |
| CI/CD | GitHub Actions | Pipeline OrbitMind validado |

---

## 7. Integrações

### GitHub (prioridade 1)
- OAuth App para conectar repos
- Webhooks para receber: push, PR opened/merged, issue created, review submitted
- API para: criar issues, abrir PRs, adicionar labels, merge
- Sync bidirecional: Task no OrbitMind ↔ Issue no GitHub

### GitLab (prioridade 2)
- Mesmo adapter pattern do GitHub
- Webhooks + API REST
- Suporte a self-hosted GitLab

### Discord (prioridade 1)
- Bot com comandos: `/squad create`, `/squad run`, `/squad status`
- Canais por squad (auto-criados)
- Notificações de: task completed, PR merged, budget warning
- Thread por execução (logs do agente em tempo real)

### Telegram (prioridade 2)
- Bot de notificações
- Comandos básicos: `/status`, `/approve`, `/reject`
- Inline keyboard para checkpoints

---

## 8. UX/UI — Princípios de Design

### Filosofia
- **Zero terminal** — tudo funciona pelo browser
- **Humanizado** — agentes têm nome, avatar, personalidade
- **Transparente** — o usuário vê exatamente o que cada agente está fazendo
- **Rápido** — real-time, sem polling, feedback instantâneo

### Chat Interface
- Estilo iMessage/Slack moderno com bolhas de mensagem
- Agentes com avatar colorido e nome
- Typing indicator quando agente está trabalhando
- Mensagens de sistema (task completed, checkpoint reached) estilizadas
- Upload de arquivos inline
- Code blocks com syntax highlighting
- Markdown rendering

### Board Kanban
- Drag and drop suave (dnd-kit)
- Cards com: avatar do agente, título, status badge, prioridade
- Quick actions: assign, change priority, add to sprint
- Filtros por agente, tipo, prioridade
- Swimlanes opcionais por agente

### Virtual Office (fase final)
- Estilo Gather.town mas com design premium e moderno
- Salas temáticas com decoração visual sutil
- Avatares com animações suaves (idle, working, walking)
- Particle effects para ações (commit, deploy, publish)
- Zoom in/out, pan, minimap
- Click em agente abre sidebar com detalhes

---

## 9. Modelo de Negócio (draft)

| Plano | Preço | Squads | Agentes | Execuções/mês | Features |
|-------|-------|--------|---------|---------------|----------|
| Free | $0 | 1 | 3 | 100 | Chat, Board |
| Pro | $49/mês | 5 | 15 | 1.000 | + Integrations, Budget, Metrics |
| Enterprise | $199/mês | Ilimitado | Ilimitado | 10.000 | + Virtual Office, SSO, Audit |

*BYOK (Bring Your Own Key)* — cliente pode usar própria API key e pagar direto ao provider.

---

## 10. Métricas de Sucesso

### MVP (Fase 1-3)
- 1 squad de marketing agency funcionando end-to-end via chat
- Tempo de onboarding < 10 minutos
- 90% das tasks completadas sem intervenção humana

### Growth (Fase 4-7)
- 10 organizações usando em produção
- 50 squads ativos
- NPS > 40
- Churn < 5% mensal

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Custos de LLM altos | Alta | Alto | Budget caps por agente, model tier selection |
| Agentes fazem coisas erradas | Média | Alto | Checkpoints obrigatórios, audit log, rollback |
| Latência do virtual office | Média | Médio | WebSocket otimizado, debounce updates |
| Concorrência (Paperclip, Squad) | Alta | Médio | Diferencial: pipeline CI/CD + UX superior |
| Complexidade do multi-tenant | Média | Alto | Schema isolado por org, RLS no PostgreSQL |

---

*PRD gerado em 2026-03-21 — OrbitMind Platform v1.0*
