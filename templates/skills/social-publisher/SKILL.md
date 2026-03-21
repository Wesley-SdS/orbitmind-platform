---
name: "Social Publisher"
description: "Publica conteudo em redes sociais via API"
type: "script"
version: "1.0.0"
categories: [social-media, automation, publishing]

script:
  path: "scripts/publish.js"
  runtime: "node"
  invoke: "node --env-file=.env {skill_path}/scripts/publish.js --platform \"{platform}\" --content \"{content}\""
  dependencies: ["axios@latest"]

env:
  - INSTAGRAM_ACCESS_TOKEN
  - INSTAGRAM_USER_ID
  - LINKEDIN_ACCESS_TOKEN
  - TWITTER_API_KEY
  - TWITTER_API_SECRET
---

## When to use

Use Social Publisher para publicar conteudo aprovado em redes sociais. Suporta Instagram (Graph API), LinkedIn, e Twitter/X.

## Instructions

### Pre-Publicacao

1. Confirme que o conteudo foi APROVADO pelo reviewer
2. Verifique que todos os assets estao nos formatos corretos
3. Verifique hashtags e mentions
4. Confirme horario de publicacao

### Publicacao

1. Faça upload de imagens primeiro (se aplicavel)
2. Publique na plataforma principal
3. Aguarde confirmacao de sucesso
4. Registre URL do post publicado
5. Repita para plataformas secundarias

### Pos-Publicacao

- Registre todas as URLs no relatorio
- Capture screenshot ou preview
- Reporte status de cada publicacao (success/failed)
- Registre horario efetivo de publicacao
