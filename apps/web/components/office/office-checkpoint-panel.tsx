"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OfficeAgent, OfficePipelineInfo } from "@/lib/office/types";
import { roomName } from "@/lib/office/room-layout";
import { AgentAvatar } from "./office-agent-panel";

interface OfficeCheckpointPanelProps {
  squadId: string;
  pipeline: OfficePipelineInfo;
  agent: OfficeAgent | null;
  onClose: () => void;
  onResolved: () => void;
}

function waiting(startedAt: string | null): string {
  if (!startedAt) return "";
  const s = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
  if (s < 60) return `aguardando há ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `aguardando há ${m} min`;
  return `aguardando há ${Math.floor(m / 60)} h`;
}

/**
 * Painel de aprovação do checkpoint atual. Tipos que pedem dados (briefing,
 * seleção) continuam na página do squad; aqui resolvemos aprovar/rejeitar.
 */
export function OfficeCheckpointPanel({ squadId, pipeline, agent, onClose, onResolved }: OfficeCheckpointPanelProps) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  const runId = pipeline.runId;
  const isApprove = !pipeline.checkpointType || pipeline.checkpointType === "checkpoint" || pipeline.checkpointType === "checkpoint-approve";
  const total = Math.max(pipeline.totalSteps, 1);

  async function approve(): Promise<void> {
    if (!runId) return;
    setBusy("approve");
    try {
      const body = note.trim() ? { data: { observacao: note.trim() } } : {};
      const res = await fetch(`/api/squads/${squadId}/runs/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Checkpoint aprovado. O pipeline continua.");
        onResolved();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao aprovar o checkpoint");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setBusy(null);
    }
  }

  async function reject(): Promise<void> {
    if (!runId) return;
    if (!confirmReject) { setConfirmReject(true); return; }
    setBusy("reject");
    try {
      const res = await fetch(`/api/squads/${squadId}/runs/${runId}/reject`, { method: "POST" });
      if (res.ok) {
        toast.success("Checkpoint rejeitado. Pipeline cancelado.");
        onResolved();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao rejeitar o checkpoint");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setBusy(null);
      setConfirmReject(false);
    }
  }

  return (
    <aside className="flex h-full w-full flex-col bg-card text-card-foreground" aria-label="Aprovação do checkpoint">
      <div className="flex flex-col gap-2.5 border-b px-5 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#fff1eb] px-2.5 text-xs font-semibold text-[#b53f14] dark:bg-[#f2541b]/25 dark:text-[#ffb08f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f2541b]" />
            Checkpoint · Etapa {Math.min(pipeline.currentStepIndex + 1, total)} de {total}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">{waiting(pipeline.startedAt)}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Fechar painel"><X className="h-4 w-4" /></Button>
        </div>
        <h2 className="text-xl font-semibold leading-tight tracking-tight">{pipeline.checkpointStepName ?? "Aprovação necessária"}</h2>
        {agent && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary"><AgentAvatar agent={agent} size={0.8} /></span>
            <span><b className="font-semibold text-foreground">{agent.name}</b> pede sua decisão · {roomName(agent.roomId)}</span>
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3.5 px-5 py-3.5">
          {!isApprove && (
            <div className="rounded-xl border border-[#2f6fd6]/30 bg-[#2f6fd6]/5 p-3 text-xs leading-relaxed">
              Este checkpoint pede {pipeline.checkpointType === "checkpoint-input" ? "um briefing com dados" : "que você escolha uma opção"}. Preencha na página do squad.
              <Button variant="outline" size="sm" className="mt-2 h-8 w-full" render={<Link href={`/squads/${squadId}`} />}>
                Abrir o pipeline do squad <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <section className="overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between bg-secondary px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Entrega em revisão</span>
              <span className="normal-case tracking-normal font-medium">{Object.keys(pipeline.stepOutputs).length} {Object.keys(pipeline.stepOutputs).length === 1 ? "etapa concluída" : "etapas concluídas"}</span>
            </div>
            <div className="max-h-[320px] overflow-auto p-3">
              {pipeline.sourceStepOutput ? (
                <div className="prose prose-sm max-w-none text-[13px] dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{pipeline.sourceStepOutput}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum resultado registrado ainda para esta etapa.</p>
              )}
            </div>
          </section>

          {isApprove && (
            <section className="flex flex-col gap-1.5">
              <label htmlFor="office-cp-note" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Observação para o squad</label>
              <Textarea
                id="office-cp-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opcional: o que ajustar ou por que aprovou"
                className="min-h-[72px] text-[13px]"
              />
            </section>
          )}
        </div>
      </ScrollArea>

      {isApprove && (
        <div className="flex flex-col gap-2 border-t p-4">
          <Button className="h-11 bg-[#f2541b] text-[#1a1a17] hover:bg-[#d9481a]" disabled={busy !== null || !runId} onClick={approve}>
            {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Aprovar e continuar
          </Button>
          <Button variant={confirmReject ? "destructive" : "outline"} className="h-10" disabled={busy !== null || !runId} onClick={reject} onBlur={() => setConfirmReject(false)}>
            {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmReject ? "Confirmar: rejeitar e cancelar o pipeline" : "Rejeitar"}
          </Button>
        </div>
      )}
    </aside>
  );
}
