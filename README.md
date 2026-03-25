<div align="center">
  <h1>OrbitMind Platform</h1>
  <p><strong>Squads de IA que trabalham para voce — do chat a entrega.</strong></p>
  <p>Plataforma de orquestracao de agentes IA autonomos. Monte equipes que pesquisam, criam, revisam e publicam — 100% pelo browser, sem terminal.</p>

  <p>
    <a href="#-features">Features</a> ·
    <a href="#-quick-start">Quick Start</a> ·
    <a href="#-arquitetura">Arquitetura</a> ·
    <a href="#-integracoes-700">Integracoes</a> ·
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
| **700+ integracoes** | GitHub, Slack, Jira, Linear, Notion, Google, Microsoft e mais via Nango |
| **Marketplace** | 10 agentes e 6 squads pre-configurados prontos para usar |
| **Escritorio Virtual 3D** | Acompanhe seus agentes trabalhando em tempo real com React Three Fiber |
| **Pipeline autonomo** | Veto conditions, review loops, checkpoints automaticos |
| **42 integracoes premium** | Actions profundas com UI de configuracao, tipadas e testadas |
| **Sherlock Investigator** | Analisa perfis reais de Instagram, YouTube, Twitter/X e LinkedIn |
| **i18n** | Portugues, English, Espanol |

---

## Indice

