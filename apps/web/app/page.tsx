"use client";

import Link from "next/link";
import {
  Orbit,
  MessageSquare,
  KanbanSquare,
  Bot,
  Zap,
  ArrowRight,
  CheckCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Bot,
    title: "Squads de Agentes IA",
    description:
      "Monte equipes autônomas com agentes especializados. Cada agente tem persona, skills e budget próprios.",
  },
  {
    icon: MessageSquare,
    title: "Chat em Tempo Real",
    description:
      "Converse com seus squads via chat. Envie comandos, receba updates e acompanhe o trabalho dos agentes.",
  },
  {
    icon: KanbanSquare,
    title: "Board Kanban",
    description:
      "Visualize tasks no kanban. Arraste entre colunas, atribua agentes e acompanhe o progresso.",
  },
  {
    icon: Zap,
    title: "Pipeline Autônomo",
    description:
      "Pipeline CI/CD validado com checkpoints de aprovação humana. Do research à publicação, 100% automatizado.",
  },
];

const CASE_STATS = [
  { value: "41+", label: "PRs merged autonomamente" },
  { value: "7", label: "agentes especializados" },
  { value: "10", label: "steps no pipeline" },
  { value: "100%", label: "autônomo, zero terminal" },
];

const DEMO_MESSAGES = [
  {
    from: "user",
    text: "Crie uma agência de marketing digital completa para a minha startup de IA",
  },
  {
    from: "system",
    text: "Criando squad \"Agência de Marketing Digital\" com 7 agentes especializados...",
  },
  {
    from: "agent",
    name: "Sofia Strategy",
    icon: "🧠",
    text: "Olá! Sou a Sofia, estrategista do squad. Já estou analisando o posicionamento da sua startup. Vou definir os pilares de conteúdo e alinhar com o time.",
  },
  {
    from: "agent",
    name: "Ana Insights",
    icon: "🔍",
    text: "Pesquisa concluída! Identifiquei 3 tendências quentes no seu nicho: agentes autônomos, automação de workflows e IA generativa para empresas. Enviando briefing para a Sofia.",
  },
  {
    from: "agent",
    name: "Carlos Copy",
    icon: "✍️",
    text: "Recebi o briefing! Já estou escrevendo o primeiro post para LinkedIn: \"5 maneiras que agentes de IA estão transformando marketing em 2026\". Previsão: 15 minutos.",
  },
  {
    from: "system",
    text: "Pipeline em andamento: 3/10 steps completos. Próximo: checkpoint de aprovação.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Orbit className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">OrbitMind</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Começar grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 text-center lg:py-32">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                Pipeline CI/CD autônomo validado com 41+ PRs merged
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Squads de IA que{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  trabalham para você
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Monte, configure e opere equipes autônomas de agentes IA.
                Do chat à entrega: agências de marketing, times de dev, suporte ao cliente.
                Tudo pelo browser, zero terminal.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Começar grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border/50 bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {CASE_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Tudo que você precisa para operar squads de IA</h2>
            <p className="mt-3 text-muted-foreground">
              Interface completa para orquestrar agentes autônomos
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo: Criando um Squad */}
        <section className="border-y border-border/50 bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Veja na prática
              </Badge>
              <h2 className="text-3xl font-bold">
                Crie um squad completo em uma mensagem
              </h2>
              <p className="mt-3 text-muted-foreground">
                Descreva o que você precisa no chat e o OrbitMind monta a equipe,
                define o pipeline e começa a trabalhar automaticamente.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-2xl">
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-xl shadow-primary/5">
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Orbit className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">OrbitMind Chat</p>
                    <p className="text-xs text-muted-foreground">7 agentes disponíveis</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-4 p-5">
                  {DEMO_MESSAGES.map((msg, i) => {
                    if (msg.from === "user") {
                      return (
                        <div key={i} className="flex justify-end">
                          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                            {msg.text}
                          </div>
                        </div>
                      );
                    }
                    if (msg.from === "system") {
                      return (
                        <div key={i} className="flex justify-center">
                          <Badge variant="outline" className="text-xs gap-1.5">
                            <Zap className="h-3 w-3" />
                            {msg.text}
                          </Badge>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-base">
                          {msg.icon}
                        </div>
                        <div className="max-w-[80%]">
                          <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                            {msg.name}
                          </p>
                          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="border-t border-border/50 px-5 py-3">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5">
                    <span className="flex-1 text-sm text-muted-foreground">
                      Descreva o que você precisa...
                    </span>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agentes do Case */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Agência de Marketing 100% Autônoma</h2>
            <p className="mt-3 text-muted-foreground">
              7 agentes especializados trabalhando juntos em um pipeline de 10 etapas
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🔍", name: "Ana Insights", role: "Pesquisadora de mercado", desc: "Analisa tendências, concorrentes e oportunidades" },
              { icon: "🧠", name: "Sofia Strategy", role: "Estrategista", desc: "Define pilares, calendário e posicionamento" },
              { icon: "✍️", name: "Carlos Copy", role: "Copywriter", desc: "Cria textos para blog, redes sociais e email" },
              { icon: "🎨", name: "Diana Design", role: "Designer", desc: "Gera imagens, carrosséis e assets visuais" },
              { icon: "📊", name: "Samuel SEO", role: "Analista SEO", desc: "Otimiza conteúdo para buscadores" },
              { icon: "✅", name: "Vera Review", role: "Revisora de qualidade", desc: "Garante consistência e qualidade final" },
              { icon: "📤", name: "Paula Post", role: "Publicadora", desc: "Publica e distribui nas redes sociais" },
            ].map((agent) => (
              <div
                key={agent.name}
                className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30"
              >
                <span className="text-2xl mt-0.5">{agent.icon}</span>
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-primary/80">{agent.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{agent.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Planos */}
        <section className="border-t border-border/50 bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center space-y-4">
              <h2 className="text-3xl font-bold">Planos para cada fase do seu negócio</h2>
              <p className="text-muted-foreground">Comece grátis, escale quando precisar</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Free",
                  desc: "Para experimentar e validar",
                  features: ["1 squad", "3 agentes", "100 execuções por mês", "Chat com agentes", "Board kanban"],
                  cta: "Começar grátis",
                  primary: false,
                },
                {
                  name: "Pro",
                  desc: "Para equipes em crescimento",
                  features: ["5 squads", "15 agentes", "1.000 execuções por mês", "Integrações GitHub e Discord", "Pipeline com checkpoints", "Suporte prioritário"],
                  cta: "Começar com Pro",
                  primary: true,
                },
                {
                  name: "Enterprise",
                  desc: "Para operações em escala",
                  features: ["Squads ilimitados", "Agentes ilimitados", "10.000 execuções por mês", "SSO e RBAC avançado", "SLA e suporte dedicado", "Escritório virtual"],
                  cta: "Falar com vendas",
                  primary: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-6 ${
                    plan.primary
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-card"
                  }`}
                >
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={cn(
                      "mt-8 w-full",
                      buttonVariants({ variant: plan.primary ? "default" : "outline" }),
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Pronto para montar seu primeiro squad?
            </h2>
            <p className="text-muted-foreground">
              Crie sua conta em 30 segundos e comece a operar agentes autônomos hoje mesmo.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Começar grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-2">
            <Orbit className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              OrbitMind Platform
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Squads de IA que trabalham para você
          </p>
        </div>
      </footer>
    </div>
  );
}
