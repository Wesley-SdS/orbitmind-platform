"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";

interface AgentWithSquad {
  id: string;
  squadId: string;
  name: string;
  role: string;
  icon: string | null;
  modelTier: string;
  monthlyBudgetTokens: number | null;
  budgetUsedTokens: number | null;
  status: string;
  squadName: string;
  squadIcon: string | null;
}

interface Squad {
  id: string;
  name: string;
  icon: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  idle: { label: "Idle", color: "bg-muted-foreground" },
  working: { label: "Trabalhando", color: "bg-blue-500 animate-pulse" },
  paused: { label: "Pausado", color: "bg-yellow-500" },
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithSquad[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSquad, setFilterSquad] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetch("/api/squads")
      .then((r) => r.json())
      .then((data) => {
        setSquads(data);
        // Fetch agents from each squad
        const agentPromises = data.map((s: Squad) =>
          fetch(`/api/squads/${s.id}/agents`).then((r) => r.json()).then((agents: AgentWithSquad[]) =>
            agents.map((a: AgentWithSquad) => ({ ...a, squadName: (s as Squad & { name: string }).name, squadIcon: (s as Squad & { icon: string | null }).icon }))
          )
        );
        Promise.all(agentPromises).then((results) => {
          setAgents(results.flat());
          setLoading(false);
        });
      });
  }, []);

  const filtered = agents.filter((agent) => {
    if (search && !agent.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSquad !== "all" && agent.squadId !== filterSquad) return false;
    if (filterStatus !== "all" && agent.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <PageLoader text="Carregando agentes..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agentes</h1>
        <p className="text-muted-foreground">Todos os agentes da sua organização</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSquad} onValueChange={(v) => setFilterSquad(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Squad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os squads</SelectItem>
            {squads.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="working">Trabalhando</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((agent) => {
          const budgetPct = agent.monthlyBudgetTokens
            ? Math.round(((agent.budgetUsedTokens ?? 0) / agent.monthlyBudgetTokens) * 100)
            : 0;
          const statusConf = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle!;

          return (
            <Card key={agent.id} className="transition-colors hover:border-primary/30 cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
                      {agent.icon}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${statusConf.color}`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{agent.squadIcon}</span>
                  <span>{agent.squadName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {agent.modelTier === "powerful" ? "Opus" : "Haiku"}
                  </Badge>
                  <span className="text-muted-foreground">{statusConf.label}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Budget</span>
                    <span>{budgetPct}%</span>
                  </div>
                  <Progress
                    value={budgetPct}
                    className={`h-1.5 ${budgetPct > 80 ? "[&>div]:bg-red-500" : budgetPct > 60 ? "[&>div]:bg-yellow-500" : ""}`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