- [Features](#-features)
  - [Chat com Architect](#chat-com-architect)
  - [Board Kanban](#board-kanban)
  - [Virtual Office 3D](#virtual-office-3d)
  - [Pipeline Inteligente](#pipeline-inteligente)
  - [Conteudo Inteligente](#conteudo-inteligente)
  - [Marketplace](#marketplace)
  - [Integracoes (700+)](#integracoes-700)
  - [Sherlock Investigator](#sherlock-investigator)
  - [Scheduling e API](#scheduling-e-api)
  - [Analytics](#analytics)
  - [Multi-Provider LLM](#multi-provider-llm)
- [Quick Start](#-quick-start)
- [Arquitetura](#-arquitetura)
- [Stack Tecnico](#-stack-tecnico)
- [Comparativo](#-comparativo)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)
- [Licenca](#-licenca)

---

## Features

### Chat com Architect

O Architect e o agente central que entende o que voce precisa e monta o squad inteiro via chat. Descreva seu objetivo e ele cria agentes, define o pipeline e comeca a executar.

- **14 capacidades**: criar, editar, deletar, listar, pausar, ativar, duplicar, exportar squads
- **Chat universal**: input sempre ativo, sugestoes clicaveis, roteamento inteligente
- **Company wizard**: 5 perguntas no primeiro acesso para personalizar tudo
- **Context-aware**: sabe as integracoes conectadas e sugere acoes

### Board Kanban

Gestao visual de tasks com drag & drop entre colunas.

- Colunas: Backlog → In Progress → Review → Done
- Drag & drop nativo com `@dnd-kit`
- Atribuicao por agente
- Sincronizacao com Jira, Linear, Asana, ClickUp (via integracoes)

### Virtual Office 3D

Escritorio virtual futurista com React Three Fiber. Veja seus agentes trabalhando em tempo real.

- **6 salas tematicas**: Research Lab, Creative Studio, Review Room, Strategy Room, Publishing, Lobby
- **Agentes 3D**: robos metalicos com olhos neon, animacoes por status (working/idle/delivering)
- **Efeitos visuais**: chao reflexivo, bloom, particulas, hologramas flutuantes
- **Handoff animado**: particula voando entre agentes quando entregam trabalho
- **Camera orbital**: rotacao automatica, zoom, pan
- **Interativo**: clique no agente para ver detalhes

### Pipeline Inteligente

Pipeline de execucao com checkpoints automaticos, veto conditions e review loops.

- **Task chains**: agentes executam tarefas sequenciais com output encadeado
- **Veto conditions**: LLM verifica qualidade semanticamente, retry automatico 2x
- **Review loops**: reviewer rejeita → agente refaz com feedback, ate 3 ciclos
- **Run folders**: cada execucao gera runId + versionamento de outputs
- **Autonomy modes**: `interactive` (pausa a cada step) ou `autonomous` (roda tudo)
- **Performance mode**: Alta Performance (3-5x tokens, multiplos passes) ou Economico
- **Checkpoints**: `approve`, `select`, `skip` — configuravel por step

### Conteudo Inteligente

Nao e conteudo generico — sao angulos criativos, tom de voz e regras de plataforma.

- **5 angulos criativos** gerados por IA para cada tema (medo, oportunidade, educacional, contrario, inspiracional)
- **6 tons de voz**: profissional, casual, tecnico, divertido, inspirador, provocativo
- **22 best-practices** injetadas automaticamente (7 disciplinas + 14 plataformas)
- **Memoria persistente**: squad lembra preferencias e melhora a cada execucao

### Marketplace

Adquira agentes especializados e squads completos prontos para usar.

- **16 itens**: 10 agentes avulsos + 6 squads completos
- **Squads prontos**: Instagram Carousel Factory, YouTube Content Machine, Email Marketing, LinkedIn Thought Leader, Customer Support, Dev Pipeline
- **Squads completos**: cria squad inteiro na sua org com 1 clique
- **Dev Pipeline**: squad que replica a esteira de desenvolvimento autonoma (Issue → PR → Review → Merge)

### Integracoes (700+)

42 integracoes premium com actions profundas + 700+ genericas via Nango.

**Premium (com UI de configuracao e actions tipadas):**

| Categoria | Integracoes |
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

**+ 670+ genericas** disponiveis via catalogo Nango com OAuth em 1 clique.

### Sherlock Investigator

Analisa perfis reais de redes sociais para calibrar seus agentes com dados de verdade.

- **4 plataformas**: Instagram, YouTube, Twitter/X, LinkedIn
- **Extracao**: carrosseis, reels, posts, videos, artigos, threads
- **Pattern analysis**: hooks, CTAs, vocabulario, tom, engagement drivers via LLM
- **Consolidacao**: multiplos perfis → relatorio unificado de padroes

### Scheduling e API

Automatize completamente — agende execucoes e dispare pipelines via API.

- **Agendamento cron**: "todo dia as 9h", "toda segunda as 14h"
- **API publica**: `POST /api/v1/squads/{id}/run` com Bearer token
- **API tokens**: SHA-256 hash, gerar/revogar em Settings
- **Webhooks**: receba eventos de GitHub, Slack, Jira e processe automaticamente

```bash
curl -X POST https://app.orbitmind.com/api/v1/squads/{id}/run \
  -H "Authorization: Bearer om_xxxxxxxxxxxx" \
  -d '{"input": "Tema: IA no marketing"}'
```

### Analytics

Metricas pos-publicacao com feedback loop automatico.

- **Metricas**: likes, comments, shares, saves, views, reach, engagement rate
- **Feedback loop**: apos coletar metricas, gera memorias automaticamente
- **Por plataforma**: Instagram, LinkedIn, YouTube (extensivel)

### Multi-Provider LLM

Configure o provider de IA direto pela interface — sem `.env`, sem terminal.

- **Anthropic**: Claude Opus 4.6, Sonnet 4.6, Haiku 4.5
- **OpenAI**: GPT-5.4, o3-pro
- **Google**: Gemini 3.1 Pro
- Troque a qualquer momento sem reconfigurar nada

### Onboarding

Setup em 5 minutos, zero configuracao tecnica.

- **Tour interativo**: 11 steps guiados pela interface (Onborda)
- **Company wizard**: 5 perguntas no chat para personalizar o produto
- **Primeiro squad**: descreva o que precisa e o Architect monta tudo

### CLI

```bash
npx orbitmind init
```

Wizard interativo: nome da org, template, provider de IA, database URL, gera `.env` automatico.

### i18n

Suporte a 3 idiomas: Portugues (BR), English, Espanol. Configuravel por organizacao.

### Pipeline Logging

Logs estruturados de cada execucao para debugging e auditoria.

- **Eventos**: step_start, step_complete, veto_triggered, review_rejected, handoff, pipeline_complete
- **Filtros**: por nivel (info/warn/error), por run, por step
- **Token tracking**: consumo por step e por agente

---

## Quick Start

### Pre-requisitos

- Node.js 20+
- pnpm 9+
- Docker (para PostgreSQL)
- Uma chave de API: Anthropic, OpenAI ou Google Gemini

### Instalacao

```bash
# Clone o repositorio
git clone https://github.com/Wesley-SdS/orbitmind-platform.git
cd orbitmind-platform

# Instale dependencias
pnpm install

# Suba o PostgreSQL
docker compose up -d

# Configure variaveis de ambiente
cp apps/web/.env.example apps/web/.env
# Edite .env com suas credenciais

# Aplique o schema e seed
pnpm db:push
pnpm db:seed

# Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse `http://localhost:3000` e faca login com `admin@orbitmind.com / admin123`.

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
│       ├── components/         # 57 React components
│       │   ├── chat/           # Chat interface
│       │   ├── board/          # Kanban board
│       │   ├── office/         # Virtual Office 3D (R3F)
│       │   └── ui/             # 28 shadcn/ui components
│       └── lib/
│           ├── db/             # Drizzle ORM — 24 tabelas
│           ├── engine/         # Architect, chat handler
│           └── integrations/   # Nango client + 42 premium integrations
├── packages/
│   ├── engine/                 # Core: PipelineRunner, Sherlock, Skills
│   ├── shared/                 # Types, constants, validators
│   └── cli/                    # npx orbitmind init
├── templates/                  # 4 squad + 5 skill templates
└── docs/                       # Analise, arquitetura, PRDs
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

## Stack Tecnico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4 |
| **UI Components** | shadcn/ui (28 componentes) |
| **3D Engine** | React Three Fiber + drei + postprocessing |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **Auth** | NextAuth v5 |
| **Real-time** | WebSocket (native) |
| **Integracoes** | Nango (700+ APIs) |
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
| Chat com Architect | 14 acoes | — | — | — |
| Board Kanban | Drag & drop | — | — | — |
| Virtual Office 3D | Three.js | — | — | — |
| Marketplace | 16 itens | — | — | — |
| 700+ Integracoes | Nango | — | — | — |
| Pipeline autonomo | Validado | Basico | Basico | Basico |
| Veto conditions | LLM-based | — | — | — |
| Review loops | 3 ciclos | — | — | — |
| Checkpoints | 3 tipos | — | — | — |
| Sherlock (analise perfis) | 4 redes | — | — | — |
| Angulos criativos | 5 angulos | — | — | — |
| Memoria persistente | Por squad | — | — | — |
| Scheduling (cron) | Nativo | — | — | — |
| API publica + webhooks | REST + WS | — | — | — |
| Analytics pos-publicacao | Nativo | — | — | — |
| Multi-provider LLM | 3 providers | Sim | Sim | — |
| Multi-tenant (orgs) | Nativo | — | — | Sim |
| i18n (3 idiomas) | PT, EN, ES | — | — | — |
| CLI | npx init | — | — | — |
| Budget por agente | Nativo | — | — | Sim |

---

## Roadmap

### Implementado

- [x] Core Pipeline (task chains, veto, review loops, run folders)
- [x] Conteudo Inteligente (angulos, tons, format injection)
- [x] Aprendizado (tour, company wizard, memoria persistente)
- [x] Virtual Office 3D (React Three Fiber, 6 salas, agentes animados)
- [x] Features Avancadas (Sherlock, parallel execution, i18n, CLI)
- [x] Marketplace + SaaS (marketplace, scheduling, API, analytics, logging)
- [x] Integracoes (42 premium + 700+ via Nango, webhooks, dev pipeline template)

### Proximos passos

- [ ] Deploy (Vercel + VPS para WebSocket/workers)
- [ ] Testes E2E
- [ ] Mobile responsive
- [ ] Billing/subscription (Stripe)
- [ ] White-label para agencias
- [ ] AI image generation (DALL-E, Midjourney API)
- [ ] Video content pipeline (YouTube Shorts, Reels)

---

## Screenshots

> Screenshots em breve. O projeto roda localmente — siga o [Quick Start](#-quick-start) para ver ao vivo.

---

## Contribuindo

Contribuicoes sao bem-vindas!

1. Fork o repositorio
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit com mensagem semantica: `git commit -m "feat: add nova feature"`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

### Convencoes de commit

- `feat:` nova feature
- `fix:` correcao de bug
- `docs:` documentacao
- `refactor:` refatoracao sem mudanca de comportamento
- `test:` testes
- `chore:` manutencao

---

## Licenca

MIT License — veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">
  <p><strong>OrbitMind Platform</strong> — Squads de IA que trabalham para voce.</p>
  <p>Feito com TypeScript, Next.js 15, React Three Fiber e muito cafe.</p>
  <p>
    <a href="https://github.com/Wesley-SdS/orbitmind-platform">GitHub</a>
  </p>
</div>
