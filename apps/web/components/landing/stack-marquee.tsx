import { cn } from "@/lib/utils";
import { STACK } from "./data";
import { CONTAINER } from "./primitives";

export function StackMarquee() {
  const items = [...STACK, ...STACK];

  return (
    <section aria-label="Tecnologias" className="border-y border-om-line">
      <div
        className={cn(
          CONTAINER,
          "flex flex-col gap-4 py-6 md:h-[120px] md:flex-row md:items-center md:gap-10 md:py-0",
        )}
      >
        <div className="shrink-0 md:w-[220px]">
          <p className="text-[15px] font-semibold">Stack em produção</p>
          <p className="mt-1 text-[13px] text-om-fg-3">nos nossos produtos e projetos</p>
        </div>
        <div className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <ul className="flex w-max animate-oml-marquee items-center gap-14 pr-14 group-hover:[animation-play-state:paused]">
            {items.map((name, index) => (
              <li
                key={`${name}-${index}`}
                aria-hidden={index >= STACK.length ? true : undefined}
                className="whitespace-nowrap text-xl font-medium tracking-[-0.02em] text-om-fg-3 md:text-[22px]"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
