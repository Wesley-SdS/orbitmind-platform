"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Zap, GitBranch, Plug, Users, Shield, ChevronDown, ChevronUp, Copy, Check, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string | null;
  modelTier: string;
  runtimeType: string;
  monthlyBudgetTokens: number | null;
  budgetUsedTokens: number | null;
  status: string;
}

interface PipelineStep {
  step: number;
  name: string;
  type: string;
  agentId?: string;
}

interface SquadConfigProps {
  squad: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    icon: string | null;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  config: Record<string, unknown> | null;
  agents: Agent[];
  pipelineSteps: PipelineStep[];
}

const PLATFORM_OPTIONS = [
  { id: "instagram-feed", label: "Instagram Feed", icon: "📸" },
  { id: "linkedin-post", label: "LinkedIn Post", icon: "💼" },
  { id: "twitter-post", label: "Twitter/X", icon: "🐦" },
  { id: "youtube-script", label: "YouTube", icon: "🎬" },
  { id: "blog-post", label: "Blog", icon: "📝" },
  { id: "email-newsletter", label: "Newsletter", icon: "📧" },
];

const TONE_OPTIONS = [
  { id: "educativo", label: "Educativo", icon: "📚", desc: "Ensina algo útil, direto e didático" },
  { id: "provocativo", label: "Provocativo", icon: "🔥", desc: "Desafia crenças, gera debate" },
  { id: "inspiracional", label: "Inspiracional", icon: "✨", desc: "Motiva ação, storytelling emocional" },
  { id: "humoristico", label: "Humorístico", icon: "😄", desc: "Leve, divertido, memes" },
  { id: "autoridade", label: "Autoridade", icon: "🎯", desc: "Expert, dados, credibilidade" },
  { id: "conversacional", label: "Conversacional", icon: "💬", desc: "Como conversa entre amigos" },
];

