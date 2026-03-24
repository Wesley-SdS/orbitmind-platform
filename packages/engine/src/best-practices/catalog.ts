/**
 * Best Practices Catalog
 *
 * Comprehensive knowledge library for agent behavior.
 * Each best-practice file contains principles, frameworks,
 * quality criteria, examples, and anti-patterns.
 *
 * Based on: opensquad-ref/_opensquad/core/best-practices/_catalog.yaml
 */

export interface BestPractice {
  id: string;
  name: string;
  category: "discipline" | "platform";
  whenToUse: string;
  version: string;
  content: string;
}

export const BEST_PRACTICES_CATALOG: BestPractice[] = [
  // ─── Disciplines ───
  {
    id: "copywriting", name: "Copywriting", category: "discipline", version: "1.0.0",
    whenToUse: "Squads que criam textos persuasivos, posts, emails, anuncios",
    content: `## Principios
1. Hook primeiro — capture atencao nos primeiros 3 segundos
2. Diagnostique o nivel de consciencia do leitor (inconsciente, consciente do problema, consciente da solucao, consciente do produto, mais consciente)
3. Use a estrutura AIDA: Atencao, Interesse, Desejo, Acao
4. Escreva como fala — tom conversacional, frases curtas
5. Um CTA por peca — nunca divida a atencao
6. Dados concretos > adjetivos vagos ("aumentou 340%" > "cresceu muito")

## Frameworks
- **PAS:** Problema → Agitacao → Solucao
- **BAB:** Before → After → Bridge
- **4U:** Urgente, Unico, Ultra-especifico, Util
- **Storytelling:** Heroi (leitor) → Conflito → Solucao → Transformacao

## Anti-Patterns
- NUNCA use cliches ("nesse sentido", "dessa forma", "confira")
- NUNCA comece com "Voce sabia que..."
- NUNCA use mais de 3 emojis por paragrafo
- SEMPRE termine com CTA especifico e conectado ao conteudo
- SEMPRE use dados verificaveis com fonte`,
  },
  {
    id: "researching", name: "Pesquisa", category: "discipline", version: "1.0.0",
    whenToUse: "Squads com agentes de pesquisa de mercado, tendencias, concorrencia",
    content: `## Principios
1. Multiplas fontes — nunca confie em uma unica fonte
2. Priorize dados primarios sobre opiniao
3. Date os dados — informacao sem data e invalida
4. Triangule: 3 fontes independentes para cada claim
5. Separe fatos de interpretacoes
6. Documente a cadeia de evidencias

## Frameworks
- **CRAAP Test:** Currency, Relevance, Authority, Accuracy, Purpose
- **Research Brief:** Objetivo → Perguntas → Fontes → Achados → Recomendacoes
- **Competitive Analysis:** Features, Pricing, Market Share, Gaps, Oportunidades

## Anti-Patterns
- NUNCA invente dados ou estatisticas
- NUNCA cite "estudos mostram" sem referenciar o estudo
- NUNCA use dados com mais de 2 anos sem contextualizar
- SEMPRE inclua URL/referencia de cada dado`,
  },
  {
    id: "review", name: "Revisao de Qualidade", category: "discipline", version: "1.0.0",
    whenToUse: "Agentes revisores, QA, quality gate",
    content: `## Principios
1. Scroll-stop test (peso 1.5x) — o conteudo para o scroll?
2. Consistencia de marca e tom de voz
3. Clareza — leitor entende na primeira leitura?
4. Precisao factual — todos os dados sao verificaveis?
5. CTA claro e conectado ao conteudo
6. Sem erros gramaticais ou de formatacao

## Framework de Avaliacao
Score 0-100 com pesos:
- Scroll-stop: 20pts (1.5x)
- Clareza: 15pts
- Dados/Fontes: 15pts
- Tom de voz: 10pts
- CTA: 10pts
- Gramatica: 10pts
- Design/Visual: 10pts
- Engajamento: 10pts

## Veto Conditions (rejeicao automatica)
- Score < 60
- Dados sem fonte
- CTA ausente ou generico
- Erro factual detectado`,
  },
  {
    id: "image-design", name: "Design de Imagem", category: "discipline", version: "1.0.0",
    whenToUse: "Agentes de design visual, criacao de imagens, carrosseis",
    content: `## Principios
1. Hierarquia visual clara — olho segue: titulo → subtitulo → corpo → CTA
2. Contraste alto entre texto e fundo
3. Paleta limitada: max 3 cores + neutros
4. Tipografia legivel: min 24px para titulos mobile, 16px para corpo
5. Espacamento generoso — respire entre elementos
6. Consistencia visual entre slides/pecas da mesma campanha

## Regras para Carrosseis
- 7-9 slides (hook + 5-7 conteudo + CTA)
- Primeiro slide: bold, visual, para o scroll
- Cada slide: 1 ideia, max 40 palavras
- Ultimo slide: CTA especifico
- Penultimo slide: reflexao/insight

## Anti-Patterns
- NUNCA use mais de 2 fontes tipograficas
- NUNCA coloque texto sobre imagem sem overlay de contraste
- NUNCA use gradientes excessivos
- SEMPRE mantenha safe zone para crop mobile`,
  },
  {
    id: "strategist", name: "Estrategia", category: "discipline", version: "1.0.0",
    whenToUse: "Agentes estrategistas, planejadores, diretores de campanha",
    content: `## Principios
1. Objetivo SMART: Especifico, Mensuravel, Atingivel, Relevante, Temporal
2. Audiencia > Canal — entenda quem antes de onde
3. Pilares de conteudo: max 5 temas centrais
4. Calendario editorial: consistencia > volume
5. Metricas de acompanhamento definidas antes de executar
6. Revisao semanal de performance

## Frameworks
- **SOSTAC:** Situation, Objectives, Strategy, Tactics, Action, Control
- **Content Pillars:** 3-5 temas que se repetem em rotacao
- **Funnel Mapping:** Topo (awareness) → Meio (consideracao) → Fundo (conversao)

## Anti-Patterns
- NUNCA comece produzindo sem estrategia documentada
- NUNCA ignore metricas da campanha anterior
- NUNCA copie concorrente sem entender o contexto`,
  },
  {
    id: "social-publishing", name: "Publicacao em Redes Sociais", category: "discipline", version: "1.0.0",
    whenToUse: "Agentes publicadores, social media managers",
    content: `## Principios
1. Horarios de pico por plataforma (testar e ajustar)
2. Hashtags: pesquisar antes, max 30 IG, 3-5 LinkedIn, 2-3 Twitter
3. Alt text em todas as imagens (acessibilidade + SEO)
4. Formato nativo — cada plataforma tem seu formato ideal
5. Monitorar engajamento nas primeiras 2 horas
6. Responder comentarios em ate 1 hora

## Checklist Pre-Publicacao
- [ ] Texto revisado (sem typos)
- [ ] Imagens no tamanho correto da plataforma
- [ ] Links funcionando e com UTM
- [ ] Hashtags pesquisadas e relevantes
- [ ] Horario ideal para a plataforma
- [ ] CTA claro`,
  },
  {
    id: "technical-writing", name: "Escrita Tecnica", category: "discipline", version: "1.0.0",
    whenToUse: "Artigos longos, documentacao, tutoriais, guias",
    content: `## Principios
1. Estrutura clara: Introducao → Desenvolvimento → Conclusao
2. Headings hierarquicos (H1 > H2 > H3)
3. Paragrafos curtos: max 4 linhas
4. Bullet points para listas
5. Code blocks para exemplos tecnicos
6. Imagens/diagramas para conceitos complexos

## Anti-Patterns
- NUNCA escreva paragrafos com mais de 5 linhas
- NUNCA use jargao sem explicar na primeira ocorrencia
- SEMPRE inclua TL;DR no inicio de artigos longos`,
  },
  {
    id: "data-analysis", name: "Analise de Dados", category: "discipline", version: "1.0.0",
    whenToUse: "Agentes de analytics, metricas, relatorios de performance",
    content: `## Principios
1. Contextualize numeros — "12% de aumento" comparado a que periodo?
2. Mostre tendencia, nao ponto isolado
3. Benchmarks do setor para comparacao
4. Visualizacao > tabela > texto para dados quantitativos
5. Insight acionavel > dado descritivo
6. Correlacao != causacao — cuidado com conclusoes

## Framework de Relatorio
1. Executive Summary (3 bullets)
2. KPIs principais com variacao
3. Analise por canal/campanha
4. Insights e recomendacoes
5. Proximos passos`,
  },

  // ─── Platforms ───
  {
    id: "instagram-feed", name: "Instagram Feed", category: "platform", version: "1.0.0",
    whenToUse: "Posts e carrosseis no feed do Instagram",
    content: `## Regras da Plataforma
- Imagem: 1080x1080 (quadrado) ou 1080x1350 (4:5, recomendado)
- Carrossel: 2-10 slides, formato consistente
- Caption: max 2200 chars, primeiras 2 linhas sao criticas (before "mais...")
- Hashtags: 20-30, mix de volume alto/medio/baixo
- Alt text obrigatorio para acessibilidade

## Estrutura de Carrossel
1. **Capa:** Hook visual forte, titulo bold, para o scroll
2. **Slides 2-7:** 1 ideia por slide, texto grande, imagem de suporte
3. **Penultimo:** Reflexao ou insight surpreendente
4. **Ultimo:** CTA especifico ("Salve para consultar depois", "Compartilhe com quem precisa")

## Algoritmo
- Engajamento rapido (primeiros 30min) > engajamento total
- Saves e shares pesam mais que likes
- Carrosseis tem alcance 1.4x maior que imagem unica
- Consistencia de postagem > volume`,
  },
  {
    id: "instagram-reels", name: "Instagram Reels", category: "platform", version: "1.0.0",
    whenToUse: "Videos curtos no Instagram Reels",
    content: `## Regras
- Duracao: 15-90s (ideal 30-60s)
- Formato: 9:16 (1080x1920)
- Primeiros 3s: hook visual ou textual
- Audio: trending sounds aumentam alcance
- Legendas/subtitulos obrigatorios (80% assiste sem som)

## Estrutura
1. Hook (0-3s): pergunta, dado chocante ou visual impactante
2. Conteudo (3-50s): entrega rapida, cortes dinamicos
3. CTA (ultimos 5s): seguir, comentar, compartilhar`,
  },
  {
    id: "instagram-stories", name: "Instagram Stories", category: "platform", version: "1.0.0",
    whenToUse: "Stories do Instagram (24h)",
    content: `## Regras
- Formato: 9:16 (1080x1920)
- Duracao: ate 60s por story
- Sequencia: max 5-7 stories por narrativa
- Stickers interativos: enquete, quiz, perguntas aumentam engajamento
- Link sticker para trafego`,
  },
  {
    id: "linkedin-post", name: "LinkedIn Post", category: "platform", version: "1.0.0",
    whenToUse: "Posts no feed do LinkedIn",
    content: `## Regras
- Texto: max 3000 chars, primeiras 2 linhas sao criticas (before "ver mais")
- Imagem: 1200x627 (landscape) ou 1080x1080 (quadrado)
- Carrossel: PDF upload, max 300 slides (ideal 8-12)
- Hashtags: 3-5, relevantes ao setor
- Sem links no corpo (algoritmo penaliza) — colocar no primeiro comentario

## Estrutura
1. Hook forte na primeira linha (pergunta, dado, historia)
2. Espacamento entre linhas (facilita leitura mobile)
3. Lista com emojis de bullet (→, ✅, 💡)
4. CTA no final: "Concorda? Comenta abaixo"
5. Hashtags separadas do texto principal

## Algoritmo
- Comentarios > reactions > shares
- Posts com imagem/documento tem 2x mais alcance
- Primeiros 60min sao criticos
- Engajamento do autor nos comentarios aumenta distribuicao`,
  },
  {
    id: "linkedin-article", name: "LinkedIn Article", category: "platform", version: "1.0.0",
    whenToUse: "Artigos longos no LinkedIn",
    content: `## Regras
- Titulo: max 100 chars, SEO-friendly
- Cover image: 1920x1080
- Extensao: 1000-3000 palavras
- Headings H2/H3 para estrutura
- Bullet points e listas numeradas
- Imagens a cada 300-500 palavras`,
  },
  {
    id: "twitter-post", name: "Twitter/X Post", category: "platform", version: "1.0.0",
    whenToUse: "Tweets unicos no Twitter/X",
    content: `## Regras
- Max 280 chars (ideal 100-200 para retweets com comentario)
- Imagem: 1200x675 (16:9)
- Max 4 imagens por tweet
- Hashtags: 1-2 no maximo
- Horarios de pico: 8-10h e 17-19h

## Formatos que funcionam
- Hot take + dado
- Thread teaser: "7 coisas que aprendi sobre X (thread 🧵)"
- Pergunta direta
- Meme + insight profissional`,
  },
  {
    id: "twitter-thread", name: "Twitter/X Thread", category: "platform", version: "1.0.0",
    whenToUse: "Threads no Twitter/X (multiplos tweets conectados)",
    content: `## Regras
- Primeiro tweet: hook + promessa do que vem ("🧵 Thread:")
- 5-15 tweets (ideal 7-10)
- 1 ideia por tweet
- Numerar: "1/", "2/", etc.
- Ultimo tweet: resumo + CTA + retweet do primeiro
- Imagem no primeiro e ultimo tweet`,
  },
  {
    id: "youtube-script", name: "YouTube Script", category: "platform", version: "1.0.0",
    whenToUse: "Roteiros para videos do YouTube",
    content: `## Estrutura
1. **Hook (0-30s):** Promessa do video, por que assistir ate o final
2. **Intro (30s-1min):** Contexto rapido, credibilidade
3. **Conteudo (1-8min):** Blocos de 2-3min com transicoes
4. **CTA mid-roll:** "Se inscrevam" no meio, nao no inicio
5. **Conclusao (30s):** Recap + CTA final + proximo video

## Retencao
- Pattern interrupt a cada 2min (mudanca visual, pergunta, B-roll)
- Timestamp chapters na descricao
- Thumbnail = 60% do sucesso do video`,
  },
  {
    id: "youtube-shorts", name: "YouTube Shorts", category: "platform", version: "1.0.0",
    whenToUse: "Videos curtos no YouTube Shorts",
    content: `## Regras
- Max 60s (ideal 30-45s)
- Formato: 9:16 (1080x1920)
- Hook nos primeiros 2s
- Loop: final conecta com inicio (aumenta watch time)
- Texto na tela: palavras-chave em momentos importantes`,
  },
  {
    id: "email-newsletter", name: "Email Newsletter", category: "platform", version: "1.0.0",
    whenToUse: "Newsletters periodicas por email",
    content: `## Regras
- Subject line: max 50 chars, curiosidade ou beneficio
- Preview text: complementa o subject (max 90 chars)
- Extensao: 500-1000 palavras
- 1 CTA principal (botao), max 2 secundarios (links)
- Mobile-first: 600px largura max

## Estrutura
1. Saudacao pessoal (nome)
2. Hook: historia, dado ou pergunta
3. Conteudo: 3-5 blocos curtos
4. CTA principal (botao grande)
5. PS: urgencia ou bonus`,
  },
  {
    id: "email-sales", name: "Email de Vendas", category: "platform", version: "1.0.0",
    whenToUse: "Emails de venda, lancamento, promocao",
    content: `## Regras
- Subject line: urgencia + beneficio
- Sequencia: 5-7 emails ao longo de 7-14 dias
- Cada email: 1 angulo diferente (historia, prova social, escassez, FAQ, ultimo aviso)
- CTA unico e repetido 2-3x no corpo

## Estrutura PAS
1. **Problema:** Descreva a dor do leitor
2. **Agitacao:** Amplifique as consequencias
3. **Solucao:** Apresente o produto como ponte`,
  },
  {
    id: "blog-post", name: "Blog Post", category: "platform", version: "1.0.0",
    whenToUse: "Artigos para blog corporativo ou pessoal",
    content: `## Regras
- Titulo: max 60 chars, keyword principal no inicio
- Meta description: 155 chars
- Extensao: 1500-3000 palavras (long-form)
- Headings: H1 (titulo), H2 (secoes), H3 (subsecoes)
- Imagens: 1 a cada 300 palavras, com alt text
- Internal links: 3-5 para outros posts
- External links: 2-3 para fontes autoritativas`,
  },
  {
    id: "blog-seo", name: "Blog SEO", category: "platform", version: "1.0.0",
    whenToUse: "Otimizacao SEO de artigos de blog",
    content: `## Checklist SEO On-Page
- [ ] Keyword principal no titulo (H1)
- [ ] Keyword no primeiro paragrafo
- [ ] Keyword em pelo menos 1 H2
- [ ] Densidade: 1.5-2% (nao keyword stuffing)
- [ ] Meta title: max 60 chars com keyword
- [ ] Meta description: 155 chars com keyword e CTA
- [ ] URL slug: curto, com keyword, sem stop words
- [ ] Alt text em todas imagens com keyword variante
- [ ] Schema markup (article, FAQ, howto)
- [ ] Internal links: 3-5 relevantes
- [ ] External links: 2-3 autoritativos`,
  },
  {
    id: "whatsapp-broadcast", name: "WhatsApp Broadcast", category: "platform", version: "1.0.0",
    whenToUse: "Mensagens em massa via WhatsApp Business",
    content: `## Regras
- Max 1024 chars por mensagem
- Personalizacao com nome ({{1}})
- Imagem ou video em anexo (opcional)
- CTA com botao (max 3 botoes)
- Frequencia: max 2-3 broadcasts por semana
- Horario: 9-11h ou 14-16h (evitar noite)

## Anti-Patterns
- NUNCA envie sem opt-in explicito
- NUNCA envie mais de 1 broadcast por dia
- NUNCA use linguagem generica — personalize`,
  },
];

