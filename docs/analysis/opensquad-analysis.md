# Análise Completa do OpenSquad

> Gerado em 2026-03-21 a partir do repositório `opensquad-ref/`
> Objetivo: extrair conceitos reutilizáveis para o OrbitMind Platform

---

## 1. Conceitos a Aproveitar

### 1.1 Formato `squad.yaml`

O OpenSquad define squads via YAML com a seguinte estrutura:

```yaml
name: "Nome do Squad"
code: "slug-unico"
description: "Descrição multi-linha"
icon: "emoji"
version: "1.0.0"
created: "YYYY-MM-DD"

# Contexto persistente
company: "_opensquad/_memory/company.md"
preferences: "_opensquad/_memory/preferences.md"
memory: "_memory/memories.md"

# Configuração de audiência
target_audience: "Descrição da audiência"
platform: "Instagram Feed"
format: "instagram-feed"
performance_mode: "alta-performance"  # ou "econômico"

# Skills integradas
skills:
  - web_search        # nativa
  - web_fetch          # nativa
  - image-creator      # custom (MCP)
  - instagram-publisher # custom (script)

# Dados de referência injetados nos agentes
data:
  - pipeline/data/research-brief.md
  - pipeline/data/tone-of-voice.md

# Roster de agentes
agents:
  - id: researcher
    name: "Nome Criativo"
    icon: "emoji"
    custom: agents/researcher.custom.md

# Pipeline
pipeline:
  entry: pipeline/pipeline.yaml

output_dir: output/
```

**Campos a adicionar no OrbitMind:** `organization`, `budget`, `integrations`, `webhooks`

### 1.2 Formato `state.json`

Contrato entre engine e UI para estado em tempo real:

```json
{
  "squad": "codigo-do-squad",
  "status": "idle | running | completed | checkpoint | failed",
  "step": { "current": 5, "total": 13, "label": "step-05" },
  "agents": [
    {
      "id": "researcher",
      "name": "Nome",
      "icon": "emoji",
      "status": "idle | working | delivering | done | checkpoint",
      "deliverTo": null,
      "desk": { "col": 1, "row": 1 }
    }
  ],
  "handoff": {
    "from": "copywriter",
    "to": "image-designer",
    "message": "Resumo do que foi entregue",
    "completedAt": "ISO-timestamp"
  },
  "startedAt": "ISO-timestamp",
  "updatedAt": "ISO-timestamp",
  "completedAt": "ISO-timestamp"
}
```

**Campos a adicionar:** `budgetUsed`, `metricsSnapshot`, `auditEvents`, `executionId`

### 1.3 Sistema de Skills

Skills são definidas em `skills/{skill-id}/SKILL.md` com frontmatter YAML:

```yaml
---
name: "Image Creator"
description: "Renderiza HTML/CSS em imagens via Playwright"
type: "mcp"          # mcp | script | hybrid | prompt
version: "1.0.0"
categories: [design, automation, images]

mcp:
  server_name: "playwright"
  command: "npx"
  args: ["@playwright/mcp@latest"]
  transport: "stdio"

script:
  path: "scripts/publish.js"
  runtime: "node"
  invoke: "node {skill_path}/scripts/publish.js"
  dependencies: ["axios@latest"]

env:
  - API_TOKEN
  - USER_ID
---

## When to use
...instruções em markdown...
```

**Tipos:**
- `mcp` — conecta a servidor MCP externo (Playwright, Apify)
- `script` — executa script local (Node/Python/Bash)
- `hybrid` — MCP + scripts locais
- `prompt` — apenas instruções comportamentais

**A adicionar:** skill marketplace, skill versioning, skill permissions

### 1.4 Pipeline Runner

O `runner.pipeline.md` (396 linhas) define como squads executam:

**Fases de execução:**
1. **Inicialização** — carrega squad.yaml, resolve skills, gera run ID
2. **Para cada step** — atualiza state.json, despacha agente (inline ou subagent)
3. **Handoff** — animação de entrega entre agentes (3s delay)
4. **Checkpoints** — pausa para aprovação humana
5. **Conclusão** — salva output, atualiza memória, limpa state

**Modos de execução:**
- `inline` — agente executa no contexto do runner (persona switching)
- `subagent` — agente despachado como subprocesso (Task tool)

**Veto conditions** — regras que invalidam output do agente (max 2 retries)

**Output path transformation** — injeta run_id e versioning automático

**A adicionar:** parallel execution, conditional steps, CI/CD integration, retry policies

### 1.5 Architect Agent

Agente que cria squads automaticamente em 9 fases:
1. Discovery (3-4 perguntas)
2. Domain Research (subagentes pesquisam)
3. Skill Discovery (match com catálogo)
4. Performance Mode Selection
5. Agent Design (roster, personas, tasks)
6. Build (gera todos os arquivos)
7. Validation

**Princípios importantes:**
- YAGNI — nunca criar agentes desnecessários
- Cada agente com uma responsabilidade clara
- Checkpoints obrigatórios em pontos de decisão
- Todo squad precisa de um reviewer agent
- Máximo 4 perguntas de discovery

