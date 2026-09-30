import type { QuoteRequestInput } from "@orbitmind/shared";

export const NAV_LINKS = [
  { href: "#solucoes", label: "Soluções" },
  { href: "#cases", label: "Cases" },
  { href: "#plataforma", label: "Plataforma" },
  { href: "#servicos", label: "Serviços" },
  { href: "#processo", label: "Como trabalhamos" },
] as const;

export const STACK = [
  "Next.js",
  "NestJS",
  "React",
  "Flutter",
  "Expo",
  "TypeScript",
  "PostgreSQL",
  "Prisma",
  "Redis",
  "Kubernetes",
  "WhatsApp",
  "Stripe",
  "Mercado Pago",
  "OpenAI",
  "Anthropic",
  "Gemini",
] as const;

// ── Hero orbit: o ecossistema de soluções ───────

export interface OrbitNodeData {
  mono: string;
  label: string;
  angle: number;
  /** Cor do monograma (marca do produto). */
  color: string;
  active?: boolean;
}

export interface OrbitRing {
  /** Raio em px no sistema de referência de 600px. */
  radius: number;
  duration: number;
  reverse: boolean;
  dashed?: boolean;
  nodes: OrbitNodeData[];
}

export const ORBIT_SIZE = 600;

export const ORBIT_RINGS: OrbitRing[] = [
  {
    radius: 280,
    duration: 90,
    reverse: false,
    nodes: [
      { mono: "OF", label: "OrbitFinance", angle: 60, color: "#2e8b57" },
      { mono: "RB", label: "Rubrica", angle: 155, color: "#0f8f6c" },
      { mono: "ÓR", label: "Órbita", angle: 250, color: "#214e3e" },
    ],
  },
  {
    radius: 200,
    duration: 60,
    reverse: true,
    dashed: true,
    nodes: [
      { mono: "NB", label: "NexBot", angle: 100, color: "#2f6fd6" },
      { mono: "OM", label: "OrbitMind Platform", angle: 220, color: "#b53f14", active: true },
      { mono: "NC", label: "NexConnect", angle: 340, color: "#1a1a17" },
    ],
  },
  {
    radius: 128,
    duration: 40,
    reverse: false,
    nodes: [
      { mono: "IN", label: "InfluencerAI", angle: 30, color: "#0e9cb0" },
      { mono: "HT", label: "Healthtech", angle: 210, color: "#5e5c55" },
    ],
  },
];

// ── Portfólio ───────────────────────────────────

export type ProductStatus = "Beta" | "MVP" | "Pré-lançamento" | "Em desenvolvimento" | "Labs";

export interface Product {
  mono: string;
  name: string;
  color: string;
  status: ProductStatus;
  kind: string;
  pitch: string;
  features: string[];
  stack: string;
}

export const PRODUCTS: Product[] = [
  {
    mono: "NB",
    name: "NexBot",
    color: "#2f6fd6",
    status: "Pré-lançamento",
    kind: "SaaS · Omnichannel",
    pitch: "Chatbots com IA generativa em todos os canais de atendimento.",
    features: [
      "WhatsApp, Instagram, Telegram, Teams e web",
      "Construtor visual de fluxos + handoff humano",
      "White-label com portal de revenda",
    ],
    stack: "Next.js · NestJS · PostgreSQL · Redis",
  },
  {
    mono: "NC",
    name: "NexConnect",
    color: "#1a1a17",
    status: "Pré-lançamento",
    kind: "API · SDK",
    pitch: "API de mensageria WhatsApp e multicanal para desenvolvedores.",
    features: [
      "Webhooks assinados com retry e replay",
      "Broadcasts com teste A/B e agendamento",
      "Saúde e aquecimento de números",
    ],
    stack: "NestJS · Fastify · BullMQ · Kubernetes",
  },
  {
    mono: "RB",
    name: "Rubrica",
    color: "#0f8f6c",
    status: "Em desenvolvimento",
    kind: "SaaS · WhatsApp em equipe",
    pitch: "Toda conversa com dono, data e prova: atendimento em equipe no WhatsApp com IA.",
    features: [
      "Caixa compartilhada com fila, atribuição e papéis",
      "Copiloto de IA com busca semântica e OCR",
      "Exportação com hash verificável e trilha de auditoria",
    ],
    stack: "NestJS · Next.js · pgvector · BullMQ",
  },
  {
    mono: "IN",
    name: "InfluencerAI",
    color: "#0e9cb0",
    status: "Beta",
    kind: "SaaS · IA generativa",
    pitch: "Crie influenciadores virtuais, gere imagens e vídeos e publique nas redes.",
    features: [
      "Personas com rosto consistente",
      "Imagem, vídeo, lip sync e voz clonada",
      "Publicação em Instagram, TikTok e YouTube",
    ],
    stack: "Next.js · Replicate · ElevenLabs · Stripe",
  },
  {
    mono: "OF",
    name: "OrbitFinance",
    color: "#2e8b57",
    status: "MVP",
    kind: "SaaS · WhatsApp",
    pitch: "Finanças pessoais com IA — registre gastos mandando mensagem no WhatsApp.",
    features: [
      "Assistente que registra gastos por texto",
      "Insights, previsão e score financeiro",
      "Importação de extrato em PDF",
    ],
    stack: "Next.js · Prisma · Gemini · BullMQ",
  },
  {
    mono: "ÓR",
    name: "Órbita",
    color: "#214e3e",
    status: "Labs",
    kind: "Web · Mobile · Voz",
    pitch: "Assistente pessoal de IA local-first, por voz, que age com a sua aprovação.",
    features: [
      "Wake word, fala e transcrição de reuniões",
      "Memória e busca nos seus documentos",
      "WhatsApp, Telegram e casa conectada",
    ],
    stack: "Next.js · Expo · FastAPI · Ollama",
  },
];

