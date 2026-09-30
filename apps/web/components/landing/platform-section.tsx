import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_HIGHLIGHTS } from "./data";
import { CONTAINER, Eyebrow, SectionTitle, SerifAccent, landingButton } from "./primitives";
import { Reveal } from "./reveal";
import { SquadDemo } from "./squad-demo";

export function PlatformSection() {
  return (
    <section id="plataforma" className="scroll-mt-18 py-20 md:py-[120px]">
      <div className={CONTAINER}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-20">
          <Reveal>
            <Eyebrow>Carro-chefe · OrbitMind Platform</Eyebrow>
            <SectionTitle className="md:text-6xl">
              Uma mensagem.
              <br />
              <SerifAccent accent>Um squad inteiro.</SerifAccent>
            </SectionTitle>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-[400px] text-[17px] leading-relaxed text-om-fg-2">
              Descreva o que precisa. O Architect escolhe os agentes, desenha o pipeline e o time
              começa a trabalhar na hora. Troque o cenário:
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-12">
          <SquadDemo />
        </Reveal>

        <Reveal className="mt-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <ul className="flex flex-wrap gap-2">
            {PLATFORM_HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="flex h-9 items-center rounded-full border border-om-fg/10 bg-white px-3.5 text-[13px] text-om-fg-2"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="flex shrink-0 gap-2.5">
            <Link href="/login" className={cn(landingButton({ variant: "ghost", size: "md" }), "font-medium")}>
              Entrar
            </Link>
            <Link href="/register" className={landingButton({ size: "md" })}>
              Criar conta grátis
              <ArrowRight />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
