"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles, Loader2, X, Eye, ExternalLink, Maximize2, Copy, Check } from "lucide-react";
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
  const [showPreview, setShowPreview] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sortedOutputs = pipeline
    .filter(step => step.type !== "checkpoint" && stepOutputs[`step-${step.step}`])
    .map(step => ({
      stepId: `step-${step.step}`,
      stepName: step.name,
      ...stepOutputs[`step-${step.step}`]!,
    }));

  const socialOutputs = sortedOutputs.filter(e => isSocialStep(e.stepName, e.content));
  const hasSocialContent = socialOutputs.length > 0;

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

  const handleCopyAll = useCallback(async () => {
    const allContent = sortedOutputs
      .map(e => `## ${e.agentName} — ${e.stepName}\n\n${e.content}`)
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(allContent);
    setCopied(true);
    toast.success("Comunicação copiada!");
    setTimeout(() => setCopied(false), 2000);
  }, [sortedOutputs]);

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
              <Badge className="bg-green-500/10 text-green-400 border-green-500/30 ml-2 gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Ao vivo
              </Badge>
            )}
            {runStatus === "waiting_approval" && (
              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 ml-2">Pausado</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasSocialContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                Prévia
              </Button>
            )}
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              disabled={sortedOutputs.length === 0}
              className="gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
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

      {/* Post preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-5xl flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-2xl" style={{ height: "85vh" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold">Prévia dos Posts</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPreview(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-6 pr-4">
                {socialOutputs.map((entry) => (
                  <div key={entry.stepId}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{entry.agentIcon}</span>
                      <span className="text-sm font-medium">{entry.agentName}</span>
                      <span className="text-xs text-muted-foreground">— {entry.stepName}</span>
                    </div>
                    <PostPreview content={entry.content} agentName={entry.agentName} agentIcon={entry.agentIcon} />
                  </div>
                ))}
                {socialOutputs.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum conteúdo de post encontrado nesta execução.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Summary modal */}
      {summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-5xl flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-2xl" style={{ height: "85vh" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold">Resumo Executivo</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSummary(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="prose prose-sm dark:prose-invert max-w-none pr-4 pb-4">
                <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(summary) }} />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Expand modal */}
      {expandedEntry && (() => {
        const entry = sortedOutputs.find(e => e.stepId === expandedEntry);
        if (!entry) return null;
        const sources = extractSources(entry.content);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="flex w-full max-w-5xl flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-2xl" style={{ height: "85vh" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{entry.agentIcon}</span>
                  <span className="text-base font-semibold">{entry.agentName}</span>
                  <span className="text-sm text-muted-foreground">— {entry.stepName}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedEntry(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {sources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sources.map((src, i) => {
                    const host = new URL(src.url).hostname;
                    return (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" title={src.url}
                        className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 text-xs hover:bg-accent transition-colors">
                        <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} alt="" className="h-4 w-4 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <span>{formatDomainName(host)}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                      </a>
                    );
                  })}
                </div>
              )}
              <ScrollArea className="flex-1 min-h-0">
                <div className="prose prose-sm dark:prose-invert max-w-none pr-4 pb-4">
                  <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(entry.content) }} />
                </div>
              </ScrollArea>
            </div>
          </div>
        );
      })()}

      <ScrollArea className="h-[calc(100vh-20rem)]" ref={scrollRef}>
        <div className="space-y-4 px-6 pb-6">
          {sortedOutputs.map((entry) => {
            const sources = extractSources(entry.content);
            return (
              <div key={entry.stepId} id={`chat-${entry.stepId}`} className="flex gap-3">
                <div className="shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-lg">
                    {entry.agentIcon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{entry.agentName}</span>
                    <span className="text-[10px] text-muted-foreground">{entry.stepName}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(entry.completedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => setExpandedEntry(entry.stepId)} title="Expandir">
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Source links */}
                  {sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {sources.slice(0, 5).map((src, i) => {
                        const host = new URL(src.url).hostname;
                        return (
                          <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" title={src.url}
                            className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 text-[10px] hover:bg-accent transition-colors">
                            <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} alt="" className="h-3 w-3 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            <span>{formatDomainName(host)}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 prose prose-sm dark:prose-invert max-w-none max-h-96 overflow-hidden relative">
                    <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(entry.content) }} />
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/80 to-transparent pointer-events-none" />
                  </div>
                  <button onClick={() => setExpandedEntry(entry.stepId)} className="text-xs text-primary hover:underline mt-1">
                    Ler completo →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}

/** Format domain name to readable brand name */
function formatDomainName(hostname: string): string {
  const name = hostname.replace(/^www\./, "").split(".")[0] ?? hostname;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Extract source URLs from agent output */
function extractSources(content: string): Array<{ url: string; title: string }> {
  const sources: Array<{ url: string; title: string }> = [];
  const seen = new Set<string>();

  // Pattern 1: markdown links [title](url)
  for (const match of content.matchAll(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g)) {
    const url = match[2]!;
    const host = new URL(url).hostname;
    if (!seen.has(host)) {
      seen.add(host);
      sources.push({ url, title: match[1] || host });
    }
  }

  // Pattern 2: bare URLs
  for (const match of content.matchAll(/(?<!\()(https?:\/\/\S+)/g)) {
    try {
      const url = match[1]!.replace(/[.,;)]+$/, "");
      const host = new URL(url).hostname;
      if (!seen.has(host) && !host.includes("picsum") && !host.includes("placeholder")) {
        seen.add(host);
        sources.push({ url, title: host });
      }
    } catch { /* invalid URL */ }
  }

  // Pattern 3: "Fonte:" or "Source:" mentions
  for (const match of content.matchAll(/(?:fonte|source|referência)[:\s]+([^\n]+)/gi)) {
    const text = match[1]!.trim();
    const urlMatch = text.match(/(https?:\/\/\S+)/);
    if (urlMatch) {
      try {
        const url = urlMatch[1]!.replace(/[.,;)]+$/, "");
        const host = new URL(url).hostname;
        if (!seen.has(host)) {
          seen.add(host);
          sources.push({ url, title: text.replace(urlMatch[0], "").trim() || host });
        }
      } catch { /* invalid URL */ }
    }
  }

  return sources;
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

/** Lightweight markdown: images, bold, italic, headers, lists, line breaks */
function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Images: ![alt](url) → <img>
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full h-auto my-2 max-h-64 object-cover" loading="lazy" />')
    // Bare image URLs on their own line
    .replace(/^(https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif)(?:\?\S*)?)$/gm, '<img src="$1" alt="image" class="rounded-lg max-w-full h-auto my-2 max-h-64 object-cover" loading="lazy" />')
    // Headers
    .replace(/^### (.+)$/gm, "<h4 class='font-semibold mt-3 mb-1'>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3 class='font-semibold text-base mt-4 mb-1'>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2 class='font-bold text-lg mt-4 mb-2'>$1</h2>")
    // Bold + italic
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>")
    // Lists
    .replace(/^(\d+)\.\s+(.+)$/gm, "<li>$1. $2</li>")
    .replace(/^[-–]\s+(.+)$/gm, "<li>$1</li>")
    // Horizontal rules
    .replace(/^---$/gm, "<hr class='my-3 border-border/50' />")
    // Links: [text](url) → <a>
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">$1</a>')
    // Line breaks
    .replace(/\n/g, "<br />");
}
