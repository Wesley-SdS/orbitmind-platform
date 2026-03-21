---
name: "GitHub Integration"
description: "Integracao com GitHub para criar issues, PRs e gerenciar repositorios"
type: "script"
version: "1.0.0"
categories: [development, automation, ci-cd]

script:
  path: "scripts/github.js"
  runtime: "node"
  invoke: "node {skill_path}/scripts/github.js --action \"{action}\" --repo \"{repo}\""
  dependencies: ["@octokit/rest@latest"]

env:
  - GITHUB_TOKEN
---

## When to use

Use GitHub Integration quando precisar interagir com repositorios GitHub: criar issues, abrir PRs, adicionar labels, fazer merge, ou consultar status de CI.

## Available Operations

- **Create Issue** — Cria issue com titulo, descricao, labels e assignees
- **Create PR** — Abre pull request com branch, titulo e descricao
- **Merge PR** — Faz merge de PR aprovado (squash por padrao)
- **Add Labels** — Adiciona labels a issues ou PRs
- **Create Branch** — Cria branch a partir de main/develop
- **Get CI Status** — Consulta status de checks/actions de um commit ou PR
- **List Open PRs** — Lista PRs abertos com filtros

## Instructions

1. Sempre use o token da organization, nao pessoal
2. Prefira squash merge para manter historico limpo
3. Adicione labels semanticas (feat, fix, chore, docs)
4. Inclua link da task no body da issue/PR
5. Nunca force push em branches protegidas
