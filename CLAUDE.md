# CLAUDE.md — OrbitMind Platform

## Sobre o Projeto

OrbitMind é uma plataforma de orquestração de squads de agentes IA. Permite que empresas montem, configurem e operem equipes autônomas de agentes — de agências de marketing a times de desenvolvimento.

**Tagline:** "Squads de IA que trabalham para você — do chat à entrega."

**Diferencial:** Pipeline CI/CD autônomo validado (41+ PRs merged na Adalink) + interface web moderna + escritório virtual estilo Gather.

**Case inicial:** Agência de marketing 100% autônoma.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router) |
| UI | Tailwind CSS 4 + shadcn/ui |
| Real-time | WebSocket nativo |
| Canvas 2D | PixiJS 8 (virtual office) |
| Backend | Next.js API Routes |
| Banco | PostgreSQL 16 + Drizzle ORM |
| Auth | NextAuth v5 |
| Monorepo | Turborepo + pnpm |
| Language | TypeScript strict |

---

## Estrutura do Monorepo

```
apps/web/          → Next.js 15 (App Router) — frontend + API
packages/engine/   → Core do OrbitMind (squad runner, pipeline, state machine)
packages/cli/      → CLI: npx orbitmind init
packages/shared/   → Types, constants, validators compartilhados
templates/         → Templates de squads e skills
docs/              → Análise, arquitetura, PRDs
```

---

## Padrões de Código

### TypeScript
- `strict: true` em todos os tsconfig
- Sempre tipar retornos de funções públicas
- Usar `type` para tipos simples, `interface` para objetos extensíveis
- Zod para validação de input externo (API, forms, configs)
- Sem `any` — usar `unknown` + type narrowing quando necessário

### Imports
- Absolute imports com `@/` para o app web
- Workspace imports com `@orbitmind/engine`, `@orbitmind/shared`
- Barrel exports (`index.ts`) em cada package

### Naming
- Arquivos: kebab-case (`squad-runner.ts`)
- Componentes React: PascalCase (`ChatPanel.tsx`)
- Funções/variáveis: camelCase
- Constantes: UPPER_SNAKE_CASE
- Tipos/Interfaces: PascalCase
- Enums DB: snake_case

### React/Next.js
- Server Components por padrão — `"use client"` apenas quando necessário
- Server Actions para mutations
- Suspense boundaries para loading states
- Error boundaries para error handling

### Database
- Drizzle ORM — schema em `apps/web/lib/db/schema.ts`
- Queries em `apps/web/lib/db/queries/`
- Migrations via `drizzle-kit`
- UUID v4 para todas as PKs
- Timestamps com timezone

---

## Git

### Branches
- `main` — produção, protegida
- `develop` — integração
- `feat/nome` — features
- `fix/nome` — bug fixes
- `chore/nome` — manutenção

### Commits (Conventional Commits)
```
feat: add squad creation via chat
fix: resolve websocket reconnection on timeout
docs: add pipeline specification
chore: update dependencies
refactor: extract state machine from runner
```

### PRs
- Título curto (< 70 chars)
- Body com Summary (bullets) + Test Plan
- Review obrigatório antes de merge

---

## Comandos

```bash
pnpm install          # Instalar dependências
pnpm dev              # Dev server (todos os packages)
pnpm build            # Build de produção
pnpm typecheck        # Type checking
pnpm lint             # Linting
pnpm db:generate      # Gerar migrations Drizzle
pnpm db:push          # Push schema para DB
docker compose up -d  # Subir PostgreSQL
```

---

## Variáveis de Ambiente

Ver `.env.example` para lista completa. Obrigatórias para dev:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Secret para sessões
- `NEXTAUTH_URL` — URL base da aplicação

---

## Conceitos-Chave

### Squad
Equipe de agentes IA com pipeline definido. Configurado via `squad.yaml`.

### Agent
Membro do squad com persona, skills e budget próprios. Pode executar `inline` (no runner) ou como `subagent` (subprocesso).

### Pipeline
Sequência de steps que o squad executa. Suporta checkpoints, veto conditions, parallel execution.

### Skill
Capacidade reutilizável (web search, image generation, social publishing). Definida em `SKILL.md` com frontmatter.

### Execution
Instância de uma run do pipeline. Registra tokens, custo, duração, input/output.

### State
Estado real-time de execução. Broadcast via WebSocket para a UI.
