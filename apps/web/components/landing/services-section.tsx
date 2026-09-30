import { ArrowRight, Check, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAPABILITIES, CONTINUOUS_ITEMS, PROJECT_ITEMS } from "./data";
import { CONTAINER, Eyebrow, SectionTitle, SerifAccent, landingButton } from "./primitives";
import { QuoteLink } from "./quote-link";
import { Reveal } from "./reveal";

function Checklist({ items, dark = false }: { items: readonly string[]; dark?: boolean }) {
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-2.5 text-[15px] leading-normal",
            dark ? "text-om-paper/88" : "text-om-body",
          )}
        >
          <Check className="mt-0.5 size-4 shrink-0 text-om-accent" strokeWidth={2.5} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ServicesSection() {
  return (
    <section id="servicos" className="scroll-mt-18 border-t border-om-line py-20 md:py-[120px]">
      <div className={CONTAINER}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-20">
          <Reveal>
            <Eyebrow>Como contratar</Eyebrow>
            <SectionTitle>
              Dois jeitos de trabalhar
              <br className="hidden sm:block" /> <SerifAccent>com a gente.</SerifAccent>
            </SectionTitle>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-[420px] text-[17px] leading-relaxed text-om-fg-2">
              Um time contínuo evoluindo o seu produto, ou um projeto com escopo fechado. Nos dois,
              você acompanha cada entrega de perto.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 md:mt-16 lg:grid-cols-2">
          <Reveal className="h-full">
            <article className="flex h-full flex-col rounded-3xl bg-om-fg p-8 text-om-paper md:p-10">
              <div className="flex items-center justify-between gap-4">
                <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-paper/60">
                  Time dedicado · mensal
                </p>
                <span className="flex h-[26px] items-center rounded-full bg-om-accent px-2.5 text-xs font-semibold text-om-fg">
                  Mais flexível
                </span>
              </div>
              <h3 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-[40px]">
                Desenvolvimento
                <br />
                <SerifAccent accent>contínuo</SerifAccent>
              </h3>
              <p className="mt-4 text-base leading-relaxed text-om-paper/72">
                Um squad que evolui o seu produto todo mês, com prioridades definidas junto com você.
              </p>
              <Checklist items={CONTINUOUS_ITEMS} dark />
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mt-auto lg:pt-10">
                <span className="text-[13px] text-om-paper/60">Ideal para produtos em crescimento</span>
                <QuoteLink
                  engagement="continuous"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-om-paper px-6 text-[15px] font-semibold text-om-fg transition-transform hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-om-accent"
                >
                  Quero um time contínuo
                </QuoteLink>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.1} className="h-full">
            <article className="flex h-full flex-col rounded-3xl border border-om-line bg-white p-8 md:p-10">
              <p className="font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
                Escopo fechado
              </p>
              <h3 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-[40px]">
                Projeto
                <br />
                <SerifAccent accent>específico</SerifAccent>
              </h3>
              <p className="mt-4 text-base leading-relaxed text-om-fg-2">
                Escopo, prazo e investimento definidos antes da primeira linha de código.
              </p>
              <Checklist items={PROJECT_ITEMS} />
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mt-auto lg:pt-10">
                <span className="text-[13px] text-om-fg-3">Ideal para MVPs e novos produtos</span>
                <QuoteLink engagement="project" className={landingButton({ size: "md" })}>
                  Quero orçar um projeto
                </QuoteLink>
              </div>
            </article>
          </Reveal>
        </div>

        <Reveal className="mt-4">
          <div className="flex flex-col gap-5 rounded-3xl border border-om-line bg-om-card p-6 md:flex-row md:items-center md:px-8">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-om-accent/10 text-om-accent-ink">
              <Compass className="size-5" strokeWidth={1.8} />
            </span>
            <div className="flex-1">
              <p className="text-[17px] font-semibold">
                Precisa de direção antes?{" "}
                <SerifAccent accent className="text-[19px]">
                  Consultoria &amp; discovery
                </SerifAccent>
              </p>
              <p className="mt-1 text-sm text-om-fg-2">
                Diagnóstico técnico, arquitetura e estratégia de IA para decidir o que construir — e
                como.
              </p>
            </div>
            <QuoteLink
              engagement="consulting"
              className="flex h-11 items-center gap-1.5 text-sm font-medium text-om-fg transition-colors hover:text-om-accent-ink"
            >
              Falar com um especialista
              <ArrowRight className="size-3.5" />
            </QuoteLink>
          </div>
        </Reveal>

        <p className="mt-20 font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
          O que construímos
        </p>
        <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability, index) => (
            <li key={capability.title} className="h-full">
              <Reveal delay={(index % 3) * 0.08} className="h-full">
                <div className="flex h-full gap-[18px] rounded-3xl border border-om-line bg-om-card p-7 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-om-fg/16">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-om-fg/10 bg-white font-om-mono text-xs text-om-accent-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.01em]">{capability.title}</p>
                    <p className="mt-1.5 text-sm leading-normal text-om-fg-2">{capability.description}</p>
                    <p className="mt-2.5 font-om-mono text-[11.5px] text-om-fg-3">{capability.proof}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
