"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PostPreview } from "./post-preview";

interface StepOutput {
  agentName: string;
  agentIcon: string;
  content: string;
  completedAt: string;
}

interface PipelineStep {
  step: number;
  name: string;
  type: string;
  agentId?: string;
}

interface PipelineChatProps {
  squadId: string;
  pipeline: PipelineStep[];
  stepOutputs: Record<string, StepOutput>;
  runStatus: string | null;
}

export function PipelineChat({ squadId, pipeline, stepOutputs, runStatus }: PipelineChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const sortedOutputs = pipeline
    .filter(step => step.type !== "checkpoint" && stepOutputs[`step-${step.step}`])
    .map(step => ({
      stepId: `step-${step.step}`,
      stepName: step.name,
      ...stepOutputs[`step-${step.step}`]!,
    }));

  // Auto-scroll when new outputs arrive
  useEffect(() => {
    setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }, [sortedOutputs.length]);

  const scrollToAgent = useCallback((stepId: string) => {
    const el = document.getElementById(`chat-${stepId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSummary = useCallback(async () => {
    setLoadingSummary(true);
    setSummary(null);
    try {
      const res = await fetch(`/api/squads/${squadId}/runs/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepOutputs }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      } else {
        toast.error("Erro ao gerar resumo");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoadingSummary(false);
    }
  }, [squadId, stepOutputs]);

  if (sortedOutputs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Comunicação dos agentes
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          Nenhuma execução ainda. Clique em Executar para ver os agentes trabalhando.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Comunicação dos agentes
            {runStatus === "running" && (
              <Badge className="bg-primary/10 text-primary ml-2">Ao vivo</Badge>
            )}
            {runStatus === "waiting_approval" && (
              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 ml-2">Pausado</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSummary}
            disabled={loadingSummary || sortedOutputs.length === 0}
            className="gap-1.5"
          >
            {loadingSummary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Resumo
          </Button>
        </div>

        {/* Agent badges - clickable index */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {sortedOutputs.map((entry) => (
            <button
              key={entry.stepId}
              onClick={() => scrollToAgent(entry.stepId)}
              className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-xs hover:bg-accent transition-colors"
            >
              <span>{entry.agentIcon}</span>
              <span>{entry.agentName}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Summary panel */}
      {summary && (
        <div className="mx-6 mb-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Resumo executivo</span>
          </div>
          <div className="text-sm prose prose-sm prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(summary) }} />
          </div>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-20rem)]" ref={scrollRef}>
        <div className="space-y-4 px-6 pb-6">
          {sortedOutputs.map((entry) => (
            <div key={entry.stepId} id={`chat-${entry.stepId}`} className="flex gap-3">
              <div className="shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-lg">
                  {entry.agentIcon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium">{entry.agentName}</span>
                  <span className="text-[10px] text-muted-foreground">{entry.stepName}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(entry.completedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 prose prose-sm prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(entry.content) }} />
                </div>
                {isSocialStep(entry.stepName, entry.content) && (
                  <PostPreview content={entry.content} agentName={entry.agentName} agentIcon={entry.agentIcon} />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

/** Detect if a step is social/publishing related */
function isSocialStep(stepName: string, content: string): boolean {
  const nameKeywords = ["social", "publicação", "publicacao", "instagram", "linkedin", "post", "conteúdo", "conteudo", "copy", "redação", "redacao", "redes"];
  const lower = stepName.toLowerCase();
  if (nameKeywords.some(kw => lower.includes(kw))) return true;
  // Also check content for post-like patterns
  const contentLower = content.toLowerCase();
  const contentKeywords = ["legenda", "caption", "hashtag", "#", "post para", "carrossel", "carousel", "stories", "feed"];
  return contentKeywords.some(kw => contentLower.includes(kw));
}

/** Lightweight markdown: bold, italic, headers, lists, line breaks */
function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h4 class='font-semibold mt-3 mb-1'>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3 class='font-semibold text-base mt-4 mb-1'>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2 class='font-bold text-lg mt-4 mb-2'>$1</h2>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^(\d+)\.\s+(.+)$/gm, "<li>$1. $2</li>")
    .replace(/^[-–]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br />");
}
