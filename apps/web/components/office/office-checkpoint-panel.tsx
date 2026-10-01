"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OfficeAgent, OfficePipelineInfo } from "@/lib/office/types";
import { digestReview } from "@/lib/office/review-parse";
import { cn } from "@/lib/utils";
import { useNow } from "./office-agent-panel";

interface OfficeCheckpointPanelProps {
  squadId: string;
  pipeline: OfficePipelineInfo;
  agent: OfficeAgent | null;
  agents: OfficeAgent[];
  /** Fecha o painel (celular); no desktop quem fecha é o "Visão geral" do HUD. */
  onClose?: () => void;
  onResolved: () => void;
}

const LABEL = "text-[11px] font-semibold uppercase tracking-[.04em] text-[#66645d]";
const BTN = "flex h-11 items-center justify-center gap-2 rounded-[10px] border border-transparent text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function waiting(since: string | null | undefined, now: number): string {
  if (!since) return "";
  const s = Math.max(0, Math.round((now - new Date(since).getTime()) / 1000));
  if (s < 60) return `aguardando há ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `aguardando há ${m} min`;
  return `aguardando há ${Math.floor(m / 60)} h`;
}

const SLIDE_STYLES = [
  "bg-[#1a1a17] text-[#f7f5f0]",
  "bg-[#f2541b] text-[#1a1a17]",
  "bg-[#ece9e2] text-[#1a1a17]",
  "bg-[#ece9e2] text-[#1a1a17]",
];

/**
 * Painel de aprovação do checkpoint, como no design: o que está em revisão,
 * critérios de qualidade, sugestão do revisor, observação e as três decisões
 * (aprovar e liberar a próxima etapa, devolver para ajustes, rejeitar).
 */
export function OfficeCheckpointPanel({ squadId, pipeline, agent, agents, onClose, onResolved }: OfficeCheckpointPanelProps) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "revise" | "reject" | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [needNote, setNeedNote] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);
  const now = useNow(1000);

  const runId = pipeline.runId;
  const isApprove = !pipeline.checkpointType || pipeline.checkpointType === "checkpoint" || pipeline.checkpointType === "checkpoint-approve";
  const total = Math.max(pipeline.totalSteps, 1);
  const digest = useMemo(() => digestReview(pipeline.sourceStepOutput), [pipeline.sourceStepOutput]);
  const reviewerFirst = agent?.name.split(" ")[0] ?? null;

  // quem produziu o que está em revisão (autores das etapas anteriores, fora o revisor)
  const authors = useMemo(() => {
    const byName = new Map(agents.map((a) => [a.name, a] as const));
    const names = Object.values(pipeline.stepOutputs)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .map((o) => o.agentName)
      .filter((n) => n && n !== agent?.name && byName.has(n));
    return [...new Set(names)].slice(-2);
  }, [pipeline.stepOutputs, agents, agent?.name]);

  async function post(path: string, body: unknown, ok: string): Promise<boolean> {
    if (!runId) return false;
    const res = await fetch(`/api/squads/${squadId}/runs/${runId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (res?.ok) { toast.success(ok); onResolved(); return true; }
    const data = res ? await res.json().catch(() => ({})) : {};
    toast.error((data as { error?: string }).error || "Erro de conexão");
    return false;
  }

  async function approve(): Promise<void> {
    setBusy("approve");
    await post("approve", note.trim() ? { data: { observacao: note.trim() } } : {}, pipeline.nextStepName ? `Aprovado. ${pipeline.nextStepName} liberada.` : "Checkpoint aprovado. O pipeline continua.");
    setBusy(null);
  }

  async function revise(): Promise<void> {
    if (note.trim().length < 3) {
      setNeedNote(true);
      noteRef.current?.focus();
      return;
    }
    setBusy("revise");
    await post("revise", { feedback: note.trim() }, "Devolvido para ajustes. O squad refaz a etapa e volta para você.");
    setBusy(null);
  }

  async function reject(): Promise<void> {
    if (!confirmReject) { setConfirmReject(true); return; }
    setBusy("reject");
    await post("reject", {}, "Checkpoint rejeitado. Pipeline cancelado.");
    setBusy(null);
    setConfirmReject(false);
  }

  const outputsCount = Object.keys(pipeline.stepOutputs).length;
  const meta = digest.slides.length >= 2 ? `carrossel · ${digest.slides.length} slides` : `${outputsCount} ${outputsCount === 1 ? "etapa concluída" : "etapas concluídas"}`;
  const failed = digest.criteria.filter((c) => !c.passed).length;

  return (
    <aside className="flex h-full w-full flex-col bg-[#fbfaf7] text-[#1a1a17] dark:bg-[#1e1d1a] dark:text-[#f4f2ec]" aria-label="Aprovação do checkpoint">
      <div className="flex flex-col gap-2.5 border-b border-[#1a1a17]/8 px-5 pb-3 pt-4 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#fff1eb] px-2.5 text-xs font-semibold text-[#b53f14] dark:bg-[#f2541b]/25 dark:text-[#ffb08f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f2541b]" />
            Checkpoint · Etapa {Math.min(pipeline.currentStepIndex + 1, total)} de {total}
          </span>
          <span className="ml-auto text-[11px] text-[#66645d]">{waiting(pipeline.pausedAt ?? pipeline.startedAt, now)}</span>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Fechar painel" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#66645d] hover:bg-[#1a1a17]/6">
              <X className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          )}
        </div>
        <h2 className="font-om-serif text-[26px] leading-[1.15] tracking-[-.01em]">{pipeline.checkpointStepName ?? "Aprovação necessária"}</h2>
        <p className="text-xs text-[#66645d]">
          {agent ? <>{agent.name} {authors.length > 0 ? `revisou o trabalho de ${authors.join(" e ")}` : "pede sua decisão"}.</> : "O squad pede sua decisão."}
          {pipeline.nextStepName ? ` Sua decisão libera ${pipeline.nextStepName}.` : " Sua decisão encerra o pipeline."}
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3.5 px-5 py-3.5">
          {!isApprove && (
            <div className="rounded-xl border border-[#2f6fd6]/30 bg-[#2f6fd6]/5 p-3 text-xs leading-relaxed">
              Este checkpoint pede {pipeline.checkpointType === "checkpoint-input" ? "um briefing com dados" : "que você escolha uma opção"}. Preencha na página do squad.
              <Link href={`/squads/${squadId}`} className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-[#1a1a17]/15 text-xs font-medium hover:bg-[#1a1a17]/4">
                Abrir o pipeline do squad <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-[#1a1a17]/10 dark:border-white/10">
            <div className={cn(LABEL, "flex items-center justify-between bg-[#f3f1ec] px-3 py-2.5 dark:bg-white/5")}>
              <span>Entrega em revisão</span>
              <span className="font-medium normal-case tracking-normal">{meta}</span>
            </div>
            {digest.slides.length >= 2 ? (
              <div className="flex gap-2 p-3">
                {digest.slides.slice(0, 4).map((s, i) => (
                  <div
                    key={s.index}
                    title={s.text}
                    className={cn(
                      "flex aspect-[4/5] min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-lg p-2 text-[9px] font-semibold leading-[1.25]",
                      SLIDE_STYLES[i] ?? SLIDE_STYLES[3],
                      s.overLimit && "border-2 border-[#f2541b]",
                    )}
                  >
                    {s.overLimit && digest.charLimit ? `Slide ${s.index} · ${s.chars} / ${digest.charLimit} caracteres` : <span className="line-clamp-6">{s.text}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[300px] overflow-auto p-3">
                {pipeline.sourceStepOutput ? (
                  <div className="prose prose-sm max-w-none text-[13px] dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{pipeline.sourceStepOutput}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs text-[#66645d]">Nenhum resultado registrado ainda para esta etapa.</p>
                )}
              </div>
            )}
          </section>

          {digest.criteria.length > 0 && (
            <section className="flex flex-col gap-2">
              <div className={LABEL}>Critérios de qualidade</div>
              {digest.criteria.map((c) => (
                <div key={c.text} className="flex items-start gap-2 text-xs leading-[1.4]">
                  <span className={cn("mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px]", c.passed ? "bg-[#2e8b57]" : "bg-[#f2541b]")}>
                    {c.passed
                      ? <Check className="h-2.5 w-2.5 text-[#f7f5f0]" strokeWidth={3} />
                      : <span className="text-[10px] font-bold leading-none text-[#1a1a17]">!</span>}
                  </span>
                  <span>{c.text}</span>
                </div>
              ))}
              {failed > 0 && <span className="sr-only">{failed} critério(s) não atendido(s)</span>}
            </section>
          )}

          {digest.suggestion && (
            <section className="flex flex-col gap-2 rounded-xl border border-[#1a1a17]/10 p-3 dark:border-white/10">
              <div className={LABEL}>Sugestão {reviewerFirst ? `de ${reviewerFirst}` : "do revisor"}</div>
              <div className="text-[13px] leading-[1.45]">{digest.suggestion}</div>
            </section>
          )}

          {isApprove && (
            <div className="flex flex-col gap-2">
              <label htmlFor="office-cp-note" className={LABEL}>Observação para o squad</label>
              <input
                id="office-cp-note"
                ref={noteRef}
                type="text"
                value={note}
                onChange={(e) => { setNote(e.target.value); if (needNote) setNeedNote(false); }}
                placeholder="Opcional: o que ajustar ou por que aprovou"
                aria-invalid={needNote}
                aria-describedby={needNote ? "office-cp-note-hint" : undefined}
                className={cn(
                  "h-10 rounded-[10px] border bg-[#fdfcfa] px-3 text-[13px] text-[#1a1a17] outline-none placeholder:text-[#8f8c84] focus-visible:ring-2 focus-visible:ring-[#f2541b]/40 dark:bg-white/5 dark:text-[#f4f2ec]",
                  needNote ? "border-[#f2541b]" : "border-[#1a1a17]/16 dark:border-white/15",
                )}
              />
              {needNote && <p id="office-cp-note-hint" className="text-[11px] text-[#b53f14]">Para devolver, escreva o que o squad deve ajustar.</p>}
            </div>
          )}
        </div>
      </ScrollArea>

      {isApprove && (
        <div className="flex flex-col gap-2 border-t border-[#1a1a17]/8 px-5 pb-5 pt-3 dark:border-white/10">
          <button type="button" className={cn(BTN, "bg-[#f2541b] text-[#1a1a17] hover:bg-[#e04a14]")} disabled={busy !== null || !runId} onClick={approve}>
            {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.25} />}
            {pipeline.nextStepName ? `Aprovar e liberar ${pipeline.nextStepName}` : "Aprovar e concluir"}
          </button>
          <div className="flex gap-2">
            <button type="button" className={cn(BTN, "flex-1 bg-[#1a1a17] text-[#f7f5f0] hover:bg-[#2a2825] dark:bg-[#f4f2ec] dark:text-[#1a1a17]")} disabled={busy !== null || !runId} onClick={revise}>
              {busy === "revise" && <Loader2 className="h-4 w-4 animate-spin" />}
              Devolver para ajustes
            </button>
            <button
              type="button"
              className={cn(BTN, "flex-1", confirmReject ? "bg-destructive text-white" : "border-[#1a1a17]/18 hover:bg-[#1a1a17]/4 dark:border-white/15")}
              disabled={busy !== null || !runId}
              onClick={reject}
              onBlur={() => setConfirmReject(false)}
            >
              {busy === "reject" && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmReject ? "Confirmar rejeição" : "Rejeitar"}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
