import Link from "next/link";
import { cn } from "@/lib/utils";
import { OrbitMark } from "./orbit-mark";
import { CONTAINER } from "./primitives";

const COLUMNS = [
  {
    title: "Soluções",
    links: [
      { href: "#plataforma", label: "OrbitMind Platform" },
      { href: "#solucoes", label: "NexBot" },
      { href: "#solucoes", label: "NexConnect" },
      { href: "#solucoes", label: "Rubrica" },
      { href: "#solucoes", label: "InfluencerAI" },
      { href: "#solucoes", label: "OrbitFinance" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "#servicos", label: "Serviços" },
      { href: "#cases", label: "Cases" },
      { href: "#processo", label: "Como trabalhamos" },
      { href: "#orcamento", label: "Orçamento" },
    ],
  },
  {
    title: "Plataforma",
    links: [
      { href: "/login", label: "Entrar" },
      { href: "/register", label: "Criar conta" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-om-line">
      <div className={cn(CONTAINER, "pb-10 pt-16")}>
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div className="max-w-[360px]">
            <Link href="/" aria-label="OrbitMind — início" className="flex items-center gap-2.5">
              <OrbitMark className="size-6" />
              <span className="font-semibold tracking-[-0.02em]">OrbitMind</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-om-fg-2">
              Software house e consultoria em IA. Plataformas, apps e agentes que trabalham por você.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:gap-20">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3 text-sm">
                <p className="mb-1 font-om-mono text-[11px] uppercase tracking-[0.14em] text-om-fg-3">
                  {column.title}
                </p>
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-om-fg-2 transition-colors hover:text-om-fg"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-2 border-t border-om-line pt-6 font-om-mono text-xs text-om-fg-3 sm:flex-row">
          <span>© {new Date().getFullYear()} OrbitMind</span>
          <span>Software house &amp; consultoria em IA</span>
        </div>
      </div>
    </footer>
  );
}