export const FLAGSHIP_FEATURES = [
  "Pipeline autônomo",
  "Escritório virtual",
  "700+ integrações",
  "Marketplace de squads",
] as const;

// ── Case (anônimo) ──────────────────────────────

export const CASE_WEB_FEATURES = [
  "Escalas mensais e vagas de plantão",
  "Check-in, folha e relatórios",
  "Chat em tempo real + WhatsApp",
  "5 perfis de acesso, 3 idiomas",
] as const;

export const CASE_APP_FEATURES = [
  "Vagas no mapa, com filtros",
  "Candidatura em um toque",
  "Check-in validado por GPS",
  "Notificações e agenda do celular",
] as const;

export const CASE_WEB_STACK = ["NestJS", "Next.js", "PostgreSQL", "Socket.IO"] as const;
export const CASE_APP_STACK = ["Flutter", "Supabase", "Firebase", "Google Maps"] as const;

/** Grade ilustrativa da escala: D = dia, N = noite, "" = livre. */
export const CASE_WEEK = [
  "D", "D", "", "D", "N", "D", "",
  "N", "", "N", "D", "", "N", "N",
  "D", "N", "D", "", "D", "", "N",
] as const;
export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

export const CASE_SHIFTS = [
  { title: "Clínica médica", time: "Noturno · 19h–07h", distance: "2,4 km", highlight: true },
  { title: "UTI adulto", time: "Diurno · 07h–19h", distance: "5,1 km", highlight: false },
  { title: "Pronto-socorro", time: "Plantão 12h", distance: "8,0 km", highlight: false },
] as const;

// ── Demo interativa (OrbitMind Platform) ────────

export type AgentStatus = "done" | "active" | "queued";

export interface DemoAgent {
  initials: string;
  name: string;
  role: string;
  status: AgentStatus;
}

export interface DemoMessage {
  initials: string;
  name: string;
  text: string;
}

export interface DemoCase {
  id: string;
  label: string;
  prompt: string;
  squad: string;
  meta: string;
  steps: string[];
  /** Índice da etapa em execução. */
  current: number;
  /** Índice do checkpoint humano. */
  gate: number;
  agents: DemoAgent[];
  messages: DemoMessage[];
}

