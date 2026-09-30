"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./data";
import { OrbitMark } from "./orbit-mark";
import { CONTAINER, landingButton } from "./primitives";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300",
        solid ? "border-om-line bg-om-bg/80 backdrop-blur-xl" : "border-transparent",
      )}
    >
      <div className={cn(CONTAINER, "flex h-18 items-center justify-between")}>
        <Link href="/" aria-label="OrbitMind — início" className="flex items-center gap-2.5">
          <OrbitMark />
          <span className="text-lg font-semibold tracking-[-0.02em]">OrbitMind</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-om-fg-2 transition-colors hover:text-om-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <Link
            href="/login"
            className="hidden h-11 items-center px-4 text-sm text-om-fg-2 transition-colors hover:text-om-fg sm:flex"
          >
            Entrar
          </Link>
          <a href="#orcamento" className={landingButton({ size: "sm" })}>
            <span className="sm:hidden">Orçamento</span>
            <span className="hidden sm:inline">Solicitar orçamento</span>
            <ArrowRight />
          </a>
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="om-mobile-nav"
            onClick={() => setOpen((value) => !value)}
            className="flex size-11 items-center justify-center rounded-full text-om-fg lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="om-mobile-nav" aria-label="Principal" className="border-t border-om-line lg:hidden">
          <ul className={cn(CONTAINER, "flex flex-col py-3")}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center text-base text-om-fg"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/login" className="flex h-12 items-center text-base text-om-fg-2">
                Entrar na plataforma
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
