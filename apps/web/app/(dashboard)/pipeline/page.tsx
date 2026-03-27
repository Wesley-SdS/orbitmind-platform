"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, Play, Pause, Settings2, History, RefreshCw, Plus, ArrowLeft,
  Save, X, GitBranch, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { ImportedAgent } from "@/lib/integrations/actions/github";

interface PipelineConfig {
  organization?: string;
  repository?: string;
  branch?: string;
}

type ViewMode = "grid" | "editor";

const ROLE_ICONS: Record<string, string> = {
  developer: "🔧", reviewer: "🔍", autofix: "🔄", architect: "🏛️",
  designer: "🎨", docs: "📝", ideator: "💡", taskmaster: "📋",
  qa: "🧪", release: "🚀", rebase: "🔀", "project-sync": "📌",
  general: "⚙️",
};

export default function PipelinePage() {
  const [agents, setAgents] = useState<ImportedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<PipelineConfig>({});
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedAgent, setSelectedAgent] = useState<ImportedAgent | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAgents = useCallback(async () => {
    try {
      const resp = await fetch("/api/integrations/github/agents");
      if (resp.ok) {
        const data = await resp.json();
        setAgents(data);
      }
    } catch (e) {
      console.error("Failed to load agents:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const resp = await fetch("/api/integrations");
      if (resp.ok) {
        const integrations = await resp.json();
        const github = integrations.find((i: { integrationId: string }) => i.integrationId === "github");
        if (github?.config) {
          setConfig(github.config as PipelineConfig);
        }
      }
    } catch { /* */ }
  }, []);

  useEffect(() => {
    loadConfig();
    loadAgents();
  }, [loadConfig, loadAgents]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAgents();
  }

  async function handleToggle(agent: ImportedAgent) {
    const enable = agent.state !== "active";
    try {
      await fetch(`/api/integrations/github/agents/${agent.workflowId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable }),
      });
      await loadAgents();
    } catch (e) {
      console.error("Toggle failed:", e);
    }
  }

  async function handleTrigger(agent: ImportedAgent) {
    try {
      await fetch(`/api/integrations/github/agents/${agent.workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: config.branch ?? "main" }),
      });
      // Reload after brief delay to allow workflow to start
      setTimeout(loadAgents, 3000);
    } catch (e) {
      console.error("Trigger failed:", e);
    }
  }

  if (loading) {
    return <PageLoader text="Carregando pipeline..." />;
  }

  if (!config.repository) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <GitBranch className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum repositorio conectado.</p>
        <a href="/integrations">
          <Button>Configurar GitHub</Button>
        </a>
      </div>
    );
  }

  if (viewMode === "editor" && selectedAgent) {
    return (
      <AgentEditor
        agent={selectedAgent}
        config={config}
        onBack={() => { setViewMode("grid"); setSelectedAgent(null); loadAgents(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground flex items-center gap-1.5">
            <GitBranch className="h-4 w-4" />
            {config.organization}/{config.repository} ({config.branch ?? "main"})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <a href="/integrations">
            <Button size="sm">
              <Settings2 className="h-4 w-4 mr-1" /> Configurar
            </Button>
          </a>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.workflowId}
            agent={agent}
            onEdit={() => { setSelectedAgent(agent); setViewMode("editor"); }}
            onToggle={() => handleToggle(agent)}
            onTrigger={() => handleTrigger(agent)}
          />
        ))}

        {/* Create New Agent Card — redirects to Architect chat */}
        <Card className="border-dashed flex items-center justify-center min-h-[180px] cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => {
            window.location.href = "/chat?message=" + encodeURIComponent("Crie um novo agente para a esteira");
          }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Criar novo agente</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Agent Card ──

