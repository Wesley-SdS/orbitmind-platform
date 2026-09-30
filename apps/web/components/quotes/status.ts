import type { QuoteStatus } from "@orbitmind/shared";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  proposal_sent: "Proposta enviada",
  won: "Ganho",
  lost: "Perdido",
};

export const QUOTE_STATUS_DOT: Record<QuoteStatus, string> = {
  new: "bg-[#f2541b]",
  contacted: "bg-[#2f6fd6]",
  proposal_sent: "bg-amber-500",
  won: "bg-emerald-600",
  lost: "bg-muted-foreground",
};
