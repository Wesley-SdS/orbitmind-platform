import {
  LayoutDashboard, MessageSquare, KanbanSquare, Bot, Users,
  GitBranch, ShoppingBag, Link2, Settings, Building2,
  ChevronDown, Terminal, Lightbulb, BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Dados de cada seção                                                */
/* ------------------------------------------------------------------ */

const sections = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    color: "text-blue-500",
    description: "Visão geral com métricas em tempo real da sua organização.",
    details: [
      "**Squads Ativos** — quantos squads estão com status ativo.",
      "**Tasks Completadas** — total de tasks concluídas no mês atual.",
      "**Execuções Hoje** — quantas vezes o pipeline rodou hoje.",
      "**Custo Estimado** — soma dos custos de tokens do mês.",
      "**Gráfico de Execuções** — barras dos últimos 7 dias (concluídas, falhas, canceladas).",
      "**Budget por Agente** — percentual de tokens usados por agente.",
      "**Squads Ativos** — lista rápida com status de cada squad.",
      "**Atividade Recente** — últimos eventos registrados (audit log).",
    ],
    prompts: [],
  },
  {
    id: "chat",
    icon: MessageSquare,
    title: "Chat com Agentes",
    color: "text-green-500",
    description: "Converse com seus squads e com o Arquiteto para criar, gerenciar e operar tudo por linguagem natural.",
    details: [
      "**Arquiteto** — assistente que cria squads, agentes, tasks e gerencia tudo.",
      "**Squads** — selecione um squad na sidebar esquerda para conversar com seus agentes.",
      "**Conversas** — histórico salvo no banco, persistente entre sessões.",
      "**Sugestões** — botões rápidos para ações comuns quando não há conversa ativa.",
    ],
    prompts: [
      { label: "Criar squad", example: "Crie um squad de marketing digital com 5 agentes" },
      { label: "Listar squads", example: "Listar meus squads" },
      { label: "Ver agentes", example: "Quais agentes eu tenho?" },
      { label: "Status", example: "Como está meu squad?" },
      { label: "Criar tasks", example: "Crie tasks para cada agente do squad" },
      { label: "Ver board", example: "O que tem no board?" },
      { label: "Mover task", example: 'Mover task "Pesquisar tendências" para done' },
      { label: "Deletar task", example: 'Deletar task "Pesquisar tendências"' },
      { label: "Editar squad", example: "Edite o squad de marketing, adicione um agente de SEO" },
      { label: "Mudar modelo", example: "Mudar modelo do agente Ana Insights para opus" },
      { label: "Mudar budget", example: "Aumentar budget do agente Carlos Copy para 100000 tokens" },
      { label: "Exportar config", example: "Exportar a config do squad" },
      { label: "Duplicar squad", example: "Duplicar o squad de marketing" },
      { label: "Pausar squad", example: "Pause o squad de marketing" },
      { label: "Ativar squad", example: "Ativar o squad de marketing" },
      { label: "Rodar pipeline", example: "Rodar o pipeline do squad" },
      { label: "Deletar squad", example: "Deletar o squad duplicado" },
      { label: "Pipeline — listar", example: "Mostre os agentes da esteira" },
      { label: "Pipeline — editar", example: "Edite o reviewer para ser mais rigoroso" },
      { label: "Pipeline — toggle", example: "Desabilite o reviewer" },
      { label: "Pipeline — trigger", example: "Rode o developer" },
      { label: "Pipeline — runs", example: "Mostre os runs do developer" },
      { label: "Pipeline — detalhe", example: "O que o reviewer faz?" },
      { label: "Pergunta livre", example: "Qual a melhor estratégia de conteúdo para Instagram em 2026?" },
    ],
  },
  {
    id: "board",
    icon: KanbanSquare,
    title: "Board Kanban",
    color: "text-yellow-500",
    description: "Organize tasks em colunas arrastando cards. Agentes movem tasks automaticamente.",
    details: [
      "**5 colunas** — Backlog, Ready, In Progress, In Review, Done.",
      "**Drag & Drop** — arraste um card para mudar o status (persiste no banco).",
      "**Nova Task** — botão no topo para criar tasks manualmente.",
      "**Detalhes** — clique num card para ver/editar título, descrição, prioridade e agente.",
      "**Filtro por squad** — mostra tasks do primeiro squad ativo automaticamente.",
    ],
    prompts: [],
  },
  {
    id: "squads",
    icon: Bot,
    title: "Squads",
    color: "text-purple-500",
    description: "Visualize e gerencie seus squads de agentes.",
    details: [
      "**Lista de squads** — todos os squads da organização com status e contagem de agentes.",
      "**Config do squad** — pipeline steps, skills habilitadas, budget total.",
      "**Criar squads** — use o Chat com o Arquiteto (é mais rápido que criar manualmente).",
    ],
    prompts: [],
  },
  {
    id: "agents",
    icon: Users,
    title: "Agentes",
    color: "text-orange-500",
    description: "Veja todos os agentes, ajuste modelo de IA e budget de tokens.",
    details: [
      "**Persona** — cada agente tem nome, ícone, papel e personalidade definida.",
      "**Modelo de IA** — escolha entre Claude, GPT ou Gemini por agente.",
      "**Budget** — limite de tokens por agente (previne gastos excessivos).",
      "**Status** — idle, working, done, checkpoint.",
    ],
    prompts: [],
  },
  {
    id: "pipeline",
    icon: GitBranch,
    title: "Pipeline",
    color: "text-cyan-500",
    description: "Gerencie a esteira de agentes conectada ao GitHub.",
    details: [
      "**Agentes da esteira** — workflows do GitHub importados como agentes (developer, reviewer, autofix, etc).",
      "**Toggle** — ative ou desative um workflow direto da UI.",
      "**Trigger** — dispare um workflow manualmente (equivale a workflow_dispatch).",
      "**Runs** — veja o histórico de execuções com status, duração e conclusão.",
      "**Requer integração GitHub** — configure em Integrações primeiro.",
    ],
    prompts: [],
  },
  {
    id: "marketplace",
    icon: ShoppingBag,
    title: "Marketplace",
    color: "text-pink-500",
    description: "Explore agentes e squads prontos para usar.",
    details: [
      "**Templates** — agentes e squads pré-configurados com personas e pipelines.",
      "**Adquirir** — adiciona o agente ou squad à sua organização com um clique.",
      "**Filtros** — por tipo (agente/squad) e categoria (marketing, dev, analytics, etc).",
      "**Instalações** — contador incrementa quando alguém adquire um template.",
    ],
    prompts: [],
  },
  {
    id: "integrations",
    icon: Link2,
    title: "Integrações",
    color: "text-emerald-500",
    description: "Conecte plataformas externas para seus agentes usarem.",
    details: [
      "**Premium (35)** — integrações curadas com config detalhada (GitHub, Discord, Slack, etc).",
      "**Genéricas (700+)** — via Nango, com OAuth automático.",
      "**Conectar** — abre o fluxo OAuth da plataforma.",
      "**Capabilities** — habilite permissões específicas (criar issues, enviar mensagens, etc).",
      "**Config** — campos personalizados por integração (repos, canais, webhooks).",
    ],
    prompts: [],
  },
  {
    id: "settings",
    icon: Settings,
    title: "Configurações",
    color: "text-gray-400",
    description: "Configure organização, membros, provedores de IA, skills e plano.",
    details: [
      "**Organização** — nome, slug, idioma.",
      "**Membros** — adicionar/remover usuários com roles (owner, admin, member, viewer).",
      "**Provedores de IA** — configure API keys do Claude, OpenAI ou Gemini. Teste a conexão antes de usar.",
      "**Skills** — configure Instagram, LinkedIn e outras plataformas de publicação.",
      "**Plano** — veja seu plano atual (Free, Pro, Enterprise).",
      "**Audit Log** — histórico de todas as ações na organização.",
    ],
    prompts: [],
  },
  {
    id: "office",
    icon: Building2,
    title: "Escritório Virtual",
    color: "text-indigo-500",
    description: "Visualize seus agentes trabalhando em tempo real num escritório 3D.",
    details: [
      "**Salas temáticas** — Research, Strategy, Content, Design, Review, Delivery.",
      "**Agentes posicionados** — cada agente fica na sala correspondente ao seu papel.",
      "**Status visual** — cores indicam se o agente está idle, working, done ou em checkpoint.",
      "**Handoff** — animação quando um agente passa trabalho para outro no pipeline.",
      "**Seletor de squad** — troque entre squads para ver diferentes equipes.",
    ],
    prompts: [],
  },
];

