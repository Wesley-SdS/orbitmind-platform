"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface StepOutput {
  agentName: string;
  agentIcon: string;
  content: string;
  completedAt: string;
}

interface CheckpointReviewProps {
  squadId: string;
  runId: string;
  checkpointStepName: string;
  stepOutputs: Record<string, StepOutput>;
  onApproved: () => void;
  onRejected: () => void;
}

export function CheckpointReview({
  squadId,
  runId,
  checkpointStepName,
  stepOutputs,
  onApproved,
  onRejected,
}: CheckpointReviewProps) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const entries = Object.entries(stepOutputs);

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/runs/${runId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Checkpoint aprovado! Pipeline retomado.");
        onApproved();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao aprovar checkpoint");
      }
    } catch {
      toast.error("Erro de conexao");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/runs/${runId}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Checkpoint rejeitado. Pipeline cancelado.");
        onRejected();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao rejeitar checkpoint");
      }
    } catch {
      toast.error("Erro de conexao");
    } finally {
      setRejecting(false);
    }
  }

  const busy = approving || rejecting;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">&#9199;</span>
            <h3 className="text-base font-semibold">
              Checkpoint: {checkpointStepName}
            </h3>
            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">
              Aguardando aprovação
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Pipeline pausado aguardando sua revisao
          </p>
        </div>

        {/* Step outputs */}
        {entries.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Resultados dos agentes:
            </p>
            {entries.map(([stepName, output], i) => (
              <details
                key={stepName}
                open={i === 0}
                className="group rounded-lg border border-border bg-background/50"
              >
                <summary className="flex cursor-pointer items-center gap-3 p-3 text-sm font-medium select-none list-none [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  <span className="flex-1">
                    <span className="mr-2">{output.agentIcon}</span>
                    {output.agentName}
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {stepName}
                    </span>
                  </span>
                  {output.completedAt && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {new Date(output.completedAt).toLocaleTimeString("pt-BR")}
                    </span>
                  )}
                </summary>
                <div className="border-t border-border px-4 py-3">
                  <div className="text-sm text-foreground/90 leading-relaxed max-h-80 overflow-y-auto prose prose-sm prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(output.content || "Sem conteudo disponivel.") }} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-500/20">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            disabled={busy}
            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
          >
            {rejecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Rejeitar
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={busy}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {approving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Aprovar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^(\d+)\.\s+(.+)$/gm, "<li>$1. $2</li>")
    .replace(/^[-–]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br />");
}
