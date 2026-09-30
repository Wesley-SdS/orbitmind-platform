import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroOrbit } from "./hero-orbit";
import { CONTAINER, SerifAccent, landingButton } from "./primitives";
import { Reveal } from "./reveal";

const HIGHLIGHTS = ["Projeto fechado ou time contínuo", "Web, mobile, WhatsApp e APIs", "IA de ponta a ponta"];

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden pt-18">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[12%] top-[4%] hidden aspect-square w-[58%] max-w-[840px] rounded-full border border-om-fg/5 lg:block"
      />
      <div
        className={cn(
          CONTAINER,
          "grid items-center gap-14 pb-20 pt-10 md:pt-16 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-10 lg:py-16",
        )}
      >
        <div className="max-w-[640px]">
          <Reveal>
            <p className="inline-flex h-[34px] items-center gap-2.5 rounded-full border border-om-fg/10 bg-white/65 pl-3 pr-3.5 text-[13px] text-om-fg-2">
              <span className="size-[7px] animate-oml-pulse rounded-full bg-om-accent" />
              <span className="font-medium text-om-fg">Software house</span>
              &amp; consultoria em IA
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-7 text-balance text-[44px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl xl:text-[88px]">
              Software sob medida que <SerifAccent accent>trabalha</SerifAccent> por você.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-7 max-w-[560px] text-[17px] leading-relaxed text-om-fg-2 md:text-xl md:leading-[1.55]">
              Somos a OrbitMind. Desenhamos, desenvolvemos e evoluímos plataformas, apps e agentes de
              IA — em um projeto fechado ou com um time dedicado ao seu produto.
            </p>
          </Reveal>

          <Reveal delay={0.24} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#orcamento" className={landingButton()}>
              Solicitar orçamento
              <ArrowRight />
            </a>
            <a href="#solucoes" className={cn(landingButton({ variant: "ghost" }), "font-medium")}>
              Ver soluções
            </a>
          </Reveal>

          <Reveal delay={0.32}>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-om-fg-3">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-3.5 text-om-accent" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <HeroOrbit />
      </div>
    </section>
  );
}