/* ------------------------------------------------------------------ */
/*  Componente de seção                                                */
/* ------------------------------------------------------------------ */

function HelpSection({ section }: { section: typeof sections[number] }) {
  const Icon = section.icon;
  return (
    <Card id={`help-${section.id}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${section.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Detalhes */}
        <div className="space-y-1.5">
          {section.details.map((d, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: d.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
              }}
            />
          ))}
        </div>

        {/* Prompts de exemplo */}
        {section.prompts.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Exemplos de prompts</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {section.prompts.map((p, i) => (
                <div key={i} className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
                  <p className="text-sm mt-0.5">&quot;{p.example}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Atalhos rápidos                                                    */
/* ------------------------------------------------------------------ */

const quickTips = [
  "Configure um **Provedor de IA** antes de usar o chat (Settings → Provedores de IA).",
  "O **Arquiteto** é o jeito mais rápido de criar squads — basta descrever o que precisa.",
  "Use **drag & drop** no Board para mover tasks entre colunas.",
  "Conecte o **GitHub** em Integrações para usar a esteira de Pipeline.",
  "No **Marketplace**, adquira templates prontos para começar mais rápido.",
  "O **Escritório Virtual** mostra o status real dos agentes quando um pipeline está rodando.",
];

/* ------------------------------------------------------------------ */
/*  Página                                                             */
/* ------------------------------------------------------------------ */

export default function HelpPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Central de Ajuda</h1>
        <p className="text-muted-foreground">
          Entenda como cada área do OrbitMind funciona e veja exemplos de uso.
        </p>
      </div>

      {/* Dicas rápidas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-base">Dicas rápidas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {quickTips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: `• ${tip.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')}`,
                }}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Navegação rápida */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.id}
              href={`#help-${s.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-sm hover:bg-accent/50 transition-colors"
            >
              <Icon className={`h-3.5 w-3.5 ${s.color}`} />
              {s.title}
            </a>
          );
        })}
      </div>

      {/* Seções detalhadas */}
      <div className="space-y-6">
        {sections.map((s) => (
          <HelpSection key={s.id} section={s} />
        ))}
      </div>

      {/* Rodapé */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Precisa de mais ajuda?</p>
              <p className="text-sm text-muted-foreground">
                Converse com o Arquiteto no Chat — ele entende linguagem natural e pode te guiar em qualquer operação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
