"use client";

import { cn } from "@/lib/utils";
import { QUOTE_EVENT, type QuoteEngagement } from "./data";

interface QuoteLinkProps {
  engagement?: QuoteEngagement;
  className?: string;
  children: React.ReactNode;
}

/** Link para o wizard de orçamento; opcionalmente já seleciona o formato de contratação. */
export function QuoteLink({ engagement, className, children }: QuoteLinkProps) {
  return (
    <a
      href="#orcamento"
      className={cn(className)}
      onClick={() => {
        if (engagement) {
          window.dispatchEvent(new CustomEvent<QuoteEngagement>(QUOTE_EVENT, { detail: engagement }));
        }
      }}
    >
      {children}
    </a>
  );
}
