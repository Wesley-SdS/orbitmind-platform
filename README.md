<div align="center">
  <h1>OrbitMind Platform</h1>
  <p><strong>Squads de IA que trabalham para você — do chat à entrega.</strong></p>
  <p>Plataforma de orquestração de agentes IA autônomos. Monte equipes que pesquisam, criam, revisam e publicam — 100% pelo browser, sem terminal.</p>

  <p>
    <a href="#-features">Features</a> ·
    <a href="#-quick-start">Quick Start</a> ·
    <a href="#-arquitetura">Arquitetura</a> ·
    <a href="#-integrações-700">Integrações</a> ·
    <a href="#-marketplace">Marketplace</a> ·
    <a href="#-roadmap">Roadmap</a> ·
    <a href="#-contribuindo">Contribuindo</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Three.js-R3F-black?logo=three.js" alt="Three.js" />
    <img src="https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/Integrations-700+-purple" alt="Integrations" />
    <img src="https://img.shields.io/badge/Marketplace-16_items-orange" alt="Marketplace" />
    <img src="https://img.shields.io/badge/Languages-3_(PT--BR,_EN,_ES)-teal" alt="Languages" />
    <img src="https://img.shields.io/badge/API_Routes-35-blue" alt="API Routes" />
    <img src="https://img.shields.io/badge/DB_Tables-24-green" alt="Tables" />
  </p>
</div>

---

## Highlights

| | |
|---|---|
| **7 agentes especializados** | Researcher, Strategist, Copywriter, Designer, SEO, Reviewer, Publisher |
| **700+ integrações** | GitHub, Slack, Jira, Linear, Notion, Google, Microsoft e mais via Nango |
| **Marketplace** | 10 agentes e 6 squads pré-configurados prontos para usar |
| **Escritório Virtual 3D** | Acompanhe seus agentes trabalhando em tempo real com React Three Fiber |
| **Pipeline autônomo** | Veto conditions, review loops, checkpoints automáticos |
| **42 integrações premium** | Actions profundas com UI de configuração, tipadas e testadas |
| **Sherlock Investigator** | Analisa perfis reais de Instagram, YouTube, Twitter/X e LinkedIn |
| **i18n** | Português, English, Español |

---

## Índice

