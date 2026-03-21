# Squad YAML Specification

> Baseado no formato do OpenSquad, estendido para o OrbitMind Platform.

---

## Formato Completo

```yaml
# ──────────────────────────────────────────────
# Metadata
# ──────────────────────────────────────────────
name: "Nome legível do squad"
code: "slug-unico"                    # Único por organization
description: >
  Descrição multi-linha do que o squad faz
icon: "emoji"
version: "1.0.0"
created: "YYYY-MM-DD"

# ──────────────────────────────────────────────
# OrbitMind Extensions (não existem no OpenSquad)
# ──────────────────────────────────────────────
organization: "org-slug"              # Multi-tenant: organização dona
budget:
  monthly_tokens: 1000000             # Limite mensal de tokens
  warning_threshold: 0.8              # Alerta a 80%
  pause_threshold: 1.0                # Pausa a 100%

integrations:
  github:
    repo: "org/repo"
    sync_issues: true
    auto_pr: true
  discord:
    channel_id: "123456789"
    notifications: true

# ──────────────────────────────────────────────
# Contexto & Memória
# ──────────────────────────────────────────────
company: "_memory/company.md"         # Perfil da empresa (audiência, marca, tom)
preferences: "_memory/preferences.md" # Preferências do usuário
memory: "_memory/memories.md"         # Aprendizados do squad

# ──────────────────────────────────────────────
# Configuração de Domínio
# ──────────────────────────────────────────────
target_audience: "Descrição da audiência-alvo"
platform: "Instagram Feed"            # Plataforma de entrega
format: "instagram-feed"              # Chave de best-practices
performance_mode: "alta-performance"  # "alta-performance" | "econômico"

# ──────────────────────────────────────────────
# Skills
# ──────────────────────────────────────────────
skills:
  - web_search                        # Nativa (built-in)
  - web_fetch                         # Nativa (built-in)
  - image-creator                     # Custom (type: mcp)
  - social-publisher                  # Custom (type: script)

# ──────────────────────────────────────────────
# Dados de Referência
# ──────────────────────────────────────────────
data:
  - pipeline/data/research-brief.md
  - pipeline/data/domain-framework.md
  - pipeline/data/quality-criteria.md
  - pipeline/data/output-examples.md
  - pipeline/data/anti-patterns.md
  - pipeline/data/tone-of-voice.md

# ──────────────────────────────────────────────
# Agentes
# ──────────────────────────────────────────────
agents:
  - id: researcher                    # ID único (alphanumeric, kebab-case)
    name: "Nome Criativo"             # Display name
    icon: "emoji"                     # Avatar emoji
    custom: agents/researcher.md      # Definição do agente (frontmatter + markdown)

  - id: copywriter
    name: "Outro Nome"
    icon: "emoji"
    custom: agents/copywriter.md

# ──────────────────────────────────────────────
# Pipeline
# ──────────────────────────────────────────────
pipeline:
  entry: pipeline/pipeline.yaml       # Arquivo de definição do pipeline

# ──────────────────────────────────────────────
# Output
# ──────────────────────────────────────────────
output_dir: output/                   # Diretório de saída dos runs
```

---

## Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome legível do squad |
| `code` | string | Slug único (kebab-case) |
| `description` | string | Descrição do propósito |
| `icon` | string | Emoji representativo |
| `agents` | array | Lista de agentes (mínimo 2) |
| `pipeline.entry` | string | Path do pipeline YAML |

## Campos Opcionais

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `version` | string | "1.0.0" | Versão semântica |
| `organization` | string | — | Slug da organização |
| `budget` | object | — | Limites de custo |
| `integrations` | object | — | Conexões externas |
| `skills` | array | [] | Skills do squad |
| `data` | array | [] | Arquivos de referência |
| `performance_mode` | string | "alta-performance" | Modo de qualidade |
| `output_dir` | string | "output/" | Diretório de saída |

---

## Validação

1. `code` deve ser único dentro da organization
2. Cada `agent.id` deve ser único dentro do squad
3. `pipeline.entry` deve apontar para um arquivo YAML existente
4. Skills listadas devem estar instaladas ou serem nativas
5. `budget.warning_threshold` < `budget.pause_threshold`

---

*Spec v1.0 — OrbitMind Platform*
