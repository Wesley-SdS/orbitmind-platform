import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrbitSystem } from "@/components/landing/hero-orbit";
import { OrbitMark } from "@/components/landing/orbit-mark";
import { SerifAccent } from "@/components/landing/primitives";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="om-landing grid min-h-screen bg-om-bg font-sans text-om-fg antialiased lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-om-fg/6 bg-om-band p-10 lg:flex xl:p-14">
        <Link href="/" aria-label="OrbitMind — início" className="flex items-center gap-2.5">
          <OrbitMark />
          <span className="text-lg font-semibold tracking-[-0.02em]">OrbitMind</span>
        </Link>

        <div aria-hidden="true" className="mx-auto w-full max-w-[420px] py-10">
          <OrbitSystem showLabels={false} />
        </div>

        <div>
          <p className="max-w-[480px] text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] xl:text-[40px]">
            Seus squads de IA <SerifAccent accent>trabalhando por você.</SerifAccent>
          </p>
          <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-om-fg-2">
            Acompanhe agentes, pipelines e entregas em tempo real — e aprove só o que importa.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-6 py-6 md:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="OrbitMind — início" className="flex items-center gap-2 lg:invisible">
            <OrbitMark className="size-6" />
            <span className="font-semibold tracking-[-0.02em]">OrbitMind</span>
          </Link>
          <Link
            href="/"
            className="flex h-11 items-center gap-1.5 text-sm text-om-fg-2 transition-colors hover:text-om-fg"
          >
            <ArrowLeft className="size-4" />
            Voltar ao site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          {children}
        </div>
        <p className="text-center font-om-mono text-xs text-om-fg-3">
          © {new Date().getFullYear()} OrbitMind · Software house &amp; consultoria em IA
        </p>
      </main>
    </div>
  );
}