- [Features](#-features)
  - [Chat com Architect](#chat-com-architect)
  - [Board Kanban](#board-kanban)
  - [Virtual Office 3D](#virtual-office-3d)
  - [Pipeline Inteligente](#pipeline-inteligente)
  - [Conteúdo Inteligente](#conteúdo-inteligente)
  - [Marketplace](#marketplace)
  - [Integrações (700+)](#integrações-700)
  - [Sherlock Investigator](#sherlock-investigator)
  - [Scheduling e API](#scheduling-e-api)
  - [Analytics](#analytics)
  - [Multi-Provider LLM](#multi-provider-llm)
- [Quick Start](#-quick-start)
- [Arquitetura](#-arquitetura)
- [Stack Técnico](#-stack-técnico)
- [Comparativo](#-comparativo)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## Features

### Chat com Architect

O Architect é o agente central que entende o que você precisa e monta o squad inteiro via chat. Descreva seu objetivo e ele cria agentes, define o pipeline e começa a executar.

- **14 capacidades**: criar, editar, deletar, listar, pausar, ativar, duplicar, exportar squads
- **Chat universal**: input sempre ativo, sugestões clicáveis, roteamento inteligente
- **Company wizard**: 5 perguntas no primeiro acesso para personalizar tudo
- **Context-aware**: sabe as integrações conectadas e sugere ações

### Board Kanban

Gestão visual de tasks com drag & drop entre colunas.

- Colunas: Backlog → In Progress → Review → Done
- Drag & drop nativo com `@dnd-kit`
- Atribuição por agente
- Sincronização com Jira, Linear, Asana, ClickUp (via integrações)

### Virtual Office 3D

Escritório virtual futurista com React Three Fiber. Veja seus agentes trabalhando em tempo real.

- **6 salas temáticas**: Research Lab, Creative Studio, Review Room, Strategy Room, Publishing, Lobby
- **Agentes 3D**: robôs metálicos com olhos neon, animações por status (working/idle/delivering)
- **Efeitos visuais**: chão reflexivo, bloom, partículas, hologramas flutuantes
- **Handoff animado**: partícula voando entre agentes quando entregam trabalho
- **Câmera orbital**: rotação automática, zoom, pan
- **Interativo**: clique no agente para ver detalhes

### Pipeline Inteligente

Pipeline de execução com checkpoints automáticos, veto conditions e review loops.

- **Task chains**: agentes executam tarefas sequenciais com output encadeado
- **Veto conditions**: LLM verifica qualidade semanticamente, retry automático 2x
- **Review loops**: reviewer rejeita → agente refaz com feedback, até 3 ciclos
- **Run folders**: cada execução gera runId + versionamento de outputs
- **Autonomy modes**: `interactive` (pausa a cada step) ou `autonomous` (roda tudo)
- **Performance mode**: Alta Performance (3-5x tokens, múltiplos passes) ou Econômico
- **Checkpoints**: `approve`, `select`, `skip` — configurável por step

### Conteúdo Inteligente

Não é conteúdo genérico — são ângulos criativos, tom de voz e regras de plataforma.

- **5 ângulos criativos** gerados por IA para cada tema (medo, oportunidade, educacional, contrário, inspiracional)
- **6 tons de voz**: profissional, casual, técnico, divertido, inspirador, provocativo
- **22 best practices** injetadas automaticamente (7 disciplinas + 14 plataformas)
- **Memória persistente**: squad lembra preferências e melhora a cada execução

### Marketplace

Adquira agentes especializados e squads completos prontos para usar.

- **16 itens**: 10 agentes avulsos + 6 squads completos
- **Squads prontos**: Instagram Carousel Factory, YouTube Content Machine, Email Marketing, LinkedIn Thought Leader, Customer Support, Dev Pipeline
- **Squads completos**: cria squad inteiro na sua org com 1 clique
- **Dev Pipeline**: squad que replica a esteira de desenvolvimento autônoma (Issue → PR → Review → Merge)

### Integrações (700+)

42 integrações premium com actions profundas + 700+ genéricas via Nango.

**Premium (com UI de configuração e actions tipadas):**

| Categoria | Integrações |
|-----------|------------|
| Development | GitHub, GitLab, Bitbucket, Azure DevOps, Confluence |
| Communication | Slack, Discord, Telegram, Microsoft Teams, Intercom |
| Project Management | Jira, Linear, Asana, Monday, ClickUp, Notion, Trello, Basecamp |
| CRM & Sales | HubSpot, Salesforce, Pipedrive, Zoho CRM |
| Support | Zendesk, Freshdesk, ServiceNow |
| Google Workspace | Drive, Calendar, Sheets, Gmail |
| Microsoft 365 | Outlook, OneDrive |
| Marketing & Email | Mailchimp, SendGrid, Brevo |
| Storage & Design | Figma, Dropbox, Airtable |
| Payments | Stripe, Shopify |

**+ 670+ genéricas** disponíveis via catálogo Nango com OAuth em 1 clique.

### Sherlock Investigator

Analisa perfis reais de redes sociais para calibrar seus agentes com dados de verdade.

- **4 plataformas**: Instagram, YouTube, Twitter/X, LinkedIn
- **Extração**: carrosséis, reels, posts, vídeos, artigos, threads
- **Pattern analysis**: hooks, CTAs, vocabulário, tom, engagement drivers via LLM
- **Consolidação**: múltiplos perfis → relatório unificado de padrões

### Scheduling e API

Automatize completamente: agende execuções e dispare pipelines via API.

- **Agendamento cron**: "todo dia às 9h", "toda segunda às 14h"
- **API pública**: `POST /api/v1/squads/{id}/run` com Bearer token
- **API tokens**: SHA-256 hash, gerar/revogar em Settings
- **Webhooks**: receba eventos de GitHub, Slack, Jira e processe automaticamente

```bash
curl -X POST https://app.orbitmind.com/api/v1/squads/{id}/run \
  -H "Authorization: Bearer om_xxxxxxxxxxxx" \
  -d '{"input": "Tema: IA no marketing"}'
```

### Analytics

Métricas pós-publicação com feedback loop automático.

- **Métricas**: likes, comments, shares, saves, views, reach, engagement rate
- **Feedback loop**: após coletar métricas, gera memórias automaticamente
- **Por plataforma**: Instagram, LinkedIn, YouTube (extensível)

### Multi-Provider LLM

Configure o provider de IA direto pela interface — sem `.env`, sem terminal.

- **Anthropic**: Claude Opus 4.6, Sonnet 4.6, Haiku 4.5
- **OpenAI**: GPT-5.4, o3-pro
- **Google**: Gemini 3.1 Pro
- Troque a qualquer momento sem reconfigurar nada

### Onboarding

Setup em 5 minutos, zero configuração técnica.

- **Tour interativo**: 11 steps guiados pela interface (Onborda)
- **Company wizard**: 5 perguntas no chat para personalizar o produto
- **Primeiro squad**: descreva o que precisa e o Architect monta tudo

### CLI

```bash
npx orbitmind init
```

Wizard interativo: nome da org, template, provider de IA, database URL, gera `.env` automático.

### i18n

Suporte a 3 idiomas: Português (BR), English, Español. Configurável por organização.

### Pipeline Logging

Logs estruturados de cada execução para debugging e auditoria.

- **Eventos**: step_start, step_complete, veto_triggered, review_rejected, handoff, pipeline_complete
- **Filtros**: por nível (info/warn/error), por run, por step
- **Token tracking**: consumo por step e por agente

---

## Quick Start

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker (para PostgreSQL)
- Uma chave de API: Anthropic, OpenAI ou Google Gemini

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Wesley-SdS/orbitmind-platform.git
cd orbitmind-platform

# Instale dependências
pnpm install

# Suba o PostgreSQL
docker compose up -d

# Configure variáveis de ambiente
cp apps/web/.env.example apps/web/.env
# Edite .env com suas credenciais

# Aplique o schema e seed
pnpm db:push
pnpm db:seed

# Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse `http://localhost:3000` e faça login com `admin@orbitmind.com / admin123`.

### Ou via CLI

```bash
npx orbitmind init
```

---

## Arquitetura

```
orbitmind-platform/
├── apps/
│   └── web/                    # Next.js 15 (App Router)
│       ├── app/                # Pages + API Routes (35 routes)
│       │   ├── (dashboard)/    # Chat, Board, Office, Marketplace, Settings
│       │   ├── (marketing)/    # Landing page
│       │   └── api/            # REST API + WebSocket + Webhooks
│       ├── components/         # 57 componentes React
│       │   ├── chat/           # Interface de chat
│       │   ├── board/          # Kanban board
│       │   ├── office/         # Virtual Office 3D (R3F)
│       │   └── ui/             # 28 componentes shadcn/ui
│       └── lib/
│           ├── db/             # Drizzle ORM — 24 tabelas
│           ├── engine/         # Architect, chat handler
│           └── integrations/   # Nango client + 42 integrações premium
├── packages/
│   ├── engine/                 # Core: PipelineRunner, Sherlock, Skills
│   ├── shared/                 # Types, constants, validators
│   └── cli/                    # npx orbitmind init
├── templates/                  # 4 squad + 5 skill templates
└── docs/                       # Análise, arquitetura, PRDs
```

### Database Schema (24 tabelas)

```
organizations ─┬── users
               ├── squads ──── agents ──── tasks
               ├── executions
               ├── messages
               ├── squad_memories
               ├── investigations (Sherlock)
               ├── org_integrations ──── integration_webhooks
               ├── org_skills
               ├── llm_providers
               ├── marketplace_items ──── marketplace_acquisitions
               ├── schedules
               ├── api_tokens
               ├── content_analytics
               ├── pipeline_logs
               └── audit_logs
```

---

## Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4 |
| **UI Components** | shadcn/ui (28 componentes) |
| **3D Engine** | React Three Fiber + drei + postprocessing |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **Auth** | NextAuth v5 |
| **Real-time** | WebSocket (native) |
| **Integrações** | Nango (700+ APIs) |
| **i18n** | next-intl (PT-BR, EN, ES) |
| **Monorepo** | Turborepo + pnpm |
| **Language** | TypeScript (strict mode) |
| **Onboarding** | Onborda (tour interativo) |
| **Drag & Drop** | @dnd-kit |
| **Charts** | Recharts |

---

## Comparativo

| Feature | OrbitMind | CrewAI | AutoGen | Paperclip |
|---------|-----------|--------|---------|-----------|
| Interface Web completa | Full UI | CLI only | CLI only | Dashboard |
| Chat com Architect | 14 ações | — | — | — |
| Board Kanban | Drag & drop | — | — | — |
| Virtual Office 3D | Three.js | — | — | — |
| Marketplace | 16 itens | — | — | — |
| 700+ Integrações | Nango | — | — | — |
| Pipeline autônomo | Validado | Básico | Básico | Básico |
| Veto conditions | LLM-based | — | — | — |
| Review loops | 3 ciclos | — | — | — |
| Checkpoints | 3 tipos | — | — | — |
| Sherlock (análise de perfis) | 4 redes | — | — | — |
| Ângulos criativos | 5 ângulos | — | — | — |
| Memória persistente | Por squad | — | — | — |
| Scheduling (cron) | Nativo | — | — | — |
| API pública + webhooks | REST + WS | — | — | — |
| Analytics pós-publicação | Nativo | — | — | — |
| Multi-provider LLM | 3 providers | Sim | Sim | — |
| Multi-tenant (orgs) | Nativo | — | — | Sim |
| i18n (3 idiomas) | PT, EN, ES | — | — | — |
| CLI | npx init | — | — | — |
| Budget por agente | Nativo | — | — | Sim |

---

## Roadmap

### Implementado

- [x] Core Pipeline (task chains, veto, review loops, run folders)
- [x] Conteúdo Inteligente (ângulos, tons, format injection)
- [x] Aprendizado (tour, company wizard, memória persistente)
- [x] Virtual Office 3D (React Three Fiber, 6 salas, agentes animados)
- [x] Features Avançadas (Sherlock, parallel execution, i18n, CLI)
- [x] Marketplace + SaaS (marketplace, scheduling, API, analytics, logging)
- [x] Integrações (42 premium + 700+ via Nango, webhooks, dev pipeline template)

### Próximos passos

- [ ] Deploy (Vercel + VPS para WebSocket/workers)
- [ ] Testes E2E
- [ ] Mobile responsive
- [ ] Billing/subscription (Stripe)
- [ ] White-label para agências
- [ ] AI image generation (DALL-E, Midjourney API)
- [ ] Video content pipeline (YouTube Shorts, Reels)

---

## Screenshots

> Screenshots em breve. O projeto roda localmente — siga o [Quick Start](#-quick-start) para ver ao vivo.

---

## Contribuindo

Contribuições são bem-vindas!

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit com mensagem semântica: `git commit -m "feat: add nova feature"`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

### Convenções de commit

- `feat:` nova feature
- `fix:` correção de bug
- `docs:` documentação
- `refactor:` refatoração sem mudança de comportamento
- `test:` testes
- `chore:` manutenção

---

## Licença

MIT License — veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">
  <p><strong>OrbitMind Platform</strong> — Squads de IA que trabalham para você.</p>
  <p>Feito com TypeScript, Next.js 15, React Three Fiber e muito café.</p>
  <p>
    <a href="https://github.com/Wesley-SdS/orbitmind-platform">GitHub</a>
  </p>
</div>
