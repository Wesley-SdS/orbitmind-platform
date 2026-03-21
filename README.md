# OrbitMind Platform

**Squads de IA que trabalham para voce — do chat a entrega.**

OrbitMind e uma plataforma de orquestracao de squads de agentes IA. Monte equipes autonomas de agentes que pesquisam, criam, revisam e publicam — tudo via interface web, sem terminal.

---

## Quick Start

```bash
# 1. Clone o repositorio
git clone https://github.com/your-org/orbitmind-platform.git
cd orbitmind-platform

# 2. Instale dependencias
pnpm install

# 3. Suba o banco de dados
docker compose up -d

# 4. Configure variaveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 5. Aplique o schema no banco
pnpm db:push

# 6. Inicie o dev server
pnpm dev
```

Ou use o CLI:

```bash
npx orbitmind init
```

---

## Features

### Chat Interface
Interface de chat moderna com agentes IA. Envie uma mensagem e o squad inteiro trabalha para voce.

### Board Kanban
Gestao visual de tarefas com drag & drop. Acompanhe o progresso de cada agente em tempo real.

### Dashboard de Metricas
Visibilidade financeira e operacional. Budget por agente, custo por execucao, audit log completo.

### Virtual Office
Escritorio virtual estilo Gather. Veja seus agentes trabalhando, entregando e colaborando em tempo real.

### Integracoes
GitHub, GitLab, Discord, Telegram. Conecte seus repositorios, receba notificacoes, crie squads por chat.

---

## Arquitetura

```
orbitmind-platform/
  apps/web/              Next.js 15 (App Router)
  packages/engine/       Core: squad runner, pipeline, state machine
  packages/cli/          CLI: npx orbitmind init
  packages/shared/       Types, constants, validators
  templates/             Templates de squads e skills
  docs/                  Analise, arquitetura, PRDs
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Real-time | WebSocket |
| Database | PostgreSQL 16 + Drizzle ORM |
| Auth | NextAuth v5 |
| Monorepo | Turborepo + pnpm |
| Language | TypeScript (strict) |

---

## Comparativo

| Feature | OrbitMind | Paperclip | CrewAI | AutoGen |
|---------|-----------|-----------|--------|---------|
| Interface Web | Full UI | Dashboard | CLI | CLI |
| Chat com Agentes | Sim | Nao | Nao | Nao |
| Board Kanban | Sim | Nao | Nao | Nao |
| Virtual Office | Sim | Nao | Nao | Nao |
| Pipeline CI/CD | Validado (41+ PRs) | Basico | Nao | Nao |
| Budget por Agente | Sim | Sim | Nao | Nao |
| Multi-tenant | Sim | Sim | Nao | Nao |
| Squad Templates | Sim | Nao | Exemplos | Exemplos |
| GitHub Integration | Bidirecional | Nao | Nao | Nao |
| Discord/Telegram | Bots nativos | Nao | Nao | Nao |

---

## Roadmap

```
Fase 1  [==========] Foundation — Monorepo, Auth, Schema, Design System
Fase 2  [          ] Chat + Engine — Interface de chat, squad runner
Fase 3  [          ] Board + Tasks — Kanban, pipeline visualization
Fase 4  [          ] Integrations — GitHub, Discord, Telegram
Fase 5  [          ] Metrics + Budget — Dashboard, cost tracking
Fase 6  [          ] Virtual Office — Escritorio 2D estilo Gather
Fase 7  [          ] CLI + Onboarding — npx orbitmind init
```

---

## Templates Incluidos

### Marketing Agency
Squad completo: Researcher, Strategist, Copywriter, Designer, SEO Analyst, Reviewer, Publisher.
Pipeline: Research -> Strategy -> [Checkpoint] -> Content -> SEO -> Design -> [Review] -> Publish.

### Dev Team (em breve)
Squad de desenvolvimento: Architect, Developer, Tester, Reviewer, DevOps.

### Support Team (em breve)
Squad de suporte: Triager, Responder, Escalator, Knowledge Base Writer.

---

## Contribuindo

1. Fork o repositorio
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit com mensagem semantica: `git commit -m "feat: add nova feature"`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

---

## Licenca

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

*Construido com TypeScript, Next.js 15, e muito cafe.*
