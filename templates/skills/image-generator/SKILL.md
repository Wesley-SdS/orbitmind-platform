---
name: "Image Generator"
description: "Gera imagens a partir de HTML/CSS ou prompts de IA"
type: "hybrid"
version: "1.0.0"
categories: [design, automation, images]

mcp:
  server_name: "playwright"
  command: "npx"
  args: ["@playwright/mcp@latest"]
  transport: "stdio"

script:
  path: "scripts/render.js"
  runtime: "node"
  invoke: "node {skill_path}/scripts/render.js --input \"{input}\" --output \"{output}\""
  dependencies: ["playwright@latest"]

env: []
---

## When to use

Use Image Generator quando precisar criar assets visuais: slides de carrossel, banners, thumbnails, infograficos. Suporta HTML/CSS renderizado via Playwright.

## Instructions

### Workflow HTML/CSS

1. **Gere HTML** — Escreva HTML/CSS completo e autocontido
2. **Salve o arquivo** — Grave o HTML no diretorio de output do squad
3. **Inicie servidor** — `python -m http.server 8765 --directory "OUTPUT_DIR" &`
4. **Renderize** — Use Playwright para capturar screenshot
5. **Verifique** — Leia a imagem gerada para confirmar qualidade
6. **Pare servidor** — Encerre o servidor HTTP

### Dimensoes por Plataforma

| Plataforma | Formato | Dimensao |
|-----------|---------|----------|
| Instagram Feed | 1:1 | 1080x1080 |
| Instagram Stories | 9:16 | 1080x1920 |
| LinkedIn Post | 1.91:1 | 1200x627 |
| Twitter/X | 16:9 | 1600x900 |

### Regras de Design

- Fontes: max 2 familias por peca
- Cores: paleta da marca (brand guide)
- Contraste: minimo WCAG AA (4.5:1 para texto)
- Margem segura: 5% em todas as bordas