### 1.6 Model Tier Configuration

```yaml
models:
  orchestrator: powerful   # Architect, Pipeline Runner
  writer: powerful         # Criação de conteúdo
  researcher: fast         # Pesquisa factual
  investigator: fast       # Extração de padrões
```

Mapeamento por ambiente:
| Tier | Claude Code | Antigravity | Codex |
|------|-------------|-------------|-------|
| powerful | claude-opus | Gemini Pro | o3 |
| fast | claude-haiku | Gemini Flash | gpt-4o-mini |

### 1.7 Memory System

- `_memory/company.md` — contexto global (audiência, marca, tom de voz)
- `_memory/preferences.md` — preferências do usuário
- `_memory/memories.md` — aprendizados do squad (atualizado a cada run)

Memórias incluem: learnings, performance notes, recurring issues.

### 1.8 Squad-Party.csv

Roster de agentes em CSV para referência rápida:

```csv
id,name,icon,role,path,execution,skills
researcher,Ângela Ângulo,🔍,Descrição do papel,./agents/researcher.custom.md,subagent,"web_search,web_fetch"
```

---

## 2. Conceitos a Descartar

### 2.1 Dashboard PixiJS Pixel Art
O OpenSquad usa PixiJS para renderizar um escritório virtual pixel art (estilo Gather.town) com:
- Desks com monitores, cadeiras, acessórios
- Characters sprite-based por agente
- Screen glow para status "working"

**Decisão:** Refazer com React + design system moderno. Na fase final, implementar virtual office com PixiJS 8 ou React-Konva, mas com design premium (não pixel art).

### 2.2 Vite Plugin como WebSocket Server
O OpenSquad usa um Vite plugin (`squadWatcher.ts`) que:
- Observa mudanças em `state.json` via chokidar
- Broadcast via WebSocket em `/__squads_ws`
- Fallback para HTTP polling em `/api/snapshot`

**Decisão:** Refazer com Next.js API routes + WebSocket nativo. O Vite plugin é acoplado ao dev server e não serve para produção.

### 2.3 File-Based State
O estado é persistido em `state.json` no filesystem.

**Decisão:** Migrar para PostgreSQL. State machine no banco com real-time via WebSocket.

### 2.4 Execução via Terminal/IDE Only
O OpenSquad roda exclusivamente em Claude Code/VS Code/terminal.

**Decisão:** Construir web UI completa. Zero terminal para o usuário final.

### 2.5 Foco Exclusivo em Conteúdo/Marketing
O OpenSquad é otimizado para criação de conteúdo (carrosséis Instagram).

**Decisão:** Generalizar para qualquer domínio (dev, suporte, compliance, operações).

---

## 3. Conceitos a Adicionar (Inexistentes no OpenSquad)

| Conceito | Justificativa |
|----------|---------------|
| **Autenticação multi-tenant** | Organization → Squad → Agent hierarchy |
| **Budget e métricas de custo** | Controle financeiro por agente (inspirado Paperclip) |
| **Integração GitHub/GitLab** | Repos, issues, PRs, webhooks bidirecionais |
| **Integração Discord/Telegram** | Interface de chat alternativa |
| **Pipeline CI/CD completo** | Diferencial validado no Vektus/Adalink (41+ PRs) |
| **Board visual Kanban** | Gestão de tarefas drag & drop |
| **Audit log imutável** | Compliance e rastreabilidade |
| **Escritório virtual 2D** | Visualização estilo Gather (design premium) |
| **Onboarding CLI** | `npx orbitmind init` para setup em 5 minutos |
| **Messages/Chat persistente** | Histórico de conversas com agentes |
| **Parallel execution** | Steps que podem rodar em paralelo |
| **Conditional steps** | Pipeline com branches condicionais |
| **Skill marketplace** | Catálogo de skills com install/update |

---

## 4. Arquivos-Chave Analisados

| Arquivo | Conteúdo | Aproveitamento |
|---------|----------|----------------|
| `squads/*/squad.yaml` | Definição completa do squad | Adaptar formato |
| `squads/*/state.json` | Estado de execução | Adaptar contrato |
| `skills/*/SKILL.md` | Definição de skills | Adaptar formato |
| `_opensquad/core/runner.pipeline.md` | Regras do pipeline runner (396 linhas) | Extrair especificação |
| `_opensquad/core/architect.agent.yaml` | Architect agent definition | Adaptar workflow |
| `_opensquad/config.yaml` | Model tier config | Adaptar para multi-runtime |
| `squads/*/squad-party.csv` | Roster de agentes | Migrar para DB |
| `_opensquad/_memory/company.md` | Contexto global | Migrar para DB (Organization.settings) |
| `dashboard/src/` | PixiJS + Zustand + WebSocket | Descartar implementação, manter conceitos |

---

*Análise gerada em 2026-03-21 — OrbitMind Platform Bootstrap*
