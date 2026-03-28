"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";

interface StepOutput {
  agentName: string;
  agentIcon: string;
  content: string;
  completedAt: string;
}

interface CheckpointField {
  name: string;
  label: string;
  type: string;
  options?: string[];
}

interface CheckpointReviewProps {
  squadId: string;
  runId: string;
  checkpointStepName: string;
  checkpointType: string;
  stepOutputs: Record<string, StepOutput>;
  sourceStepOutput?: string;
  checkpointFields?: CheckpointField[];
  onApproved: () => void;
  onRejected: () => void;
}

export function CheckpointReview({
  squadId,
  runId,
  checkpointStepName,
  checkpointType,
  stepOutputs,
  sourceStepOutput,
  checkpointFields,
  onApproved,
  onRejected,
}: CheckpointReviewProps) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [stepImages, setStepImages] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const entries = Object.entries(stepOutputs);
  const busy = approving || rejecting;

  async function handleApprove() {
    if (checkpointType === "checkpoint-select" && selectedOption === null) {
      toast.error("Selecione uma opção antes de confirmar.");
      return;
    }

    setApproving(true);
    try {
      let body: Record<string, unknown> = {};
      if (checkpointType === "checkpoint-input") {
        body = { data: formData };
      } else if (checkpointType === "checkpoint-select" && selectedOption !== null) {
        body = { selectedIndex: selectedOption };
      }

      const res = await fetch(`/api/squads/${squadId}/runs/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Checkpoint aprovado! Pipeline retomado.");
        onApproved();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao aprovar checkpoint");
      }
    } catch {
      toast.error("Erro de conexão");
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
      toast.error("Erro de conexão");
    } finally {
      setRejecting(false);
    }
  }

  // --- checkpoint-input variant ---
  if (checkpointType === "checkpoint-input") {
    const fields = checkpointFields?.length ? checkpointFields : [
      { name: "topic", label: "Tema ou assunto", type: "textarea" },
      { name: "timePeriod", label: "Período de pesquisa", type: "select", options: ["últimas 24 horas", "última semana", "último mês", "últimos 3 meses"] },
      { name: "objective", label: "Objetivo do conteúdo (opcional)", type: "text" },
    ];
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">&#128221;</span>
              <h3 className="text-base font-semibold">
                Briefing: {checkpointStepName}
              </h3>
              <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30">
                Aguardando dados
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Preencha as informações abaixo para continuar o pipeline
            </p>
          </div>

          <div className="mb-6 space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="text-sm font-medium">{field.label}</label>
                {field.type === "textarea" ? (
                  <Textarea
                    value={formData[field.name] ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    placeholder={field.label}
                    rows={4}
                  />
                ) : field.type === "select" && field.options ? (
                  <select
                    value={formData[field.name] ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Selecione...</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={formData[field.name] ?? ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-blue-500/20">
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
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={busy}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {approving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Enviar e continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- checkpoint-select variant ---
  if (checkpointType === "checkpoint-select") {
    const options = parseSelectOptions(sourceStepOutput ?? "");
    return (
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">&#128203;</span>
              <h3 className="text-base font-semibold">
                Seleção: {checkpointStepName}
              </h3>
              <Badge className="bg-purple-500/15 text-purple-500 border-purple-500/30">
                Aguardando seleção
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Escolha uma das opcoes geradas pelo agente
            </p>
          </div>

          <div className="mb-6 space-y-2">
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma opção detectada no output do step anterior.
              </p>
            )}
            {options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedOption === idx
                    ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30"
                    : "border-border bg-background/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      selectedOption === idx
                        ? "bg-purple-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{option.title}</p>
                    {option.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {selectedOption === idx && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-purple-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-500/20">
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
              disabled={busy || selectedOption === null}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {approving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar seleção
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- checkpoint-approve / checkpoint (default) variant ---
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
                <div className="border-t border-border px-4 py-3 space-y-3">
                  <div className="text-sm text-foreground/90 leading-relaxed max-h-80 overflow-y-auto prose prose-sm prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(output.content || "Sem conteudo disponivel.") }} />
                  </div>
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Adicionar imagens manualmente:</p>
                    <ImageUpload
                      images={stepImages[stepName] ?? []}
                      onImagesChange={(imgs) => setStepImages(prev => ({ ...prev, [stepName]: imgs }))}
                      maxImages={5}
                    />
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

// --- Helpers ---

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

interface SelectOption {
  title: string;
  description: string;
}

function parseSelectOptions(text: string): SelectOption[] {
  if (!text.trim()) return [];

  // Try to detect numbered items: "1. Title" or "1) Title" patterns
  const numberedPattern = /^\s*(\d+)[.)]\s+(.+)/gm;
  const matches: SelectOption[] = [];
  let match;

  while ((match = numberedPattern.exec(text)) !== null) {
    const fullLine = (match[2] ?? "").trim();
    // Split title from description at first period, colon, or dash followed by space
    const separatorIdx = fullLine.search(/[.:–-]\s/);
    if (separatorIdx > 0) {
      matches.push({
        title: fullLine.slice(0, separatorIdx).trim(),
        description: fullLine.slice(separatorIdx + 1).trim().replace(/^\s*[-–]\s*/, ""),
      });
    } else {
      matches.push({ title: fullLine, description: "" });
    }
  }

  if (matches.length > 0) return matches;

  // Fallback: split by double newlines and treat each block as an option
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return blocks.map((block, i) => {
    const lines = block.trim().split("\n");
    return {
      title: lines[0]?.replace(/^\d+[.)]\s*/, "").trim() || `Opção ${i + 1}`,
      description: lines.slice(1).join(" ").trim(),
    };
  });
}
