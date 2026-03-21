import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // Create org
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: "OrbitMind Demo",
      slug: "orbitmind-demo",
      plan: "pro",
      settings: {},
    })
    .returning();

  console.log("Created org:", org!.name);

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const [admin] = await db
    .insert(schema.users)
    .values({
      orgId: org!.id,
      name: "Admin OrbitMind",
      email: "admin@orbitmind.com",
      passwordHash,
      role: "owner",
    })
    .returning();

  console.log("Created user:", admin!.email);

  // Create Marketing Agency squad
  const [squad] = await db
    .insert(schema.squads)
    .values({
      orgId: org!.id,
      name: "Agencia de Marketing Digital",
      code: "marketing-agency",
      description:
        "Squad completo de marketing digital que pesquisa mercado, define estrategia, cria conteudo, produz design visual, revisa qualidade e publica em redes sociais.",
      icon: "🚀",
      templateId: "marketing-agency",
      createdBy: admin!.id,
      config: {
        performanceMode: "alta-performance",
        budget: { monthlyTokens: 2_000_000, warningThreshold: 0.8, pauseThreshold: 1.0 },
        skills: ["web_search", "web_fetch", "image-generator", "social-publisher", "document-writer"],
      },
      status: "active",
    })
    .returning();

  console.log("Created squad:", squad!.name);

  // Create 7 agents
  const agentDefs = [
    { name: "Ana Insights", role: "Pesquisadora de mercado", icon: "🔍", modelTier: "fast" as const, runtimeType: "claude-code" as const },
    { name: "Sofia Strategy", role: "Estrategista", icon: "🧠", modelTier: "powerful" as const, runtimeType: "claude-code" as const },
    { name: "Carlos Copy", role: "Copywriter", icon: "✍️", modelTier: "powerful" as const, runtimeType: "claude-code" as const },
    { name: "Diana Design", role: "Designer", icon: "🎨", modelTier: "powerful" as const, runtimeType: "claude-code" as const },
    { name: "Samuel SEO", role: "Analista SEO", icon: "📊", modelTier: "fast" as const, runtimeType: "claude-code" as const },
    { name: "Vera Review", role: "Revisora de qualidade", icon: "✅", modelTier: "powerful" as const, runtimeType: "claude-code" as const },
    { name: "Paula Post", role: "Publicadora", icon: "📤", modelTier: "fast" as const, runtimeType: "claude-code" as const },
  ];

  const agents = await db
    .insert(schema.agents)
    .values(
      agentDefs.map((a) => ({
        squadId: squad!.id,
        name: a.name,
        role: a.role,
        icon: a.icon,
        modelTier: a.modelTier,
        runtimeType: a.runtimeType,
        monthlyBudgetTokens: 285_714,
        budgetUsedTokens: 0,
        status: "idle" as const,
        config: {},
      })),
    )
    .returning();

  console.log(`Created ${agents.length} agents`);

  // Create sample tasks
  const taskDefs = [
    { title: "Pesquisar tendencias de IA para Q2 2026", status: "done" as const, priority: "p1" as const, type: "research" as const, agentIdx: 0 },
    { title: "Definir estrategia de conteudo mensal", status: "in_progress" as const, priority: "p0" as const, type: "feature" as const, agentIdx: 1 },
    { title: "Escrever post LinkedIn sobre automacao", status: "in_progress" as const, priority: "p1" as const, type: "content" as const, agentIdx: 2 },
    { title: "Criar carrossel Instagram - 5 slides", status: "ready" as const, priority: "p2" as const, type: "content" as const, agentIdx: 3 },
    { title: "Otimizar SEO do blog post sobre IA", status: "backlog" as const, priority: "p2" as const, type: "review" as const, agentIdx: 4 },
    { title: "Revisar copy do email marketing", status: "in_review" as const, priority: "p1" as const, type: "review" as const, agentIdx: 5 },
    { title: "Publicar conteudo nas redes sociais", status: "backlog" as const, priority: "p3" as const, type: "feature" as const, agentIdx: 6 },
    { title: "Analisar metricas da campanha anterior", status: "done" as const, priority: "p2" as const, type: "research" as const, agentIdx: 0 },
    { title: "Criar brief para campanha de lancamento", status: "ready" as const, priority: "p0" as const, type: "content" as const, agentIdx: 1 },
    { title: "Escrever artigo blog sobre produtividade", status: "backlog" as const, priority: "p3" as const, type: "content" as const, agentIdx: 2 },
  ];

  await db.insert(schema.tasks).values(
    taskDefs.map((t) => ({
      squadId: squad!.id,
      assignedAgentId: agents[t.agentIdx]!.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      type: t.type,
      metadata: {},
    })),
  );

  console.log(`Created ${taskDefs.length} tasks`);

  // Create sample messages
  const messageDefs = [
    { role: "user" as const, content: "Ola equipe! Precisamos criar conteudo sobre IA para o proximo mes.", senderId: admin!.id, agentId: null },
    { role: "agent" as const, content: "Entendido! Vou comecar pesquisando as principais tendencias de IA para Q2 2026. Foco em automacao empresarial e agentes autonomos.", senderId: null, agentId: agents[0]!.id },
    { role: "agent" as const, content: "Com base na pesquisa da Ana, recomendo 3 pilares: (1) IA no dia a dia, (2) Squads autonomos, (3) ROI da automacao. Vamos criar um calendario editorial?", senderId: null, agentId: agents[1]!.id },
    { role: "user" as const, content: "Perfeito! Comecen pelo post do LinkedIn sobre automacao.", senderId: admin!.id, agentId: null },
    { role: "agent" as const, content: "Ja estou trabalhando no draft do post. Focando em dados concretos e storytelling. Envio o rascunho em breve!", senderId: null, agentId: agents[2]!.id },
    { role: "system" as const, content: "Pipeline iniciado: Marketing Campaign Q2", senderId: null, agentId: null },
    { role: "agent" as const, content: "Rascunho pronto! Titulo: '5 Maneiras que Agentes de IA Estao Transformando Marketing em 2026'. Revisem e aprovem para eu seguir para o design.", senderId: null, agentId: agents[2]!.id },
    { role: "agent" as const, content: "Vou verificar o SEO do rascunho. Keywords primarias: 'agentes IA', 'automacao marketing', 'squads IA'. Score inicial: 78/100.", senderId: null, agentId: agents[4]!.id },
    { role: "agent" as const, content: "Revisao completa! Copy esta excelente. Sugeri 3 ajustes menores no CTA. Aprovado para publicacao apos ajustes.", senderId: null, agentId: agents[5]!.id },
    { role: "system" as const, content: "Checkpoint: aprovacao necessaria para publicacao", senderId: null, agentId: null },
  ];

  await db.insert(schema.messages).values(
    messageDefs.map((m) => ({
      squadId: squad!.id,
      senderId: m.senderId,
      agentId: m.agentId,
      content: m.content,
      role: m.role,
      metadata: {},
    })),
  );

  console.log(`Created ${messageDefs.length} messages`);

  // Create sample executions
  const executionDefs = [
    { agentIdx: 0, status: "completed" as const, tokens: 12500, cost: 25, duration: 45000, step: "research" },
    { agentIdx: 1, status: "completed" as const, tokens: 8200, cost: 82, duration: 32000, step: "strategy" },
    { agentIdx: 2, status: "completed" as const, tokens: 15000, cost: 150, duration: 60000, step: "copywriting" },
    { agentIdx: 4, status: "completed" as const, tokens: 5600, cost: 11, duration: 18000, step: "seo-optimization" },
    { agentIdx: 5, status: "completed" as const, tokens: 7800, cost: 78, duration: 25000, step: "review" },
    { agentIdx: 2, status: "running" as const, tokens: 3200, cost: 32, duration: null, step: "copywriting-v2" },
  ];

  await db.insert(schema.executions).values(
    executionDefs.map((e) => ({
      squadId: squad!.id,
      agentId: agents[e.agentIdx]!.id,
      pipelineStep: e.step,
      status: e.status,
      tokensUsed: e.tokens,
      estimatedCost: e.cost,
      durationMs: e.duration,
      completedAt: e.status === "completed" ? new Date() : null,
    })),
  );

  console.log(`Created ${executionDefs.length} executions`);

  await client.end();
  console.log("Seed completed!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