function AgentCard({ agent, onEdit, onToggle, onTrigger }: {
  agent: ImportedAgent;
  onEdit: () => void;
  onToggle: () => void;
  onTrigger: () => void;
}) {
  const isActive = agent.state === "active";
  const run = agent.lastRun;

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m${s > 0 ? `${s}s` : ""}`;
  }

  function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min atras`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atras`;
    const days = Math.floor(hours / 24);
    return `${days}d atras`;
  }

  const statusIcon = run?.conclusion === "success"
    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
    : run?.conclusion === "failure"
      ? <XCircle className="h-4 w-4 text-red-500" />
      : run?.status === "in_progress"
        ? <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
        : <AlertCircle className="h-4 w-4 text-muted-foreground" />;

  return (
    <Card className={!isActive ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isActive ? "text-green-500" : "text-muted-foreground"}`}>●</span>
            <span className="text-lg">{ROLE_ICONS[agent.role] ?? "⚙️"}</span>
            <CardTitle className="text-base">{agent.displayName}</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">{agent.role}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground font-mono">{agent.workflowPath}</p>

        {run ? (
          <div className="flex items-center gap-2 text-sm">
            {statusIcon}
            <span>
              {run.conclusion === "success" ? "Sucesso" : run.conclusion === "failure" ? "Falhou" : run.status === "in_progress" ? "Em andamento" : run.conclusion ?? "N/A"}
            </span>
            {run.duration && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDuration(run.duration)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum run</p>
        )}

        {run?.startedAt && (
          <p className="text-xs text-muted-foreground">
            Ultimo run: {formatRelativeTime(run.startedAt)}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {isActive ? (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={onTrigger} title="Disparar manualmente">
                <Play className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggle} title="Desabilitar">
                <Pause className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="flex-1" onClick={onToggle}>
              Habilitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Agent Editor ──

function AgentEditor({ agent, config, onBack }: {
  agent: ImportedAgent;
  config: PipelineConfig;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>(agent.skillPath ? "skill" : "workflow");
  const [skillContent, setSkillContent] = useState(agent.skillContent);
  const [workflowContent, setWorkflowContent] = useState(agent.workflowContent);
  const [commitMessage, setCommitMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const hasSkillChanges = skillContent !== agent.skillContent;
  const hasWorkflowChanges = workflowContent !== agent.workflowContent;
  const hasChanges = hasSkillChanges || hasWorkflowChanges;

  async function handleSave() {
    if (!hasChanges || !commitMessage.trim()) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const body: Record<string, unknown> = { commitMessage: commitMessage.trim() };
      if (hasSkillChanges) body.skillContent = skillContent;
      if (hasWorkflowChanges) body.workflowContent = workflowContent;

      const resp = await fetch(`/api/integrations/github/agents/${agent.workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const sha = (data as { commit?: { sha?: string } }).commit?.sha;
        const msg = sha ? `Commit: ${sha.substring(0, 7)}` : "Atualizado no repo!";
        setSaveResult({ ok: true, message: msg });
      } else {
        const err = await resp.json().catch(() => ({}));
        setSaveResult({ ok: false, message: (err as { error?: string }).error ?? "Erro ao salvar." });
      }
    } catch {
      setSaveResult({ ok: false, message: "Erro de rede." });
    } finally {
      setSaving(false);
    }
  }

  // Compute simple diff
  function computeDiff(original: string, modified: string): string[] {
    const origLines = original.split("\n");
    const modLines = modified.split("\n");
    const lines: string[] = [];
    const max = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < max; i++) {
      const o = origLines[i];
      const m = modLines[i];
      if (o === m) {
        lines.push(`  ${o ?? ""}`);
      } else {
        if (o !== undefined) lines.push(`- ${o}`);
        if (m !== undefined) lines.push(`+ ${m}`);
      }
    }
    return lines;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div>
          <h2 className="text-lg font-bold">
            {ROLE_ICONS[agent.role] ?? "⚙️"} {agent.displayName}
          </h2>
          <p className="text-xs text-muted-foreground">{agent.workflowPath}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {agent.skillPath && <TabsTrigger value="skill">Skill File</TabsTrigger>}
          <TabsTrigger value="workflow">Workflow YAML</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
        </TabsList>

        {agent.skillPath && (
          <TabsContent value="skill" className="space-y-2">
            <p className="text-xs text-muted-foreground font-mono">{agent.skillPath}</p>
            <CodeTextarea value={skillContent} onChange={setSkillContent} />
          </TabsContent>
        )}

        <TabsContent value="workflow" className="space-y-2">
          <p className="text-xs text-muted-foreground font-mono">{agent.workflowPath}</p>
          <CodeTextarea value={workflowContent} onChange={setWorkflowContent} />
        </TabsContent>

        <TabsContent value="runs">
          <RunsTab workflowId={agent.workflowId} />
        </TabsContent>
      </Tabs>

      {/* Diff Preview Dialog */}
      {showDiff && (
        <Dialog open onOpenChange={() => setShowDiff(false)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Preview das alteracoes</DialogTitle>
              <DialogDescription>Verifique as mudancas antes de salvar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {hasSkillChanges && (
                <div>
                  <p className="text-sm font-medium mb-1">{agent.skillPath}</p>
                  <pre className="text-xs font-mono bg-muted/30 rounded-md p-3 overflow-auto max-h-60">
                    {computeDiff(agent.skillContent, skillContent).map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.startsWith("+ ") ? "text-green-500" :
                            line.startsWith("- ") ? "text-red-500" : "text-muted-foreground"
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
              {hasWorkflowChanges && (
                <div>
                  <p className="text-sm font-medium mb-1">{agent.workflowPath}</p>
                  <pre className="text-xs font-mono bg-muted/30 rounded-md p-3 overflow-auto max-h-60">
                    {computeDiff(agent.workflowContent, workflowContent).map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.startsWith("+ ") ? "text-green-500" :
                            line.startsWith("- ") ? "text-red-500" : "text-muted-foreground"
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Save bar */}
      {(activeTab === "skill" || activeTab === "workflow") && (
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20">
          <Input
            placeholder="Commit message (ex: feat: update reviewer to check coverage)"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={() => setShowDiff(true)} disabled={!hasChanges}>
            Preview diff
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || !commitMessage.trim() || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar e push
          </Button>
          {saveResult && (
            <span className={`text-xs ${saveResult.ok ? "text-green-500" : "text-red-500"}`}>
              {saveResult.ok ? "✓" : "✗"} {saveResult.message}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Runs Tab ──

function RunsTab({ workflowId }: { workflowId: number }) {
  const [runs, setRuns] = useState<Array<{
    id: number; status: string; conclusion: string | null;
    run_started_at: string; updated_at: string; html_url?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/integrations/github/runs?workflowId=${workflowId}`)
      .then((r) => r.json())
      .then((data) => {
        setRuns(data?.workflow_runs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workflowId]);

  if (loading) {
    return <PageLoader text="Carregando runs..." />;
  }

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Nenhum run encontrado.</p>;
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const duration = run.run_started_at && run.updated_at
          ? Math.round((new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()) / 1000)
          : null;

        return (
          <div key={run.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
            {run.conclusion === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : run.conclusion === "failure" ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : run.status === "in_progress" ? (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="flex-1 font-mono text-xs">#{run.id}</span>
            <span className="text-muted-foreground">{run.conclusion ?? run.status}</span>
            {duration !== null && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m${duration % 60 > 0 ? `${duration % 60}s` : ""}`}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(run.run_started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Code Textarea with Line Numbers (Fix 10) ──

function CodeTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const lines = value.split("\n");

  function handleScroll() {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  return (
    <div className="flex border rounded-md bg-muted/30 overflow-hidden h-[400px]">
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 overflow-hidden select-none border-r border-border/30 bg-muted/50 text-right pr-2 pl-2 pt-3 pb-3"
        style={{ width: "3rem", lineHeight: "1.5rem", fontSize: "0.875rem" }}
      >
        {lines.map((_, i) => (
          <div key={i} className="text-muted-foreground/40 font-mono">{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="flex-1 font-mono text-sm bg-transparent p-3 resize-none focus:outline-none"
        style={{ lineHeight: "1.5rem" }}
        spellCheck={false}
      />
    </div>
  );
}
