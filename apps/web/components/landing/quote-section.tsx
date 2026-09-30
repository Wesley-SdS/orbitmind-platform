import { cn } from "@/lib/utils";
import { QUOTE_NEXT_STEPS } from "./data";
import { CONTAINER, Eyebrow, SectionTitle, SerifAccent } from "./primitives";
import { QuoteWizard } from "./quote-wizard";
import { Reveal } from "./reveal";

export function QuoteSection() {
  return (
    <section id="orcamento" className="scroll-mt-18 border-t border-om-line py-20 md:py-[120px]">
      <div className={cn(CONTAINER, "grid gap-12 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-20")}>
        <Reveal>
          <Eyebrow>Orçamento</Eyebrow>
          <SectionTitle className="md:text-[64px]">
            Vamos construir
            <br />
            <SerifAccent accent>juntos?</SerifAccent>
          </SectionTitle>
          <p className="mt-6 text-[17px] leading-relaxed text-om-fg-2">
            Conte o que você precisa em quatro passos rápidos. Sem compromisso.
          </p>
          <ol className="mt-10 border-t border-om-fg/10">
            {QUOTE_NEXT_STEPS.map((item, index) => (
              <li key={item.title} className="flex gap-4 border-b border-om-fg/10 py-4">
                <span className="pt-0.5 font-om-mono text-xs text-om-accent-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[15px] font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm text-om-fg-2">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={0.1} className="relative">
          <QuoteWizard />
        </Reveal>
      </div>
    </section>
  );
}
