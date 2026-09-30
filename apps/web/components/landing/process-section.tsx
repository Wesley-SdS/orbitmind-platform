import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { PROCESS_STEPS, STATS } from "./data";
import { CONTAINER, Eyebrow, SectionTitle, SerifAccent } from "./primitives";
import { Reveal } from "./reveal";

export function ProcessSection() {
  return (
    <section id="processo" className="scroll-mt-18 border-t border-om-fg/6 bg-om-band pt-20 md:pt-[120px]">
      <div className={CONTAINER}>
        <Reveal>
          <Eyebrow>Como trabalhamos</Eyebrow>
          <SectionTitle>
            Do primeiro papo à entrega, <SerifAccent>sem caixa-preta.</SerifAccent>
          </SectionTitle>
        </Reveal>

        <div className="relative mt-14 grid gap-10 sm:grid-cols-2 md:mt-18 lg:grid-cols-4 lg:gap-10">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-px bg-om-fg/14 lg:block" />
          <div aria-hidden="true" className="absolute inset-x-0 -top-[3px] hidden h-[7px] lg:block">
            <span className="absolute top-0 -ml-[3px] size-[7px] animate-[oml-travel_7s_linear_infinite] rounded-full bg-om-accent shadow-[0_0_14px_rgb(242_84_27/0.35)]" />
          </div>
          {PROCESS_STEPS.map((step, index) => (
            <Reveal
              key={step.number}
              delay={index * 0.1}
              className="border-t border-om-fg/14 pt-8 lg:border-t-0 lg:pt-9"
            >
              <p className="font-om-serif text-7xl leading-[0.9] text-om-fg-4 md:text-[80px]">{step.number}</p>
              <h3 className="mt-6 text-[22px] font-semibold tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-om-fg-2">{step.description}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 grid border-t border-om-fg/12 lg:mt-24 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <div className="py-10 lg:py-16 lg:pr-10">
            <p className="text-[22px] font-semibold leading-snug tracking-[-0.02em]">
              Desenvolvemos com os nossos <SerifAccent accent>próprios agentes de IA.</SerifAccent>
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-om-fg-2">
              O mesmo pipeline autônomo que oferecemos acelera os projetos dos nossos clientes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  "border-t border-om-fg/12 py-8 sm:border-t-0 sm:py-10 lg:border-l lg:py-14 lg:pl-8",
                  index > 0 && "sm:border-l sm:pl-6",
                )}
              >
                <p className="font-om-serif text-6xl leading-none md:text-[88px] xl:text-[96px]">
                  <CountUp value={stat.value} />
                  <span className="text-om-accent">{stat.suffix}</span>
                </p>
                <p className="mt-3 max-w-[220px] text-sm leading-normal text-om-fg-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
