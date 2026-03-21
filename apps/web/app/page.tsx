import Link from "next/link";
import {
  Orbit,
  MessageSquare,
  KanbanSquare,
  Bot,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Bot,
    title: "Squads de Agentes IA",
    description:
      "Monte equipes autonomas com agentes especializados. Cada agente tem persona, skills e budget proprios.",
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
    title: "Pipeline Autonomo",
    description:
      "Pipeline CI/CD validado com checkpoints de aprovacao humana. Do research a publicacao, 100% automatizado.",
  },
];

const CASE_STATS = [
  { value: "41+", label: "PRs merged autonomamente" },
  { value: "7", label: "agentes especializados" },
  { value: "10", label: "steps no pipeline" },
  { value: "100%", label: "autonomo, zero terminal" },
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
            <Button variant="ghost" render={<Link href="/login" />}>
              Entrar
            </Button>
            <Button render={<Link href="/register" />}>
              Comecar gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-6xl px-6 py-24 text-center lg:py-32">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                Pipeline CI/CD autonomo validado — 41+ PRs merged
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Squads de IA que{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  trabalham para voce
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Monte, configure e opere equipes autonomas de agentes IA.
                Do chat a entrega — agencias de marketing, times de dev, suporte ao cliente.
                Tudo pelo browser, zero terminal.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" render={<Link href="/register" />}>
                  Comecar gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/login" />}>
                  Ja tenho conta
                </Button>
              </div>
            </div>
          </div>
        </section>

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

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Tudo que voce precisa para operar squads de IA</h2>
            <p className="mt-3 text-muted-foreground">
              Interface completa para orquestrar agentes autonomos
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

        <section className="border-t border-border/50 bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold">Case: Agencia de Marketing 100% Autonoma</h2>
              <p className="mt-3 text-muted-foreground">
                7 agentes especializados trabalhando juntos em um pipeline de 10 steps
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: "🔍", name: "Ana Insights", role: "Pesquisadora de mercado" },
                { icon: "🧠", name: "Sofia Strategy", role: "Estrategista" },
                { icon: "✍️", name: "Carlos Copy", role: "Copywriter" },
                { icon: "🎨", name: "Diana Design", role: "Designer" },
                { icon: "📊", name: "Samuel SEO", role: "Analista SEO" },
                { icon: "✅", name: "Vera Review", role: "Revisora de qualidade" },
                { icon: "📤", name: "Paula Post", role: "Publicadora" },
              ].map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4"
                >
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <h2 className="text-3xl font-bold">Planos simples e transparentes</h2>
            <p className="text-muted-foreground">Comece gratis, escale quando precisar</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Free", price: "R$ 0", features: ["1 squad", "3 agentes", "100 execucoes/mes"], cta: "Comecar gratis", primary: false },
              { name: "Pro", price: "R$ 49/mes", features: ["5 squads", "15 agentes", "1.000 execucoes/mes", "Integracoes GitHub/Discord", "Suporte prioritario"], cta: "Assinar Pro", primary: true },
              { name: "Enterprise", price: "R$ 199/mes", features: ["Squads ilimitados", "Agentes ilimitados", "10.000 execucoes/mes", "SSO + RBAC avancado", "SLA + suporte dedicado"], cta: "Falar com vendas", primary: false },
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
                <p className="mt-2 text-3xl font-bold">{plan.price}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.primary ? "default" : "outline"}
                  render={<Link href="/register" />}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
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
            Squads de IA que trabalham para voce
          </p>
        </div>
      </footer>
    </div>
  );
}
