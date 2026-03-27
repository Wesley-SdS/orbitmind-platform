"use client";

import { useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

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
  pipeline: PipelineStep[];
  stepOutputs: Record<string, StepOutput>;
  runStatus: string | null;
}

export function PipelineChat({ pipeline, stepOutputs, runStatus }: PipelineChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [stepOutputs]);

  // Sort outputs by pipeline step order
  const sortedOutputs = pipeline
    .filter(step => step.type !== "checkpoint" && stepOutputs[`step-${step.step}`])
    .map(step => ({
      stepId: `step-${step.step}`,
      stepName: step.name,
      ...stepOutputs[`step-${step.step}`]!,
    }));

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
      <CardHeader className="pb-3">
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
      </CardHeader>
      <ScrollArea className="h-[500px]">
        <div className="space-y-4 px-6 pb-6">
          {sortedOutputs.map((entry) => (
            <div key={entry.stepId} className="flex gap-3">
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
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </Card>
  );
}

/** Lightweight markdown: bold, italic, lists, line breaks */
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