function ContentBriefDisplay({ brief }: { brief: Record<string, unknown> }) {
  const nicho = brief.nicho as string | undefined;
  const platforms = (brief.targetPlatforms as string[]) ?? [];
  const tone = (brief.tonePreferences as string[]) ?? [];
  const audience = brief.audience as string | undefined;
  const pillars = (brief.contentPillars as string[]) ?? [];
  const references = (brief.referenceProfiles as string[]) ?? [];

  const toneInfo = TONE_OPTIONS.find((t) => tone.includes(t.id));

  return (
    <div className="space-y-3">
      {nicho && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Nicho</p>
          <Badge variant="secondary">{nicho}</Badge>
        </div>
      )}
      {platforms.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Plataformas</p>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => {
              const opt = PLATFORM_OPTIONS.find((o) => o.id === p);
              return (
                <Badge key={p} variant="outline" className="gap-1">
                  {opt?.icon} {opt?.label ?? p}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
      {toneInfo && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Tom</p>
          <p className="text-sm">{toneInfo.icon} {toneInfo.label}</p>
        </div>
      )}
      {audience && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Público-alvo</p>
          <p className="text-sm">{audience}</p>
        </div>
      )}
      {pillars.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Pilares de Conteúdo</p>
          <div className="flex flex-wrap gap-1.5">
            {pillars.map((p) => (
              <Badge key={p} variant="secondary">{p}</Badge>
            ))}
          </div>
        </div>
      )}
      {references.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Referências</p>
          <ul className="space-y-0.5">
            {references.map((r) => (
              <li key={r} className="text-sm text-muted-foreground">{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContentBriefEditor({
  briefData,
  onChange,
  onSave,
  saving,
}: {
  briefData: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const nicho = (briefData.nicho as string) ?? "";
  const platforms = (briefData.targetPlatforms as string[]) ?? [];
  const tone = ((briefData.tonePreferences as string[]) ?? [])[0] ?? "";
  const audience = (briefData.audience as string) ?? "";
  const pillars = (briefData.contentPillars as string[]) ?? [];
  const pillarsText = pillars.join(", ");

  function update(field: string, value: unknown) {
    onChange({ ...briefData, [field]: value });
  }

  function togglePlatform(platformId: string) {
    const current = (briefData.targetPlatforms as string[]) ?? [];
    const next = current.includes(platformId)
      ? current.filter((p) => p !== platformId)
      : [...current, platformId];
    update("targetPlatforms", next);
  }

  return (
    <div className="space-y-5">
      {/* Nicho */}
      <div className="space-y-1.5">
        <Label htmlFor="brief-nicho">Nicho</Label>
        <Input
          id="brief-nicho"
          placeholder="Ex: Marketing Digital, Fitness, SaaS..."
          value={nicho}
          onChange={(e) => update("nicho", e.target.value)}
        />
      </div>

      {/* Plataformas */}
      <div className="space-y-2">
        <Label>Plataformas</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PLATFORM_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 rounded-lg border border-border/50 p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={platforms.includes(opt.id)}
                onCheckedChange={() => togglePlatform(opt.id)}
              />
              <span className="text-sm">{opt.icon} {opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tom */}
      <div className="space-y-2">
        <Label>Tom de Voz</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => update("tonePreferences", [opt.id])}
              className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                tone === opt.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border/50 hover:bg-muted/50"
              }`}
            >
              <span className="text-lg">{opt.icon}</span>
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Público-alvo */}
      <div className="space-y-1.5">
        <Label htmlFor="brief-audience">Público-alvo</Label>
        <Textarea
          id="brief-audience"
          placeholder="Descreva seu público: faixa etária, interesses, dores..."
          value={audience}
          onChange={(e) => update("audience", e.target.value)}
          rows={3}
        />
      </div>

      {/* Pilares */}
      <div className="space-y-1.5">
        <Label htmlFor="brief-pillars">Pilares de Conteúdo</Label>
        <Input
          id="brief-pillars"
          placeholder="Separe por vírgula: Dicas práticas, Cases, Tendências..."
          value={pillarsText}
          onChange={(e) =>
            update(
              "contentPillars",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
        {pillars.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {pillars.map((p) => (
              <Badge key={p} variant="secondary">{p}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <Button onClick={onSave} disabled={saving} className="gap-2">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "Salvando..." : "Salvar Brief"}
      </Button>
    </div>
  );
}

export function SquadConfig({ squad, config, agents, pipelineSteps }: SquadConfigProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefData, setBriefData] = useState<Record<string, unknown>>(
    (config?.contentBrief as Record<string, unknown>) ?? {},
  );
  const [savingBrief, setSavingBrief] = useState(false);

  const skills = (config?.skills as string[]) ?? [];
  const performanceMode = (config?.performanceMode as string) ?? "standard";
  const contentBriefData = config?.contentBrief as Record<string, unknown> | null;
  const agentMap = new Map(agents.map(a => [a.id, a]));

  function toKebab(s: string): string {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
  }

  function resolveAgentName(agentId?: string): string {
    if (!agentId) return "—";
    const direct = agentMap.get(agentId);
    if (direct) return direct.name;
    const found = agents.find(a => toKebab(a.name) === agentId);
    return found?.name ?? agentId;
  }

  function resolveAgentIcon(agentId?: string): string {
    if (!agentId) return "👤";
    const direct = agentMap.get(agentId);
    if (direct) return direct.icon ?? "🤖";
    const found = agents.find(a => toKebab(a.name) === agentId);
    return found?.icon ?? "🤖";
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    toast.success("Config copiada!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveBrief() {
    setSavingBrief(true);
    try {
      const updatedConfig = { ...config, contentBrief: briefData };
      const res = await fetch(`/api/squads/${squad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: updatedConfig }),
      });
      if (res.ok) {
        toast.success("Brief salvo com sucesso!");
        setEditingBrief(false);
      } else {
        toast.error("Erro ao salvar brief");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSavingBrief(false);
    }
  }

  const SKILL_LABELS: Record<string, { name: string; icon: string }> = {
    web_search: { name: "Pesquisa Web", icon: "🔍" },
    web_fetch: { name: "Fetch de URLs", icon: "🌐" },
    instagram_publisher: { name: "Instagram Publisher", icon: "📸" },
    linkedin_publisher: { name: "LinkedIn Publisher", icon: "💼" },
    blotato_publisher: { name: "Blotato Multi-plataforma", icon: "🌐" },
    canva_designer: { name: "Canva Designer", icon: "🎨" },
    apify_scraper: { name: "Apify Web Scraper", icon: "🕷️" },
    image_fetcher: { name: "Image Fetcher", icon: "🖼️" },
  };

  const MODEL_LABELS: Record<string, string> = {
    powerful: "Powerful (alta qualidade)",
    fast: "Fast (rápido e econômico)",
  };

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: "Ativo", color: "bg-green-500" },
    paused: { label: "Pausado", color: "bg-yellow-500" },
    archived: { label: "Arquivado", color: "bg-muted-foreground" },
  };

  const statusInfo = STATUS_LABELS[squad.status] ?? { label: squad.status, color: "bg-muted-foreground" };

  return (
    <div className="space-y-6">
      {/* Squad Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Informações do Squad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Nome</p>
              <p className="text-sm font-medium">{squad.icon} {squad.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Código</p>
              <p className="text-sm font-mono">{squad.code}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant="outline" className="gap-1.5">
                <div className={`h-2 w-2 rounded-full ${statusInfo.color}`} />
                {statusInfo.label}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Performance</p>
              <Badge variant="secondary">{performanceMode === "high" ? "Alta Performance" : performanceMode === "economic" ? "Econômico" : "Padrão"}</Badge>
            </div>
            {squad.description && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm">{squad.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Brief */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Brief de Conteúdo
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditingBrief(!editingBrief)}>
              {editingBrief ? "Cancelar" : "Editar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!contentBriefData && !editingBrief ? (
            <p className="text-sm text-muted-foreground">
              Nenhum brief configurado. Clique em Editar para definir o nicho, plataformas e tom do seu squad.
            </p>
          ) : editingBrief ? (
            <ContentBriefEditor briefData={briefData} onChange={setBriefData} onSave={handleSaveBrief} saving={savingBrief} />
          ) : (
            <ContentBriefDisplay brief={contentBriefData!} />
          )}
        </CardContent>
      </Card>

      {/* Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Agentes ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                <span className="text-xl">{agent.icon ?? "🤖"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.role}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {MODEL_LABELS[agent.modelTier] ?? agent.modelTier}
                </Badge>
                {agent.monthlyBudgetTokens && (
                  <span className="text-[10px] text-muted-foreground">
                    {((agent.budgetUsedTokens ?? 0) / 1000).toFixed(0)}k / {(agent.monthlyBudgetTokens / 1000).toFixed(0)}k tokens
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            Pipeline ({pipelineSteps.length} etapas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pipelineSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pipeline configurado.</p>
          ) : (
            <div className="space-y-2">
              {pipelineSteps.map((step) => {
                const isCheckpoint = step.type.startsWith("checkpoint");
                const checkpointColor = step.type === "checkpoint-input" ? "bg-blue-500/15 text-blue-500"
                  : step.type === "checkpoint-select" ? "bg-purple-500/15 text-purple-500"
                  : "bg-amber-500/15 text-amber-500";
                const checkpointLabel = step.type === "checkpoint-input" ? "Briefing"
                  : step.type === "checkpoint-select" ? "Seleção"
                  : step.type === "checkpoint-approve" ? "Aprovação"
                  : step.type === "checkpoint" ? "Checkpoint" : "Agente";
                return (
                  <div key={step.step} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCheckpoint ? checkpointColor : "bg-primary/10 text-primary"
                    }`}>
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{step.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isCheckpoint ? "👤 Humano" : `${resolveAgentIcon(step.agentId)} ${resolveAgentName(step.agentId)}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {checkpointLabel}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4" />
            Skills ({skills.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma skill configurada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const info = SKILL_LABELS[skill] ?? { name: skill, icon: "⚙️" };
                return (
                  <div key={skill} className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2">
                    <span>{info.icon}</span>
                    <span className="text-sm">{info.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw JSON */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Configuração JSON
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowRaw(!showRaw)} className="gap-1.5">
                {showRaw ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showRaw ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showRaw && (
          <CardContent>
            <pre className="rounded-lg bg-muted p-4 text-xs overflow-auto max-h-96 font-mono">
              {JSON.stringify(config, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
