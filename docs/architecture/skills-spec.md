# Skills Specification

> Sistema de skills reutilizáveis para agentes OrbitMind.

---

## Formato SKILL.md

Cada skill é definida em `skills/{skill-id}/SKILL.md` com frontmatter YAML + corpo markdown:

```yaml
---
name: "Nome da Skill"
description: "Descrição curta da skill"
type: "mcp"                          # mcp | script | hybrid | prompt
version: "1.0.0"
categories: [design, automation]

# Configuração MCP (type: mcp ou hybrid)
mcp:
  server_name: "playwright"
  command: "npx"
  args: ["@playwright/mcp@latest"]
  transport: "stdio"                 # stdio | http

# Configuração Script (type: script ou hybrid)
script:
  path: "scripts/main.js"
  runtime: "node"                    # node | python | bash
  invoke: "node {skill_path}/scripts/main.js --arg \"{input}\""
  dependencies: ["axios@latest"]

# Variáveis de ambiente requeridas
env:
  - API_TOKEN
  - USER_ID
---

## When to use

Descrição de quando usar esta skill...

## Instructions

Instruções detalhadas para o agente...

## Available Operations

- **Operação 1** — descrição
- **Operação 2** — descrição
```

---

## Tipos de Skill

| Tipo | Mecanismo | Caso de Uso |
|------|-----------|-------------|
| `mcp` | Conecta a servidor MCP externo | APIs (Playwright, Apify, Canva) |
| `script` | Executa script local | Publicação, processamento de dados |
| `hybrid` | MCP + scripts locais | Integrações complexas com fallback |
| `prompt` | Apenas instruções comportamentais | Diretrizes de SEO, tom de voz |

## Skills Nativas (Sempre Disponíveis)

- `web_search` — busca na web (built-in do runtime)
- `web_fetch` — fetch de páginas web (built-in do runtime)

---

## Injeção de Skills

Quando um agente executa, suas skills são injetadas no contexto:

1. Pular skills nativas (`web_search`, `web_fetch`)
2. Ler `skills/{skill-id}/SKILL.md`
3. Extrair corpo markdown (após frontmatter)
4. Append ao contexto do agente:

```
--- SKILL INSTRUCTIONS ---

## {Skill Name}
{Corpo markdown do SKILL.md}
```

---

## Catálogo e Marketplace

### Descoberta
1. Listar skills instaladas: `skills/*/SKILL.md`
2. Consultar catálogo remoto (futuro: API marketplace)
3. Match de categorias com necessidades do squad

### Versionamento
- Cada skill tem `version` semântica
- Updates via CLI: `orbitmind skill update {skill-id}`
- Lock file para reprodutibilidade

### Permissões
- Skills podem requerer permissões específicas (filesystem, network, API keys)
- Configuração de env vars por organização
- Audit de uso de skills por agente

---

## Ciclo de Vida

```
Install → Configure (env vars) → Assign to Agent → Execute → Monitor → Update
```

---

*Spec v1.0 — OrbitMind Platform*