export const DEMO_CASES: [DemoCase, ...DemoCase[]] = [
  {
    id: "marketing",
    label: "Agência de marketing",
    prompt: "Crie uma agência de marketing digital completa para a minha startup de IA.",
    squad: "Agência de Marketing Digital",
    meta: "7 agentes · 10 etapas",
    steps: ["Pesquisa", "Estratégia", "Copy", "Design", "Aprovação", "Publicação"],
    current: 2,
    gate: 4,
    agents: [
      { initials: "AI", name: "Ana Insights", role: "Pesquisa", status: "done" },
      { initials: "SS", name: "Sofia Strategy", role: "Estratégia", status: "done" },
      { initials: "CC", name: "Carlos Copy", role: "Copywriting", status: "active" },
      { initials: "DD", name: "Diana Design", role: "Design", status: "queued" },
      { initials: "SE", name: "Samuel SEO", role: "SEO", status: "queued" },
      { initials: "VR", name: "Vera Review", role: "Revisão", status: "queued" },
      { initials: "PP", name: "Paula Post", role: "Publicação", status: "queued" },
    ],
    messages: [
      {
        initials: "AI",
        name: "Ana Insights",
        text: "Pesquisa pronta: agentes autônomos, automação de workflows e IA generativa lideram o seu nicho.",
      },
      {
        initials: "SS",
        name: "Sofia Strategy",
        text: "Defini três pilares de conteúdo e o calendário do mês. Briefing enviado ao Carlos.",
      },
      {
        initials: "CC",
        name: "Carlos Copy",
        text: "Escrevendo o primeiro post para o LinkedIn. Envio para revisão em 15 minutos.",
      },
    ],
  },
  {
    id: "dev",
    label: "Time de desenvolvimento",
    prompt: "Monte uma esteira que transforma issues do GitHub em PRs revisados.",
    squad: "Dev Pipeline — Esteira Autônoma",
    meta: "6 agentes · 8 etapas",
    steps: ["Issue", "Código", "Testes", "Review", "Aprovação", "Merge"],
    current: 2,
    gate: 4,
    agents: [
      { initials: "TR", name: "Triagem", role: "Issues", status: "done" },
      { initials: "DV", name: "Dev", role: "Implementação", status: "done" },
      { initials: "QA", name: "QA", role: "Testes", status: "active" },
      { initials: "RV", name: "Reviewer", role: "Code review", status: "queued" },
      { initials: "RL", name: "Release", role: "Auto-merge", status: "queued" },
      { initials: "DC", name: "Docs", role: "Documentação", status: "queued" },
    ],
    messages: [
      {
        initials: "TR",
        name: "Triagem",
        text: "Issue classificada como bug de alta prioridade. Contexto enviado ao Dev.",
      },
      {
        initials: "DV",
        name: "Dev",
        text: "Correção implementada em fix/websocket-reconnect. PR aberto.",
      },
      {
        initials: "QA",
        name: "QA",
        text: "Rodando a suíte de testes com dois cenários novos cobrindo o timeout.",
      },
    ],
  },
  {
    id: "carousel",
    label: "Carrosséis no Instagram",
    prompt: "Quero 3 carrosséis por semana no Instagram sobre produtividade.",
    squad: "Instagram Carousel Factory",
    meta: "5 agentes · 13 etapas",
    steps: ["Pesquisa", "Ângulos", "Copy", "Design", "Aprovação", "Publicação"],
    current: 1,
    gate: 4,
    agents: [
      { initials: "AI", name: "Ana Insights", role: "Pesquisa", status: "done" },
      { initials: "SS", name: "Sofia Strategy", role: "Ângulos", status: "active" },
      { initials: "CC", name: "Carlos Copy", role: "Copywriting", status: "queued" },
      { initials: "DD", name: "Diana Design", role: "Design", status: "queued" },
      { initials: "PP", name: "Paula Post", role: "Publicação", status: "queued" },
    ],
    messages: [
      {
        initials: "AI",
        name: "Ana Insights",
        text: "Mapeei os carrosséis com mais salvamentos do nicho neste mês.",
      },
      {
        initials: "SS",
        name: "Sofia Strategy",
        text: "Cinco ângulos prontos: medo, oportunidade, educacional, contrário e inspiracional. Qual seguimos?",
      },
    ],
  },
];

export const PLATFORM_HIGHLIGHTS = [
  "Pipeline com checkpoints humanos",
  "Escritório virtual em tempo real",
  "700+ integrações",
  "Anthropic, OpenAI e Google",
] as const;

// ── Serviços ────────────────────────────────────

export const CONTINUOUS_ITEMS = [
  "Squad sob medida: dev, design, QA e produto",
  "Sprints com demo e relatório de entregas",
  "Roadmap e prioridades definidos com você",
  "Agentes de IA acelerando o desenvolvimento",
] as const;

export const PROJECT_ITEMS = [
  "Discovery e proposta detalhada",
  "Entregas por marcos, validadas com você",
  "Código-fonte e documentação entregues",
  "Acompanhamento na ida para produção",
] as const;

export const CAPABILITIES = [
  {
    title: "Plataformas web & SaaS",
    description: "Multi-tenant, com billing, papéis e painéis.",
    proof: "ex.: NexBot, InfluencerAI",
  },
  {
    title: "Apps iOS e Android",
    description: "Apps nativos e multiplataforma, com mapas e push.",
    proof: "ex.: app de plantões",
  },
  {
    title: "Agentes de IA & automação",
    description: "Agentes que executam processos com aprovação humana.",
    proof: "ex.: OrbitMind Platform",
  },
  {
    title: "WhatsApp & chatbots",
    description: "Atendimento, campanhas e bots em vários canais.",
    proof: "ex.: NexBot, NexConnect, Rubrica",
  },
  {
    title: "Integrações & APIs",
    description: "APIs, webhooks e SDKs para conectar sistemas.",
    proof: "ex.: NexConnect",
  },
  {
    title: "Pagamentos & fintech",
    description: "Stripe, Mercado Pago, Pix e finanças com IA.",
    proof: "ex.: OrbitFinance",
  },
] as const;

