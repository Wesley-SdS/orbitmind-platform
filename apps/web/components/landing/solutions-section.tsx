import { ArrowRight, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLAGSHIP_FEATURES, PRODUCTS, type Product } from "./data";
import { AgentAvatar, CONTAINER, Eyebrow, SectionTitle, SerifAccent, landingButton } from "./primitives";
import { QuoteLink } from "./quote-link";
import { Reveal } from "./reveal";

const CARD_HOVER =
  "transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-om-fg/16 hover:shadow-[0_18px_40px_rgb(26_26_23/0.06)]";

function FlagshipCard() {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-3xl border border-om-line bg-white lg:h-[360px] lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]",
        CARD_HOVER,
      )}
    >
      <div className="flex flex-col p-7 md:p-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex h-[26px] items-center rounded-full bg-om-accent px-2.5 text-xs font-semibold text-om-fg">
            Carro-chefe
          </span>
          <span className="flex h-[26px] items-center rounded-full border border-om-fg/10 px-2.5 text-xs text-om-fg-2">
            SaaS · Agentes de IA
          </span>
        </div>
        <h3 className="mt-5 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">OrbitMind Platform</h3>
        <p className="mt-3 text-[17px] leading-relaxed text-om-fg-2">
          Squads de agentes de IA que trabalham para você — do chat à entrega, com pipeline autônomo
          e aprovação humana nos checkpoints.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center lg:mt-auto">
          <a href="#plataforma" className={landingButton({ size: "md" })}>
            Ver a plataforma em ação
            <ArrowRight />
          </a>
          <span className="text-[13px] text-om-fg-3">41+ PRs merged pelo pipeline autônomo</span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="flex flex-col items-center justify-center gap-4 border-t border-om-fg/6 bg-om-bg p-7 sm:flex-row lg:border-l lg:border-t-0 lg:p-8"
      >
        <div className="w-full max-w-[300px] rounded-[18px] border border-om-line bg-white p-[18px] shadow-[0_20px_50px_rgb(26_26_23/0.08)]">
          <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
            Squad · Marketing
          </p>
          <ul className="mt-3.5 flex flex-col gap-2 text-[13px]">
            <li className="flex items-center gap-2.5">
              <AgentAvatar initials="AI" className="size-[26px] text-[10px]" />
              <span className="flex-1">Ana · Pesquisa</span>
              <span className="font-om-mono text-[11px] text-om-fg-2">feito</span>
            </li>
            <li className="flex items-center gap-2.5">
              <AgentAvatar initials="CC" active className="size-[26px] text-[10px]" />
              <span className="flex-1">Carlos · Copy</span>
              <span className="flex items-center gap-1.5 font-om-mono text-[11px] font-medium text-om-accent-ink">
                <span className="size-1.5 animate-oml-pulse rounded-full bg-om-accent" />
                ativo
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <AgentAvatar initials="VR" className="size-[26px] text-[10px]" />
              <span className="flex-1">Vera · Revisão</span>
              <span className="font-om-mono text-[11px] text-om-fg-3">na fila</span>
            </li>
          </ul>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-om-fg/8">
            <div className="h-full w-[45%] rounded-full bg-om-accent" />
          </div>
        </div>
        <ul className="flex flex-wrap justify-center gap-2 sm:w-[200px] sm:flex-col">
          {FLAGSHIP_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex h-8 items-center rounded-full border border-om-fg/10 bg-white px-3 text-xs text-om-fg-2"
            >
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-3xl border border-om-line bg-om-card p-7 md:p-8",
        CARD_HOVER,
      )}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-xl text-sm font-bold tracking-[-0.02em] text-white"
          style={{ backgroundColor: product.color }}
        >
          {product.mono}
        </span>
        <span
          className={cn(
            "flex h-[26px] items-center rounded-full border bg-white px-2.5 text-xs",
            product.status === "Beta"
              ? "border-om-accent/35 font-medium text-om-accent-ink"
              : "border-om-fg/10 text-om-fg-2",
          )}
        >
          {product.status}
        </span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">{product.name}</h3>
      <p className="mt-1.5 font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
        {product.kind}
      </p>
      <p className="mt-3 text-[15px] leading-normal text-om-fg-2">{product.pitch}</p>
      <ul className="mt-5 flex flex-col gap-2">
        {product.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-[13.5px] leading-normal text-om-body">
            <Check className="mt-0.5 size-[15px] shrink-0 text-om-accent" strokeWidth={2.5} />
            {feature}
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-om-fg/7 pt-4 font-om-mono text-[11.5px] text-om-fg-3 md:mt-auto">
        {product.stack}
      </p>
    </article>
  );
}

function NextProductCard() {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border-[1.5px] border-dashed border-om-fg/20 p-7 md:p-8 lg:flex-row lg:items-center lg:gap-8">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-dashed border-om-accent text-om-accent-ink">
        <Plus className="size-[18px]" />
      </span>
      <div className="flex-1">
        <h3 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">
          Seu produto pode ser <SerifAccent accent>{"o próximo."}</SerifAccent>
        </h3>
        <p className="mt-2 text-[15px] leading-normal text-om-fg-2">
          Conte a ideia. A gente desenha, constrói e evolui com você — do MVP à escala.
        </p>
      </div>
      <QuoteLink className={cn(landingButton({ size: "md" }), "self-start lg:self-auto")}>
        Solicitar orçamento
        <ArrowRight />
      </QuoteLink>
    </div>
  );
}

export function SolutionsSection() {
  return (
    <section id="solucoes" className="scroll-mt-18 py-20 md:py-[120px]">
      <div className={CONTAINER}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-20">
          <Reveal>
            <Eyebrow>Soluções</Eyebrow>
            <SectionTitle>
              Produtos que <SerifAccent accent>nós mesmos</SerifAccent>
              <br className="hidden sm:block" /> construímos.
            </SectionTitle>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-[420px] text-[17px] leading-relaxed text-om-fg-2">
              Nosso portfólio próprio é a prova do que entregamos: SaaS multi-tenant, APIs, apps e
              agentes de IA — pensados, desenhados e operados aqui dentro.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-14 md:mt-16">
          <FlagshipCard />
        </Reveal>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product, index) => (
            <Reveal key={product.name} delay={(index % 3) * 0.08} className="h-full">
              <ProductCard product={product} />
            </Reveal>
          ))}
          <Reveal delay={0.08} className="md:col-span-2 lg:col-span-3">
            <NextProductCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
