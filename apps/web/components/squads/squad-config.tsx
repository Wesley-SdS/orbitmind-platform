"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Zap, GitBranch, Plug, Users, Shield, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
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

export function SquadConfig({ squad, config, agents, pipelineSteps }: SquadConfigProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const skills = (config?.skills as string[]) ?? [];
  const performanceMode = (config?.performanceMode as string) ?? "standard";
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
              {pipelineSteps.map((step) => (
                <div key={step.step} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.type === "checkpoint" ? "bg-amber-500/15 text-amber-500" : "bg-primary/10 text-primary"
                  }`}>
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.type === "checkpoint" ? "👤 Checkpoint humano" : `${resolveAgentIcon(step.agentId)} ${resolveAgentName(step.agentId)}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {step.type === "checkpoint" ? "Checkpoint" : "Agente"}
                  </Badge>
                </div>
              ))}
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