// ── Processo e números ──────────────────────────

export const PROCESS_STEPS = [
  {
    number: "01",
    title: "Conversa",
    description: "Entendemos o negócio, o problema e onde a tecnologia gera resultado.",
  },
  {
    number: "02",
    title: "Proposta",
    description: "Escopo, prazo e investimento claros — ou o formato do time contínuo.",
  },
  {
    number: "03",
    title: "Construção",
    description: "Sprints curtas com demo. Você acompanha cada entrega de perto.",
  },
  {
    number: "04",
    title: "Entrega & evolução",
    description: "Colocamos em produção e seguimos evoluindo com você.",
  },
] as const;

export const STATS = [
  { value: 41, suffix: "+", label: "PRs merged pelo pipeline autônomo em produção" },
  { value: 7, suffix: "", label: "produtos próprios construídos do zero" },
  { value: 700, suffix: "+", label: "integrações disponíveis via plataforma" },
] as const;

// ── Orçamento ───────────────────────────────────

export type QuoteEngagement = QuoteRequestInput["engagement"];
export type QuoteSolutionType = QuoteRequestInput["solutionTypes"][number];
export type QuoteTimeline = QuoteRequestInput["timeline"];
export type QuoteBudget = QuoteRequestInput["budget"];

export const QUOTE_EVENT = "om:quote-engagement";

export const ENGAGEMENT_OPTIONS: { value: QuoteEngagement; title: string; description: string }[] = [
  {
    value: "continuous",
    title: "Desenvolvimento contínuo",
    description: "Um time dedicado evoluindo o seu produto todo mês.",
  },
  {
    value: "project",
    title: "Projeto específico",
    description: "Escopo, prazo e investimento fechados.",
  },
  {
    value: "consulting",
    title: "Consultoria & discovery",
    description: "Diagnóstico, arquitetura e estratégia de IA.",
  },
];

export const SOLUTION_OPTIONS: { value: QuoteSolutionType; label: string }[] = [
  { value: "web_platform", label: "Plataforma web / SaaS" },
  { value: "mobile_app", label: "App mobile" },
  { value: "ai_agents", label: "Agentes de IA & automação" },
  { value: "whatsapp_bots", label: "WhatsApp & chatbots" },
  { value: "integrations", label: "Integrações & APIs" },
  { value: "legacy_evolution", label: "Evoluir um sistema existente" },
  { value: "other", label: "Outro" },
];

export const TIMELINE_OPTIONS: { value: QuoteTimeline; label: string }[] = [
  { value: "asap", label: "O quanto antes" },
  { value: "1_3_months", label: "1 a 3 meses" },
  { value: "3_6_months", label: "3 a 6 meses" },
  { value: "flexible", label: "Sem pressa" },
];

// Faixas editáveis: projeto fechado vs. time contínuo (mensal).
export const PROJECT_BUDGET_OPTIONS: { value: QuoteBudget; label: string }[] = [
  { value: "up_to_20k", label: "Até R$ 20 mil" },
  { value: "20k_50k", label: "R$ 20–50 mil" },
  { value: "50k_150k", label: "R$ 50–150 mil" },
  { value: "over_150k", label: "Acima de R$ 150 mil" },
  { value: "undecided", label: "Ainda não sei" },
];

export const MONTHLY_BUDGET_OPTIONS: { value: QuoteBudget; label: string }[] = [
  { value: "monthly_up_to_15k", label: "Até R$ 15 mil/mês" },
  { value: "monthly_15k_40k", label: "R$ 15–40 mil/mês" },
  { value: "monthly_over_40k", label: "Acima de R$ 40 mil/mês" },
  { value: "undecided", label: "Ainda não sei" },
];

export const QUOTE_NEXT_STEPS = [
  { title: "Você envia o pedido", description: "Formato, escopo, prazo e investimento." },
  { title: "Marcamos uma conversa", description: "Para entender o contexto e tirar dúvidas." },
  { title: "Você recebe a proposta", description: "Escopo, prazo e investimento por escrito." },
] as const;
