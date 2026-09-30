"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QUOTE_STATUSES, type QuoteStatus } from "@orbitmind/shared";
import { cn } from "@/lib/utils";
import { QUOTE_STATUS_DOT, QUOTE_STATUS_LABELS } from "./status";

export function QuoteStatusSelect({ id, status }: { id: string; status: QuoteStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<QuoteStatus>(status);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function handleChange(next: QuoteStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/quote-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Status atualizado: ${QUOTE_STATUS_LABELS[next]}`);
      startTransition(() => router.refresh());
    } catch {
      setValue(previous);
      toast.error("Não foi possível atualizar o status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="flex shrink-0 items-center gap-2">
      <span className="sr-only">Status do pedido</span>
      <span aria-hidden="true" className={cn("size-2 rounded-full", QUOTE_STATUS_DOT[value])} />
      <select
        value={value}
        disabled={saving}
        onChange={(event) => handleChange(event.target.value as QuoteStatus)}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
      >
        {QUOTE_STATUSES.map((option) => (
          <option key={option} value={option}>
            {QUOTE_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
