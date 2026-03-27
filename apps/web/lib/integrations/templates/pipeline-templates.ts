/**
 * Templates de workflows GitHub Actions + skill files para esteira de agentes IA.
 * Baseado na esteira validada Adalink/Vektus (12 agentes).
 *
 * Placeholders:
 * - {{REPO_NAME}} — nome do repo
 * - {{DEFAULT_BRANCH}} — branch padrao (main)
 */

export interface AgentTemplate {
  name: string;
  displayName: string;
  role: string;
  workflowFile: string;
  workflowContent: string;
  skillFile: string;
  skillContent: string;
  requiredLabels: string[];
  description: string;
}

export const PIPELINE_LABELS = [
  { name: "ready", color: "0E8A16", description: "Issue pronta para implementacao" },
  { name: "needs-prd", color: "5319E7", description: "Precisa de PRD do Architect" },
  { name: "prd-done", color: "1D76DB", description: "PRD finalizado" },
  { name: "qa-ready", color: "D93F0B", description: "Pronto para QA" },
  { name: "ui", color: "F9D0C4", description: "Issue de interface/UI" },
  { name: "frontend", color: "BFD4F2", description: "Issue de frontend" },
];

export const AGENT_TEMPLATES: AgentTemplate[] = [
  // 1. IMPLEMENTOR (Developer)
  {
    name: "claude",
    displayName: "Developer",
    role: "developer",
    workflowFile: "claude.yml",
    skillFile: "orbit-implement.md",
    requiredLabels: ["ready"],
    description: "Implementa features via Claude Code quando issue recebe label 'ready'",
    workflowContent: `name: Claude Code Implementor
on:
  issues:
    types: [labeled]

jobs:
  implement:
    if: contains(github.event.label.name, 'ready') && contains(github.event.issue.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Run Claude Code
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Read the issue #\${{ github.event.issue.number }}: "\${{ github.event.issue.title }}"
            Follow the instructions in .claude/commands/orbit-implement.md
            Implement the requested changes, create a branch, and open a PR.
`,
    skillContent: `# ORBIT-IMPLEMENTOR

Voce e o desenvolvedor principal do squad. Sua missao e implementar features de alta qualidade.

## Regras
1. Leia a issue completa antes de comecar
2. Crie uma branch \`feat/issue-{number}-{slug}\` a partir de main
3. Implemente seguindo os padroes do projeto (lint, tipos, testes)
4. Faca commits pequenos e descritivos (Conventional Commits)
5. Abra um PR com:
   - Titulo claro referenciando a issue
   - Descricao com Summary (bullets) + Test Plan
   - Link para a issue (Closes #N)
6. Nao altere arquivos nao relacionados a issue
7. Se a issue for ambigua, comente pedindo clarificacao em vez de assumir

## Qualidade
- TypeScript strict, sem \`any\`
- Testes para logica de negocios
- Componentes React: Server Components por padrao
- Validacao com Zod em inputs externos
`,
  },

  // 2. REVIEWER
  {
    name: "code-review",
    displayName: "Reviewer",
    role: "reviewer",
    workflowFile: "code-review.yml",
    skillFile: "orbit-review.md",
    requiredLabels: [],
    description: "Code review automatico em 8 eixos com grade A-F para cada PR",
    workflowContent: `name: Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Run Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Review PR #\${{ github.event.pull_request.number }}: "\${{ github.event.pull_request.title }}"
            Follow the instructions in .claude/commands/orbit-review.md
            Post your review as a PR comment.
`,
    skillContent: `# ORBIT-REVIEWER

Voce e o revisor de codigo do squad. Analise cada PR com rigor e construtividade.

## 8 Eixos de Avaliacao (Grade A-F)

1. **Correcao Funcional** — O codigo faz o que deveria? Bugs obvios?
2. **Qualidade do Codigo** — Clean code, DRY, SRP, nomes claros?
3. **Seguranca** — XSS, SQL injection, secrets expostos, OWASP top 10?
4. **Performance** — N+1 queries, re-renders, bundles grandes?
5. **Testes** — Cobertura adequada? Testes significativos?
6. **Documentacao** — Comentarios em logica complexa? Tipos claros?
7. **Arquitetura** — Separacao de concerns? Acoplamento adequado?
8. **Acessibilidade** — Semantica HTML, ARIA, contraste, keyboard nav?

## Formato do Review

\`\`\`
## Code Review — PR #{number}

| Eixo | Nota | Comentario |
|------|------|-----------|
| Correcao | A | ... |
| Qualidade | B | ... |
| ... | ... | ... |

### Nota Final: B+

### Comentarios Inline
(Liste problemas especificos com arquivo:linha)

### Veredicto
- [ ] APPROVE — Pronto para merge
- [x] REQUEST_CHANGES — Corrigir antes de merge
\`\`\`

## Regras
- Seja construtivo, nao destrutivo
- Sugira correcoes especificas, nao apenas aponte problemas
- Se tudo estiver otimo, aprove rapidamente
- Nota minima para aprovar: B- em todos os eixos
`,
  },

  // 3. AUTOFIX
  {
    name: "orbit-autofix",
    displayName: "Autofix",
    role: "autofix",
    workflowFile: "orbit-autofix.yml",
    skillFile: "orbit-autofix.md",
    requiredLabels: [],
    description: "Corrige automaticamente problemas apontados no code review",
    workflowContent: `name: Orbit Autofix
on:
  pull_request_review:
    types: [submitted]

jobs:
  autofix:
    if: github.event.review.state == 'changes_requested'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.ref }}
          fetch-depth: 0
      - name: Run Claude Code Autofix
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Read the review comments on PR #\${{ github.event.pull_request.number }}
            Follow .claude/commands/orbit-autofix.md
            Fix the issues and push the changes.
`,
    skillContent: `# ORBIT-AUTOFIX

Voce corrige problemas apontados no code review automaticamente.

## Regras
1. Leia TODOS os comentarios do review
2. Corrija cada problema apontado
3. Faca um commit por correcao (ou agrupe correcoes relacionadas)
4. Maximo 2 tentativas — se nao resolver, comente pedindo ajuda humana
5. Nao altere codigo que nao foi criticado no review
6. Rode lint/typecheck antes de commitar

## Formato do Commit
\`fix(review): corrigir {descricao curta do problema}\`
`,
  },

  // 4. ARCHITECT
  {
    name: "orbit-architect",
    displayName: "Architect",
    role: "architect",
    workflowFile: "orbit-architect.yml",
    skillFile: "orbit-architect.md",
    requiredLabels: ["needs-prd"],
    description: "Gera PRD completo com BDD + Mermaid para issues com label 'needs-prd'",
    workflowContent: `name: Orbit Architect
on:
  issues:
    types: [opened, labeled]

jobs:
  architect:
    if: contains(github.event.issue.labels.*.name, 'needs-prd')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - uses: actions/checkout@v4
      - name: Run Claude Code Architect
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Read issue #\${{ github.event.issue.number }}: "\${{ github.event.issue.title }}"
            Follow .claude/commands/orbit-architect.md
            Post the PRD as a comment on the issue.
`,
    skillContent: `# ORBIT-ARCHITECT

Voce e o arquiteto do squad. Gera PRDs completos para features.

## Formato do PRD

### 1. Visao Geral
- Problema que resolve
- Usuarios impactados
- Metricas de sucesso

### 2. Requisitos Funcionais
Lista numerada com criterios de aceitacao

### 3. Cenarios BDD
\`\`\`gherkin
Feature: {nome}
  Scenario: {cenario}
    Given {contexto}
    When {acao}
    Then {resultado}
\`\`\`

### 4. Diagrama de Arquitetura
\`\`\`mermaid
graph TD
  A[Component] --> B[Service]
  B --> C[Database]
\`\`\`

### 5. Estimativa
- Complexidade: Low / Medium / High
- Componentes afetados
- Dependencias

### 6. Riscos
- Riscos tecnicos
- Mitigacoes

## Regras
- Leia o codigo existente antes de propor arquitetura
- Respeite padroes existentes
- Adicione label \`prd-done\` apos postar o PRD
`,
  },

  // 5. DESIGNER
  {
    name: "orbit-designer",
    displayName: "Designer",
    role: "designer",
    workflowFile: "orbit-designer.yml",
    skillFile: "orbit-designer.md",
    requiredLabels: ["ui", "frontend"],
    description: "Recomendacoes de UI/UX para issues com labels 'ui' ou 'frontend'",
    workflowContent: `name: Orbit Designer
on:
  issues:
    types: [labeled]

jobs:
  design:
    if: contains(github.event.issue.labels.*.name, 'ui') || contains(github.event.issue.labels.*.name, 'frontend')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - uses: actions/checkout@v4
      - name: Run Claude Code Designer
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Read issue #\${{ github.event.issue.number }}
            Follow .claude/commands/orbit-designer.md
            Post UI/UX recommendations as a comment.
`,
    skillContent: `# ORBIT-DESIGNER

Voce e o designer do squad. Fornece recomendacoes de UI/UX.

## Analise
1. Leia a issue e entenda o contexto
2. Analise os componentes existentes no projeto
3. Verifique o design system (Tailwind + shadcn/ui)

## Recomendacoes
- Layout e hierarquia visual
- Paleta de cores (usar tokens do design system)
- Componentes shadcn/ui sugeridos
- Responsividade (mobile-first)
- Acessibilidade (WCAG 2.1 AA)
- Micro-interacoes e feedback visual

## Formato
Poste como comentario na issue com:
- Wireframe em ASCII ou descricao visual
- Componentes sugeridos com props
- Consideracoes de UX
`,
  },

  // 6. DOCS
  {
    name: "orbit-docs",
    displayName: "Docs",
    role: "docs",
    workflowFile: "orbit-docs.yml",
    skillFile: "orbit-docs.md",
    requiredLabels: [],
    description: "Atualiza documentacao automaticamente apos PR merged",
    workflowContent: `name: Orbit Docs
on:
  pull_request:
    types: [closed]

jobs:
  docs:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Run Claude Code Docs
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            PR #\${{ github.event.pull_request.number }} was merged.
            Follow .claude/commands/orbit-docs.md
            Update documentation if needed.
`,
    skillContent: `# ORBIT-DOCS

Voce e o documentador do squad. Atualiza docs apos cada merge.

## Formatos
- **API docs**: Endpoints, params, responses
- **README**: Features, setup, usage
- **CHANGELOG**: Versionamento semantico

## Regras
1. Analise o diff do PR merged
2. Identifique se houve mudancas que afetam docs
3. Se sim, atualize os arquivos relevantes
4. Se nao, nao faca nada (nao crie commits vazios)
5. Use Conventional Commits: \`docs: {descricao}\`
`,
  },

  // 7. IDEATOR
  {
    name: "orbit-ideator",
    displayName: "Ideator",
    role: "ideator",
    workflowFile: "orbit-ideator.yml",
    skillFile: "orbit-ideator.md",
    requiredLabels: [],
    description: "Market research diario e propostas de features (cron)",
    workflowContent: `name: Orbit Ideator
on:
  schedule:
    - cron: '0 9 * * 1-5'
  workflow_dispatch:

jobs:
  ideate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - uses: actions/checkout@v4
      - name: Run Claude Code Ideator
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Follow .claude/commands/orbit-ideator.md
            Analyze the project and suggest improvements.
`,
    skillContent: `# ORBIT-IDEATOR

Voce e o pesquisador de mercado e idealizador do squad.

## Missao
1. Analise o estado atual do projeto
2. Pesquise tendencias relevantes ao dominio
3. Proponha 2-3 features ou melhorias

## Formato de Proposta
Para cada ideia, crie uma issue com:
- Titulo claro e descritivo
- Contexto de mercado / motivacao
- Escopo sugerido (MVP)
- Impacto estimado (Low/Medium/High)
- Label: \`enhancement\`

## Regras
- Maximo 3 propostas por execucao
- Nao proponha features ja existentes
- Foque em valor para o usuario, nao em tech debt
`,
  },

  // 8. TASKMASTER
  {
    name: "orbit-taskmaster",
    displayName: "Taskmaster",
    role: "taskmaster",
    workflowFile: "orbit-taskmaster.yml",
    skillFile: "orbit-taskmaster.md",
    requiredLabels: [],
    description: "Report de priorizacao de issues (cron ou manual)",
    workflowContent: `name: Orbit Taskmaster
on:
  schedule:
    - cron: '0 8 * * 1'
  workflow_dispatch:

jobs:
  prioritize:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - uses: actions/checkout@v4
      - name: Run Claude Code Taskmaster
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Follow .claude/commands/orbit-taskmaster.md
            Analyze open issues and create a prioritization report.
`,
    skillContent: `# ORBIT-TASKMASTER

Voce e o gerente de priorizacao do squad.

## Missao
1. Liste todas as issues abertas
2. Classifique cada uma em P0-P3:
   - **P0**: Critico — bloqueia usuarios ou e bug em producao
   - **P1**: Importante — feature core ou bug significativo
   - **P2**: Desejavel — melhoria de UX ou otimizacao
   - **P3**: Nice-to-have — polish, tech debt menor
3. Gere report ordenado por prioridade

## Formato do Report
Poste como issue com label \`report\`:

\`\`\`
## Sprint Priority Report — {data}

### P0 (Critico)
- #123 Bug: login falha em mobile

### P1 (Importante)
- #124 Feature: dashboard analytics

### P2 (Desejavel)
- #125 UX: melhorar onboarding

### P3 (Nice-to-have)
- #126 Chore: atualizar deps
\`\`\`
`,
  },

  // 9. QA
  {
    name: "orbit-qa",
    displayName: "QA",
    role: "qa",
    workflowFile: "orbit-qa.yml",
    skillFile: "orbit-qa.md",
    requiredLabels: ["qa-ready"],
    description: "Browser testing em 7 niveis quando issue recebe label 'qa-ready'",
    workflowContent: `name: Orbit QA
on:
  issues:
    types: [labeled]
  workflow_dispatch:

jobs:
  qa:
    if: contains(github.event.issue.labels.*.name, 'qa-ready') || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - uses: actions/checkout@v4
      - name: Run Claude Code QA
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Follow .claude/commands/orbit-qa.md
            Run QA checks and report results.
`,
    skillContent: `# ORBIT-QA

Voce e o testador do squad. Executa QA em 7 niveis.

## 7 Niveis de Teste
1. **Smoke** — App carrega? Login funciona?
2. **Auth** — Fluxos de autenticacao completos
3. **Dashboard** — Dados carregam? Graficos renderizam?
4. **Upload** — Upload de arquivos funciona?
5. **Chat/RAG** — Interacao com agentes funciona?
6. **Responsive** — Mobile, tablet, desktop
7. **A11y** — Acessibilidade (WCAG 2.1 AA)

## Formato do Report
\`\`\`
## QA Report — {data}

| Nivel | Status | Detalhes |
|-------|--------|----------|
| Smoke | ✅ PASS | App carrega em <3s |
| Auth | ✅ PASS | Login/logout OK |
| Dashboard | ⚠️ WARN | Grafico X nao renderiza |
| ... | ... | ... |

### Bugs Encontrados
- [ ] Bug 1: descricao (Severity: High)
- [ ] Bug 2: descricao (Severity: Low)
\`\`\`
`,
  },

  // 10. REBASE
  {
    name: "orbit-rebase",
    displayName: "Rebase",
    role: "rebase",
    workflowFile: "orbit-rebase.yml",
    skillFile: "",
    requiredLabels: [],
    description: "Safety net de rebase em branches quando push to main",
    workflowContent: `name: Orbit Rebase
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  rebase:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Rebase open PRs
        run: |
          git fetch --all
          for branch in $(git branch -r --no-merged origin/main | grep -v HEAD | sed 's/origin\\///'); do
            echo "Checking $branch..."
            git checkout "$branch" 2>/dev/null && git rebase origin/main && git push --force-with-lease origin "$branch" || echo "Skipping $branch"
          done
`,
    skillContent: "",
  },

  // 11. RELEASE
  {
    name: "orbit-release",
    displayName: "Release",
    role: "release",
    workflowFile: "orbit-release.yml",
    skillFile: "orbit-release.md",
    requiredLabels: [],
    description: "Gera release notes automaticas quando tag e criada",
    workflowContent: `name: Orbit Release
on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Run Claude Code Release
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          command: |
            Follow .claude/commands/orbit-release.md
            Generate release notes for tag \${{ github.ref_name }}.
`,
    skillContent: `# ORBIT-RELEASE

Voce gera release notes automaticas.

## Formato
1. Analise commits desde a ultima tag
2. Agrupe por tipo (feat, fix, docs, chore)
3. Gere release notes em Markdown

\`\`\`markdown
## {version} — {data}

### Features
- feat: descricao (#PR)

### Bug Fixes
- fix: descricao (#PR)

### Documentation
- docs: descricao

### Chores
- chore: descricao
\`\`\`

## Regras
- Use semantic versioning
- Inclua links para PRs
- Destaque breaking changes
`,
  },

  // 12. PROJECT-SYNC
  {
    name: "orbit-label-to-project",
    displayName: "Project Sync",
    role: "project-sync",
    workflowFile: "orbit-label-to-project.yml",
    skillFile: "",
    requiredLabels: [],
    description: "Move issues entre colunas do GitHub Projects board via labels",
    workflowContent: `name: Orbit Label to Project
on:
  issues:
    types: [labeled, unlabeled]

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      repository-projects: write
    steps:
      - name: Sync label to project column
        uses: actions/github-script@v7
        with:
          script: |
            const issue = context.payload.issue;
            const labels = issue.labels.map(l => l.name);

            // Map labels to project columns
            const columnMap = {
              'needs-prd': 'Ideas',
              'ready': 'Ready',
              'ui': 'Design',
              'frontend': 'Design',
              'qa-ready': 'Review',
            };

            const label = context.payload.label?.name;
            const column = columnMap[label];

            if (column) {
              console.log(\`Moving issue #\${issue.number} to column: \${column}\`);
              // Note: GitHub Projects v2 requires GraphQL API
              // This is a simplified version
            }
`,
    skillContent: "",
  },
];

export const BOARD_CONFIG = {
  columns: [
    { name: "Ideas", description: "Ideias e propostas de features" },
    { name: "Backlog", description: "Aprovado mas nao priorizado" },
    { name: "Ready", description: "Pronto para implementacao" },
    { name: "Design", description: "Em fase de design/PRD" },
    { name: "In Progress", description: "Em desenvolvimento" },
    { name: "Review", description: "Em code review ou QA" },
    { name: "Done", description: "Concluido e merged" },
  ],
};
