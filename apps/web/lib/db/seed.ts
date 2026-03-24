import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { encryptCredential } from "../crypto";

// Load .env manually since tsx doesn't load it
try {
  const envPath = resolve(import.meta.dirname ?? __dirname, "../../.env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env not found, rely on existing env vars
}

// Deterministic UUIDs for easy debugging
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000010";
const SQUAD_MARKETING_ID = "00000000-0000-0000-0000-000000000100";
const AGENT_IDS = [
  "00000000-0000-0000-0000-000000001001",
  "00000000-0000-0000-0000-000000001002",
  "00000000-0000-0000-0000-000000001003",
  "00000000-0000-0000-0000-000000001004",
  "00000000-0000-0000-0000-000000001005",
  "00000000-0000-0000-0000-000000001006",
  "00000000-0000-0000-0000-000000001007",
];

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log("Cleaning existing data...");

  // Delete in reverse FK order for idempotency
  await db.delete(schema.auditLogs);
  await db.delete(schema.messages);
  await db.delete(schema.executions);
  await db.delete(schema.tasks);
  await db.delete(schema.agents);
  if (schema.squadMemories) await db.delete(schema.squadMemories);
  if (schema.investigations) await db.delete(schema.investigations);
  if (schema.integrationWebhooks) await db.delete(schema.integrationWebhooks);
  await db.delete(schema.orgIntegrations);
  await db.delete(schema.orgSkills);
  await db.delete(schema.llmProviders);
  if (schema.marketplaceAcquisitions) await db.delete(schema.marketplaceAcquisitions);
  if (schema.marketplaceItems) await db.delete(schema.marketplaceItems);
  if (schema.schedules) await db.delete(schema.schedules);
  if (schema.apiTokens) await db.delete(schema.apiTokens);
  if (schema.contentAnalytics) await db.delete(schema.contentAnalytics);
  if (schema.pipelineLogs) await db.delete(schema.pipelineLogs);
  await db.delete(schema.squads);
  await db.delete(schema.sessions);
  await db.delete(schema.accounts);
  await db.delete(schema.verificationTokens);
  await db.delete(schema.users);
  await db.delete(schema.organizations);

  console.log("Seeding database...");

  // 1. Organization
  await db.insert(schema.organizations).values({
    id: DEMO_ORG_ID,
    name: "OrbitMind Demo",
    slug: "orbitmind-demo",
    plan: "pro",
    settings: {},
  });
  console.log("Created org: OrbitMind Demo");

  // 2. Admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await db.insert(schema.users).values({
    id: ADMIN_USER_ID,
    orgId: DEMO_ORG_ID,
    name: "Admin OrbitMind",
    email: "admin@orbitmind.com",
    passwordHash,
    role: "owner",
  });
  console.log("Created user: admin@orbitmind.com");

  // 2b. System Architect squad (for architect chat messages)
  const ARCHITECT_SQUAD_ID = "00000000-0000-0000-0000-a0c41ec70001";
  await db.insert(schema.squads).values({
    id: ARCHITECT_SQUAD_ID,
    orgId: DEMO_ORG_ID,
    name: "Arquiteto",
    code: "system-architect",
    description: "Canal do Arquiteto para criar e gerenciar squads",
    icon: "🧠",
    status: "active",
    createdBy: ADMIN_USER_ID,
    config: { isSystem: true },
  });
  console.log("Created system architect squad");

  // 3. Marketing Agency squad
  await db.insert(schema.squads).values({
    id: SQUAD_MARKETING_ID,
    orgId: DEMO_ORG_ID,
    name: "Agencia de Marketing Digital",
    code: "marketing-agency",
    description:
      "Squad completo de marketing digital que pesquisa mercado, define estrategia, cria conteudo, produz design visual, revisa qualidade e publica em redes sociais.",
    icon: "🚀",
    templateId: "marketing-agency",
    createdBy: ADMIN_USER_ID,
    config: {
      performanceMode: "alta-performance",
      budget: { monthlyTokens: 2_000_000, warningThreshold: 0.8, pauseThreshold: 1.0 },
      skills: ["web_search", "web_fetch", "image-generator", "social-publisher", "document-writer"],
    },
    status: "active",
  });
  console.log("Created squad: Agencia de Marketing Digital");

  // 4. Agents
  const agentDefs = [
    { id: AGENT_IDS[0]!, name: "Ana Insights", role: "Pesquisadora de mercado", icon: "🔍", modelTier: "fast" as const, budgetUsed: 45_000, config: { persona: "Especialista em pesquisa de mercado, tendencias e analise competitiva. Usa dados quantitativos e qualitativos para embasar decisoes." } },
    { id: AGENT_IDS[1]!, name: "Sofia Strategy", role: "Estrategista", icon: "🧠", modelTier: "powerful" as const, budgetUsed: 120_000, config: { persona: "Estrategista senior de marketing. Define pilares de conteudo, calendarios editoriais e KPIs. Visao macro do negocio." } },
    { id: AGENT_IDS[2]!, name: "Carlos Copy", role: "Copywriter", icon: "✍️", modelTier: "powerful" as const, budgetUsed: 180_000, config: { persona: "Copywriter criativo. Escreve posts, artigos, emails e legendas com storytelling envolvente. Tom profissional mas acessivel." } },
    { id: AGENT_IDS[3]!, name: "Diana Design", role: "Designer", icon: "🎨", modelTier: "powerful" as const, budgetUsed: 30_000, config: { persona: "Designer visual. Cria carrosseis, banners e materiais visuais para redes sociais e blog." } },
    { id: AGENT_IDS[4]!, name: "Samuel SEO", role: "Analista SEO", icon: "📊", modelTier: "fast" as const, budgetUsed: 15_000, config: { persona: "Especialista em SEO e analytics. Otimiza conteudo para buscadores, define keywords e monitora metricas." } },
    { id: AGENT_IDS[5]!, name: "Vera Review", role: "Revisora de qualidade", icon: "✅", modelTier: "powerful" as const, budgetUsed: 78_000, config: { persona: "Revisora rigorosa. Verifica qualidade, consistencia, tom de voz e aderencia a marca antes da publicacao." } },
    { id: AGENT_IDS[6]!, name: "Paula Post", role: "Publicadora", icon: "📤", modelTier: "fast" as const, budgetUsed: 8_000, config: { persona: "Publicadora e agendadora. Gerencia publicacao em redes sociais com horarios otimizados." } },
  ];

  await db.insert(schema.agents).values(
    agentDefs.map((a) => ({
      id: a.id,
      squadId: SQUAD_MARKETING_ID,
      name: a.name,
      role: a.role,
      icon: a.icon,
      modelTier: a.modelTier,
      runtimeType: "claude-code" as const,
      monthlyBudgetTokens: 285_714,
      budgetUsedTokens: a.budgetUsed,
      status: "idle" as const,
      config: a.config,
    })),
  );
  console.log(`Created ${agentDefs.length} agents`);

  // 5. Tasks (18 tasks, varied statuses)
  const taskDefs = [
    // Done (4)
    { title: "Pesquisar tendencias de IA para Q2 2026", status: "done" as const, priority: "p1" as const, type: "research" as const, agentIdx: 0, description: "Levantar as principais tendencias de inteligencia artificial para o segundo trimestre de 2026, com foco em automacao empresarial." },
    { title: "Analisar metricas da campanha anterior", status: "done" as const, priority: "p2" as const, type: "research" as const, agentIdx: 0, description: "Analisar resultados da campanha Q1, incluindo engajamento, conversao e ROI." },
    { title: "Definir tom de voz da marca", status: "done" as const, priority: "p1" as const, type: "content" as const, agentIdx: 1, description: "Criar guia de tom de voz para todas as comunicacoes da marca." },
    { title: "Configurar analytics do blog", status: "done" as const, priority: "p2" as const, type: "feature" as const, agentIdx: 4, description: "Implementar tracking de metricas no blog com Google Analytics 4." },
    // In Review (3)
    { title: "Revisar copy do email marketing", status: "in_review" as const, priority: "p1" as const, type: "review" as const, agentIdx: 5, description: "Revisar sequencia de 5 emails para campanha de nurturing." },
    { title: "Revisar artigo sobre produtividade", status: "in_review" as const, priority: "p2" as const, type: "review" as const, agentIdx: 5, description: "Revisao final do artigo sobre produtividade com IA antes da publicacao." },
    { title: "Revisar carrossel de onboarding", status: "in_review" as const, priority: "p2" as const, type: "review" as const, agentIdx: 5, description: "Verificar consistencia visual e textual do carrossel de 5 slides." },
    // In Progress (3)
    { title: "Definir estrategia de conteudo mensal", status: "in_progress" as const, priority: "p0" as const, type: "feature" as const, agentIdx: 1, description: "Criar calendario editorial completo para abril 2026 com temas, formatos e canais." },
    { title: "Escrever post LinkedIn sobre automacao", status: "in_progress" as const, priority: "p1" as const, type: "content" as const, agentIdx: 2, description: "Post longo no LinkedIn sobre como agentes de IA estao transformando marketing em 2026." },
    { title: "Criar design do ebook", status: "in_progress" as const, priority: "p1" as const, type: "content" as const, agentIdx: 3, description: "Design completo do ebook 'Guia de IA para Marketing' com 20 paginas." },
    // Ready (3)
    { title: "Criar carrossel Instagram - 5 slides", status: "ready" as const, priority: "p2" as const, type: "content" as const, agentIdx: 3, description: "Carrossel sobre '5 ferramentas de IA para marketeiros' para Instagram." },
    { title: "Criar brief para campanha de lancamento", status: "ready" as const, priority: "p0" as const, type: "content" as const, agentIdx: 1, description: "Brief detalhado para lancamento do OrbitMind no mercado." },
    { title: "Pesquisar hashtags trending", status: "ready" as const, priority: "p3" as const, type: "research" as const, agentIdx: 4, description: "Mapear hashtags em alta relacionadas a IA e marketing para usar nos posts." },
    // Backlog (5)
    { title: "Otimizar SEO do blog post sobre IA", status: "backlog" as const, priority: "p2" as const, type: "review" as const, agentIdx: 4, description: "Otimizar on-page SEO do artigo principal sobre IA para rankeamento organico." },
    { title: "Publicar conteudo nas redes sociais", status: "backlog" as const, priority: "p3" as const, type: "feature" as const, agentIdx: 6, description: "Agendar e publicar batch de conteudo aprovado em LinkedIn, Instagram e Twitter." },
    { title: "Escrever artigo blog sobre produtividade", status: "backlog" as const, priority: "p3" as const, type: "content" as const, agentIdx: 2, description: "Artigo de 1500 palavras sobre como squads de IA aumentam produtividade das equipes." },
    { title: "Criar template de newsletter", status: "backlog" as const, priority: "p3" as const, type: "content" as const, agentIdx: 3, description: "Design de template reutilizavel para newsletter semanal." },
    { title: "Mapear concorrentes diretos", status: "backlog" as const, priority: "p2" as const, type: "research" as const, agentIdx: 0, description: "Analise competitiva dos 5 principais concorrentes no espaco de agentes de IA." },
  ];

  await db.insert(schema.tasks).values(
    taskDefs.map((t) => ({
      squadId: SQUAD_MARKETING_ID,
      assignedAgentId: AGENT_IDS[t.agentIdx]!,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      type: t.type,
      metadata: {},
      completedAt: t.status === "done" ? new Date("2026-03-20T15:00:00Z") : null,
    })),
  );
  console.log(`Created ${taskDefs.length} tasks`);

  // 6. Messages (35 messages simulating real conversation)
  const msgTime = (minutes: number) => new Date(`2026-03-21T10:${String(minutes).padStart(2, "0")}:00Z`);

  const messageDefs = [
    { role: "user" as const, content: "Ola equipe! Precisamos criar conteudo sobre IA para o proximo mes. O foco principal deve ser automacao e agentes autonomos.", senderId: ADMIN_USER_ID, agentId: null, time: msgTime(0) },
    { role: "agent" as const, content: "Entendido! Vou comecar pesquisando as principais tendencias de IA para Q2 2026. Foco em automacao empresarial e agentes autonomos.\n\nJa identifiquei 3 fontes principais para analise:\n- Gartner Hype Cycle 2026\n- McKinsey AI Report\n- Stack Overflow Developer Survey", senderId: null, agentId: AGENT_IDS[0]!, time: msgTime(1) },
    { role: "agent" as const, content: "Com base na pesquisa da Ana, recomendo 3 pilares de conteudo:\n\n1. **IA no dia a dia** - casos praticos e tutoriais\n2. **Squads autonomos** - como montar e operar\n3. **ROI da automacao** - numeros reais e cases\n\nVamos criar um calendario editorial com esses pilares?", senderId: null, agentId: AGENT_IDS[1]!, time: msgTime(3) },
    { role: "user" as const, content: "Perfeito! Adoro os 3 pilares. Comecem pelo post do LinkedIn sobre automacao - e o mais urgente.", senderId: ADMIN_USER_ID, agentId: null, time: msgTime(4) },
    { role: "agent" as const, content: "Ja estou trabalhando no draft do post! Focando em:\n- Hook forte nos primeiros 3 linhas\n- Dados concretos e storytelling\n- 3 cases reais de automacao\n- CTA para demo do OrbitMind\n\nEnvio o rascunho em breve!", senderId: null, agentId: AGENT_IDS[2]!, time: msgTime(5) },
    { role: "system" as const, content: "Pipeline iniciado: Marketing Campaign Q2", senderId: null, agentId: null, time: msgTime(6) },
    { role: "agent" as const, content: "Enquanto o Carlos trabalha no post, vou preparar o calendario editorial de abril.\n\nJa tenho o esqueleto:\n- Semana 1: Post LinkedIn + Carrossel IG\n- Semana 2: Artigo blog + Newsletter\n- Semana 3: Ebook + Thread Twitter\n- Semana 4: Case study + Video script", senderId: null, agentId: AGENT_IDS[1]!, time: msgTime(8) },
    { role: "agent" as const, content: "Rascunho pronto! Titulo: **'5 Maneiras que Agentes de IA Estao Transformando Marketing em 2026'**\n\nDestaques:\n- Dados de mercado atualizados (crescimento de 340% em adocao)\n- 3 cases reais de empresas brasileiras\n- CTA para demo do OrbitMind\n- 1.200 palavras, tempo de leitura: 5 min\n\nEnviando para revisao do Samuel (SEO) e da Vera (qualidade).", senderId: null, agentId: AGENT_IDS[2]!, time: msgTime(12) },
    { role: "agent" as const, content: "Analisando o SEO do rascunho...\n\n**Keywords primarias:** agentes IA, automacao marketing, squads IA\n**Keywords secundarias:** produtividade, ROI, transformacao digital\n\n**Score inicial:** 78/100\n\nSugestoes de melhoria:\n- Adicionar keyword principal no H2\n- Incluir meta description otimizada\n- Melhorar densidade de keywords (atual: 1.2%, ideal: 1.5-2%)\n- Adicionar alt text nas imagens\n- Incluir links internos", senderId: null, agentId: AGENT_IDS[4]!, time: msgTime(15) },
    { role: "agent" as const, content: "Revisao completa! Analise detalhada:\n\n**Pontos fortes:**\n- Storytelling excelente\n- Dados bem referenciados\n- CTA claro e persuasivo\n\n**Ajustes sugeridos (3):**\n1. Trocar 'ferramentas' por 'agentes' no paragrafo 3 (consistencia)\n2. Encurtar o paragrafo sobre ROI (muito denso)\n3. Adicionar bullet points na secao de beneficios\n\n**Veredicto:** Aprovado para publicacao apos ajustes menores.", senderId: null, agentId: AGENT_IDS[5]!, time: msgTime(18) },
    { role: "system" as const, content: "Checkpoint: aprovacao necessaria para publicacao", senderId: null, agentId: null, time: msgTime(19) },
    { role: "user" as const, content: "Aprovado! Podem publicar. Otimo trabalho equipe!", senderId: ADMIN_USER_ID, agentId: null, time: msgTime(20) },
    { role: "agent" as const, content: "Aplicando os ajustes da Vera e otimizacoes do Samuel...\n\nScore SEO atualizado: **92/100**\n\nVersao final pronta! Enviando para a Paula publicar.", senderId: null, agentId: AGENT_IDS[2]!, time: msgTime(22) },
    { role: "agent" as const, content: "Recebido! Agendando publicacao:\n\n- **LinkedIn:** Hoje as 14h (horario de pico de engajamento)\n- **Twitter/X:** Hoje as 15h (thread com 5 tweets)\n- **Blog:** Publicando agora\n\nNotificacoes configuradas para monitorar engajamento nas primeiras 2 horas.", senderId: null, agentId: AGENT_IDS[6]!, time: msgTime(24) },
    { role: "system" as const, content: "Task completada: Escrever post LinkedIn sobre automacao", senderId: null, agentId: null, time: msgTime(25) },
    { role: "agent" as const, content: "Enquanto isso, comecei a pesquisa de concorrentes que estava no backlog. Primeiros insights:\n\n- **Competitor A:** Foca em chatbots, nao em squads\n- **Competitor B:** Sem pipeline CI/CD, tudo manual\n- **Competitor C:** Preco 3x maior, menos features\n\nRelatorio completo em 1 hora.", senderId: null, agentId: AGENT_IDS[0]!, time: msgTime(28) },
    { role: "agent" as const, content: "Comecando o design do carrossel de Instagram! 5 slides sobre ferramentas de IA para marketeiros.\n\nPaleta: tons de azul e roxo (cores da marca)\nEstilo: clean, minimalista, com icones\n\nPrevisao: 30 minutos.", senderId: null, agentId: AGENT_IDS[3]!, time: msgTime(30) },
    { role: "user" as const, content: "Excelente! Ana, quando tiver o relatorio de concorrentes, compartilhe com a Sofia para ajustar a estrategia.", senderId: ADMIN_USER_ID, agentId: null, time: msgTime(32) },
    { role: "agent" as const, content: "Com certeza! Ja vou alinhar com a Sofia assim que finalizar. Estou cruzando dados de:\n- Features e pricing\n- Market share estimado\n- Pontos fracos que podemos explorar\n- Gaps de conteudo que podemos preencher", senderId: null, agentId: AGENT_IDS[0]!, time: msgTime(33) },
    { role: "agent" as const, content: "Carrossel pronto! Preview dos 5 slides:\n\n1. Capa: '5 Ferramentas de IA que Todo Marketeiro Precisa'\n2. Pesquisa com IA (Ana Insights style)\n3. Copywriting automatizado (Carlos Copy style)\n4. SEO inteligente (Samuel SEO style)\n5. CTA: 'Monte seu squad de IA'\n\nEnviando para revisao.", senderId: null, agentId: AGENT_IDS[3]!, time: msgTime(38) },
    { role: "system" as const, content: "Pipeline step completado: Design Visual (Diana Design)", senderId: null, agentId: null, time: msgTime(39) },
  ];

  // Architect demo messages
  const architectSquadId = "00000000-0000-0000-0000-a0c41ec70001";
  const architectMsgs = [
    { role: "agent" as const, content: "**Ola! Sou o Arquiteto do OrbitMind.**\n\nVou te ajudar a montar um squad de agentes IA perfeito para o que voce precisa.\n\nMe conta: **o que voce gostaria que esse squad fizesse?**\n\nPode descrever em linguagem natural — por exemplo:\n- _\"Quero um squad que crie conteudo para Instagram e LinkedIn\"_\n- _\"Preciso de uma equipe para analisar dados de vendas\"_\n\nO que tem em mente?", senderId: null, metadata: { agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true } },
    { role: "user" as const, content: "Quero um squad que crie conteudo para Instagram e LinkedIn da minha agencia de marketing digital", senderId: ADMIN_USER_ID, metadata: {} },
    { role: "agent" as const, content: "Otimo! Uma agencia de marketing digital com foco em Instagram e LinkedIn.\n\nPara montar o squad ideal, preciso entender:\n\n**Qual e o publico-alvo principal?**\n\n1. Empresas B2B (LinkedIn focus)\n2. Marcas consumer / D2C (Instagram focus)\n3. Ambos igualmente\n4. Outro (descreva)", senderId: null, metadata: { agentName: "Arquiteto", agentIcon: "🧠", isArchitect: true } },
  ];

  await db.insert(schema.messages).values(
    architectMsgs.map((m, i) => ({
      squadId: architectSquadId,
      senderId: m.senderId,
      agentId: null,
      content: m.content,
      role: m.role,
      metadata: m.metadata,
      createdAt: new Date(`2026-03-21T09:${String(50 + i).padStart(2, "0")}:00Z`),
    })),
  );
  console.log(`Created ${architectMsgs.length} architect messages`);

  await db.insert(schema.messages).values(
    messageDefs.map((m) => ({
      squadId: SQUAD_MARKETING_ID,
      senderId: m.senderId,
      agentId: m.agentId,
      content: m.content,
      role: m.role,
      metadata: {},
      createdAt: m.time,
    })),
  );
  console.log(`Created ${messageDefs.length} messages`);

  // 7. Executions (10 varied)
  const executionDefs = [
    { agentIdx: 0, status: "completed" as const, tokens: 12500, cost: 25, duration: 45000, step: "research" },
    { agentIdx: 1, status: "completed" as const, tokens: 8200, cost: 82, duration: 32000, step: "strategy" },
    { agentIdx: 2, status: "completed" as const, tokens: 15000, cost: 150, duration: 60000, step: "copywriting" },
    { agentIdx: 4, status: "completed" as const, tokens: 5600, cost: 11, duration: 18000, step: "seo-optimization" },
    { agentIdx: 5, status: "completed" as const, tokens: 7800, cost: 78, duration: 25000, step: "review" },
    { agentIdx: 2, status: "completed" as const, tokens: 4200, cost: 42, duration: 15000, step: "copywriting-v2" },
    { agentIdx: 6, status: "completed" as const, tokens: 2100, cost: 4, duration: 8000, step: "publishing" },
    { agentIdx: 3, status: "completed" as const, tokens: 9800, cost: 98, duration: 35000, step: "design" },
    { agentIdx: 0, status: "running" as const, tokens: 3200, cost: 6, duration: null, step: "competitor-research" },
    { agentIdx: 3, status: "running" as const, tokens: 1800, cost: 18, duration: null, step: "carousel-design" },
  ];

  await db.insert(schema.executions).values(
    executionDefs.map((e, i) => ({
      squadId: SQUAD_MARKETING_ID,
      agentId: AGENT_IDS[e.agentIdx]!,
      pipelineStep: e.step,
      status: e.status,
      tokensUsed: e.tokens,
      estimatedCost: e.cost,
      durationMs: e.duration,
      startedAt: new Date(`2026-03-21T10:${String(i * 3).padStart(2, "0")}:00Z`),
      completedAt: e.status === "completed" ? new Date(`2026-03-21T10:${String(i * 3 + 2).padStart(2, "0")}:00Z`) : null,
    })),
  );
  console.log(`Created ${executionDefs.length} executions`);

  // 8. LLM Provider demo
  await db.insert(schema.llmProviders).values({
    id: "00000000-0000-0000-0000-000000000020",
    orgId: DEMO_ORG_ID,
    provider: "anthropic",
    authMethod: "api_key",
    encryptedCredential: encryptCredential("demo-token-placeholder"),
    label: "Claude (Demo)",
    defaultModel: "claude-sonnet-4-6",
    isActive: true,
    isDefault: true,
  });
  console.log("Created 1 LLM provider");

  // 9. Audit logs (15 entries)
  const auditDefs = [
    { action: "org.created", actorType: "system" as const, actorId: "system", metadata: { orgName: "OrbitMind Demo" } },
    { action: "user.created", actorType: "system" as const, actorId: "system", metadata: { email: "admin@orbitmind.com" } },
    { action: "squad.created", actorType: "user" as const, actorId: ADMIN_USER_ID, metadata: { squadName: "Agencia de Marketing Digital" } },
    { action: "agent.started", actorType: "agent" as const, actorId: AGENT_IDS[0]!, metadata: { step: "research" } },
    { action: "agent.started", actorType: "agent" as const, actorId: AGENT_IDS[1]!, metadata: { step: "strategy" } },
    { action: "task.completed", actorType: "agent" as const, actorId: AGENT_IDS[0]!, metadata: { taskTitle: "Pesquisar tendencias de IA" } },
    { action: "agent.started", actorType: "agent" as const, actorId: AGENT_IDS[2]!, metadata: { step: "copywriting" } },
    { action: "pipeline.checkpoint", actorType: "system" as const, actorId: "system", metadata: { step: "Aprovacao publicacao" } },
    { action: "checkpoint.approved", actorType: "user" as const, actorId: ADMIN_USER_ID, metadata: { step: "Aprovacao publicacao" } },
    { action: "task.completed", actorType: "agent" as const, actorId: AGENT_IDS[2]!, metadata: { taskTitle: "Post LinkedIn sobre automacao" } },
    { action: "agent.started", actorType: "agent" as const, actorId: AGENT_IDS[6]!, metadata: { step: "publishing" } },
    { action: "task.completed", actorType: "agent" as const, actorId: AGENT_IDS[6]!, metadata: { taskTitle: "Publicar conteudo" } },
    { action: "budget.warning", actorType: "system" as const, actorId: "system", metadata: { agentName: "Carlos Copy", percentage: 63 } },
    { action: "agent.started", actorType: "agent" as const, actorId: AGENT_IDS[3]!, metadata: { step: "carousel-design" } },
    { action: "integration.connected", actorType: "user" as const, actorId: ADMIN_USER_ID, metadata: { type: "github" } },
  ];

  await db.insert(schema.auditLogs).values(
    auditDefs.map((a, i) => ({
      orgId: DEMO_ORG_ID,
      squadId: SQUAD_MARKETING_ID,
      action: a.action,
      actorType: a.actorType,
      actorId: a.actorId,
      metadata: a.metadata,
      createdAt: new Date(Date.now() - (auditDefs.length - i) * 5 * 60 * 1000),
    })),
  );
  console.log(`Created ${auditDefs.length} audit logs`);

  // 9. Integrations (Nango-based)
  await db.insert(schema.orgIntegrations).values([
    {
      orgId: DEMO_ORG_ID,
      integrationId: "github",
      tier: "premium" as const,
      config: { repos: ["orbitmind-platform", "orbitmind-docs", "orbitmind-templates"], webhookUrl: "/api/webhooks/github" },
      enabledCapabilities: ["create-issue", "create-pr", "code-review", "webhooks", "sync-issues", "workflows"],
      status: "active" as const,
      lastSyncAt: new Date(),
      connectedAt: new Date(),
    },
    {
      orgId: DEMO_ORG_ID,
      integrationId: "discord",
      tier: "premium" as const,
      config: { channels: ["squad-marketing", "notifications"], webhookUrl: "/api/webhooks/discord" },
      enabledCapabilities: ["send-message", "send-embed", "notifications"],
      status: "active" as const,
      lastSyncAt: new Date(),
      connectedAt: new Date(),
    },
    {
      orgId: DEMO_ORG_ID,
      integrationId: "slack",
      tier: "premium" as const,
      config: { channel: "#orbitmind-updates" },
      enabledCapabilities: ["send-message", "pipeline-updates"],
      status: "active" as const,
      connectedAt: new Date(),
    },
  ]);
  console.log("Created 3 integrations");

  // 11. Marketplace items
  if (schema.marketplaceItems) {
    await db.insert(schema.marketplaceItems).values([
      // Agents
      { type: "agent" as const, category: "analytics" as const, name: "Sherlock Analytics", icon: "🔍", description: "Analisa perfis de redes sociais e extrai padroes de conteudo de alto engajamento", tags: ["analytics", "social", "patterns"], agentConfig: { role: "Content Pattern Analyst", modelTier: "powerful", persona: { role: "Analista de padroes", identity: "Investigador de conteudo digital", communicationStyle: "Objetivo e data-driven" } } },
      { type: "agent" as const, category: "marketing" as const, name: "Elena Email", icon: "📧", description: "Especialista em email marketing, newsletters e sequencias de nurturing", tags: ["email", "marketing", "nurturing"], agentConfig: { role: "Email Marketing Specialist", modelTier: "powerful" } },
      { type: "agent" as const, category: "content" as const, name: "Pedro Podcast", icon: "🎙️", description: "Transforma conteudo escrito em scripts de podcast com storytelling envolvente", tags: ["podcast", "storytelling", "script"], agentConfig: { role: "Podcast Script Writer", modelTier: "powerful" } },
      { type: "agent" as const, category: "design" as const, name: "Lucia Landing", icon: "🎯", description: "Cria copy e estrutura para landing pages de alta conversao", tags: ["landing-page", "conversion", "copy"], agentConfig: { role: "Landing Page Specialist", modelTier: "powerful" } },
      { type: "agent" as const, category: "marketing" as const, name: "Marcos Media", icon: "📊", description: "Gerencia planejamento de midia paga — Meta Ads, Google Ads, performance", tags: ["ads", "media", "performance"], agentConfig: { role: "Paid Media Manager", modelTier: "powerful" } },
      { type: "agent" as const, category: "analytics" as const, name: "Rodrigo Report", icon: "📈", description: "Gera relatorios executivos com metricas e insights acionaveis", tags: ["reports", "metrics", "executive"], agentConfig: { role: "Report & Analytics", modelTier: "fast" } },
      { type: "agent" as const, category: "support" as const, name: "Camila Chatbot", icon: "🤖", description: "Configura fluxos de chatbot e respostas automaticas para atendimento", tags: ["chatbot", "automation", "support"], agentConfig: { role: "Chatbot Flow Designer", modelTier: "fast" } },
      { type: "agent" as const, category: "sales" as const, name: "Felipe Funnel", icon: "🔁", description: "Especialista em funil de vendas e automacao de CRM", tags: ["sales", "funnel", "crm"], agentConfig: { role: "Sales Funnel Specialist", modelTier: "powerful" } },
      { type: "agent" as const, category: "design" as const, name: "Bruna Brand", icon: "🎨", description: "Define identidade visual, guia de marca e tom de comunicacao", tags: ["branding", "identity", "design"], agentConfig: { role: "Brand Identity Designer", modelTier: "powerful" } },
      { type: "agent" as const, category: "content" as const, name: "Tomas Thread", icon: "🧵", description: "Especialista em threads para Twitter/X e LinkedIn que viralizam", tags: ["thread", "twitter", "linkedin", "viral"], agentConfig: { role: "Thread Writer", modelTier: "powerful" } },
      // Squads
      { type: "squad" as const, category: "marketing" as const, name: "Instagram Carousel Factory", icon: "📸", description: "Pipeline completo de criacao e publicacao de carrosseis Instagram: pesquisa, angulos, copy, design, publicacao", tags: ["instagram", "carousel", "marketing"], squadConfig: { agents: [{ name: "Angela Angulo", role: "Pesquisadora", icon: "🔍", modelTier: "fast" }, { name: "Carlos Carrossel", role: "Copywriter", icon: "✍️", modelTier: "powerful" }, { name: "Davi Design", role: "Designer", icon: "🎨", modelTier: "powerful" }, { name: "Vera Veredito", role: "Revisora", icon: "✅", modelTier: "powerful" }, { name: "Paula Post", role: "Publicadora", icon: "📤", modelTier: "fast" }], pipeline: [{ step: 1, name: "Pesquisa", type: "agent" }, { step: 2, name: "Angulos", type: "agent" }, { step: 3, name: "Copy", type: "agent" }, { step: 4, name: "Design", type: "agent" }, { step: 5, name: "Review", type: "agent" }, { step: 6, name: "Publicacao", type: "agent" }], skills: ["web_search", "image-creator", "instagram-publisher"] } },
      { type: "squad" as const, category: "content" as const, name: "YouTube Content Machine", icon: "🎬", description: "Pipeline completo para criacao de conteudo YouTube: pesquisa, roteiro, thumbnail, SEO de video", tags: ["youtube", "video", "content"], squadConfig: { agents: [{ name: "Renato Research", role: "Pesquisador de tendencias", icon: "🔍", modelTier: "fast" }, { name: "Sara Script", role: "Roteirista", icon: "✍️", modelTier: "powerful" }, { name: "Thiago Thumb", role: "Designer de thumbnails", icon: "🎨", modelTier: "powerful" }, { name: "Oscar Otimizador", role: "SEO de video", icon: "📊", modelTier: "fast" }], pipeline: [{ step: 1, name: "Pesquisa", type: "agent" }, { step: 2, name: "Roteiro", type: "agent" }, { step: 3, name: "Thumbnail", type: "agent" }, { step: 4, name: "SEO", type: "agent" }], skills: ["web_search"] } },
      { type: "squad" as const, category: "marketing" as const, name: "Email Marketing Automation", icon: "📧", description: "Squad de email marketing: segmentacao, copy, design de template, A/B test e envio", tags: ["email", "marketing", "automation"], squadConfig: { agents: [{ name: "Selena Segmento", role: "Segmentacao e publico", icon: "🎯", modelTier: "fast" }, { name: "Clara Copy", role: "Copywriter de email", icon: "✍️", modelTier: "powerful" }, { name: "Daniela Design", role: "Designer de template", icon: "🎨", modelTier: "powerful" }, { name: "Rita Review", role: "Revisora de qualidade", icon: "✅", modelTier: "powerful" }], pipeline: [{ step: 1, name: "Segmentacao", type: "agent" }, { step: 2, name: "Copy", type: "agent" }, { step: 3, name: "Design", type: "agent" }, { step: 4, name: "Review", type: "agent" }], skills: ["web_search"] } },
      { type: "squad" as const, category: "content" as const, name: "LinkedIn Thought Leader", icon: "💼", description: "Squad para posicionamento no LinkedIn: pesquisa de tendencias, artigos, posts e otimizacao", tags: ["linkedin", "thought-leadership", "b2b"], squadConfig: { agents: [{ name: "Patricia Pesquisa", role: "Pesquisadora de tendencias", icon: "🔍", modelTier: "fast" }, { name: "Lucas LinkedIn", role: "Redator LinkedIn", icon: "✍️", modelTier: "powerful" }, { name: "Veronica Valida", role: "Revisora", icon: "✅", modelTier: "powerful" }], pipeline: [{ step: 1, name: "Pesquisa", type: "agent" }, { step: 2, name: "Redacao", type: "agent" }, { step: 3, name: "Review", type: "agent" }], skills: ["web_search", "linkedin-publisher"] } },
      { type: "squad" as const, category: "support" as const, name: "Customer Support Team", icon: "🎧", description: "Squad de suporte ao cliente: triagem, resposta, escalacao e analise de feedback", tags: ["support", "customer-service", "helpdesk"], squadConfig: { agents: [{ name: "Tiago Triagem", role: "Triagem e classificacao", icon: "📋", modelTier: "fast" }, { name: "Rita Resposta", role: "Atendimento", icon: "💬", modelTier: "powerful" }, { name: "Eduardo Escalacao", role: "Casos complexos", icon: "🔺", modelTier: "powerful" }, { name: "Ana Analise", role: "Analista de satisfacao", icon: "📊", modelTier: "fast" }], pipeline: [{ step: 1, name: "Triagem", type: "agent" }, { step: 2, name: "Resposta", type: "agent" }, { step: 3, name: "Escalacao", type: "agent" }, { step: 4, name: "Analise", type: "agent" }], skills: ["web_search"] } },
      { type: "squad" as const, category: "development" as const, name: "Dev Pipeline — Esteira Autonoma", icon: "🚀", description: "Pipeline CI/CD autonomo com 6 agentes: ideacao, arquitetura, implementacao, review, fix e documentacao. Replica a esteira Adalink com 41+ PRs merged. Requer GitHub conectado.", tags: ["dev", "ci-cd", "pipeline", "github", "autonomous"], squadConfig: { agents: [{ name: "Igor Ideator", role: "Ideacao e refinamento", icon: "💡", modelTier: "powerful" }, { name: "Arthur Architect", role: "Arquiteto de solucao", icon: "🏗️", modelTier: "powerful" }, { name: "Ivan Implementor", role: "Desenvolvedor", icon: "⚡", modelTier: "powerful" }, { name: "Rafael Reviewer", role: "Code reviewer", icon: "🔍", modelTier: "powerful" }, { name: "Felix Fixer", role: "Bug fixer", icon: "🔧", modelTier: "fast" }, { name: "Diana Docs", role: "Documentacao", icon: "📝", modelTier: "fast" }], pipeline: [{ step: 1, name: "Ideacao", type: "agent" }, { step: 2, name: "Arquitetura", type: "agent" }, { step: 3, name: "Implementacao", type: "agent" }, { step: 4, name: "Review", type: "agent" }, { step: 5, name: "Fix", type: "agent" }, { step: 6, name: "Documentacao", type: "agent" }], skills: ["web_search"], requiredIntegrations: ["github"] } },
    ]);
    console.log("Created 16 marketplace items");
  }

  await client.end();
  console.log("Seed completed!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