export function getBestPracticeById(id: string): BestPractice | undefined {
  return BEST_PRACTICES_CATALOG.find((bp) => bp.id === id);
}

export function getBestPracticesByCategory(category: "discipline" | "platform"): BestPractice[] {
  return BEST_PRACTICES_CATALOG.filter((bp) => bp.category === category);
}

export function getBestPracticesForSquad(skills: string[], purpose: string): BestPractice[] {
  const relevant: BestPractice[] = [];
  const lower = purpose.toLowerCase();

  // Always include copywriting and review for content squads
  if (lower.includes("conteudo") || lower.includes("marketing") || lower.includes("content")) {
    relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => ["copywriting", "review", "strategist"].includes(bp.id)));
  }

  // Platform-specific based on purpose
  if (lower.includes("instagram")) relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id.startsWith("instagram")));
  if (lower.includes("linkedin")) relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id.startsWith("linkedin")));
  if (lower.includes("twitter") || lower.includes("x ")) relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id.startsWith("twitter")));
  if (lower.includes("youtube")) relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id.startsWith("youtube")));
  if (lower.includes("email")) relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id.startsWith("email")));
  if (lower.includes("blog") || lower.includes("seo")) relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id.startsWith("blog")));
  if (lower.includes("whatsapp")) relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id === "whatsapp-broadcast"));

  // Skills-based
  if (skills.includes("image-creator") || skills.includes("image-generator")) {
    relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id === "image-design"));
  }
  if (skills.includes("web_search")) {
    relevant.push(...BEST_PRACTICES_CATALOG.filter((bp) => bp.id === "researching"));
  }

  // Deduplicate
  return [...new Map(relevant.map((bp) => [bp.id, bp])).values()];
}
