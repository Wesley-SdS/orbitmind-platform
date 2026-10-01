"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { OrbitMark } from "@/components/landing/orbit-mark";
import { cn } from "@/lib/utils";

export interface OfficeRailItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface OfficeRailProps {
  items: OfficeRailItem[];
  userName?: string | null;
}

/**
 * Navegação recolhida do modo escritório (64 px), como no design: logo em
 * cartão, ícones de 40 px, item ativo em grafite e o avatar do usuário no pé.
 */
export function OfficeRail({ items, userName }: OfficeRailProps) {
  const pathname = usePathname();
  const initial = (userName?.trim()[0] ?? "?").toUpperCase();

  return (
    <nav
      aria-label="Navegação"
      className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r border-[#1a1a17]/8 bg-[#ece9e2] py-3 md:flex dark:border-white/10 dark:bg-[#1b1a17]"
    >
      <Link
        href="/"
        aria-label="OrbitMind"
        className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#fbfaf7] shadow-[0_0_0_1px_rgba(26,26,23,.1)] dark:bg-[#26241f]"
      >
        <OrbitMark className="size-[22px]" />
      </Link>
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.title}
            title={item.title}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-[10px] text-[#66645d] transition-colors hover:bg-[#1a1a17]/6 hover:text-[#1a1a17] dark:text-[#a5a29a] dark:hover:bg-white/8 dark:hover:text-[#f4f2ec]",
              active && "bg-[#1a1a17] text-[#f7f5f0] hover:bg-[#1a1a17] hover:text-[#f7f5f0] dark:bg-[#f4f2ec] dark:text-[#1a1a17]",
            )}
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {item.badge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f2541b] px-1 text-[10px] font-bold text-[#1a1a17]">{item.badge}</span>
            )}
          </Link>
        );
      })}
      <div className="flex-1" />
      <Link
        href="/settings"
        aria-label={userName ? `Conta de ${userName}` : "Conta"}
        title={userName ?? "Conta"}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a17] text-xs font-semibold text-[#f7f5f0] dark:bg-[#f4f2ec] dark:text-[#1a1a17]"
      >
        {initial}
      </Link>
    </nav>
  );
}
