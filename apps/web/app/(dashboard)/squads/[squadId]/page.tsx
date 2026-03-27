export const revalidate = 30;

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Settings, Zap, Clock, DollarSign, Hash } from "lucide-react";
import { SquadActions } from "@/components/squads/squad-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getSessionUser } from "@/lib/auth/session";
import { getSquadWithAgents } from "@/lib/db/queries/squads";
import { getExecutionsBySquadId } from "@/lib/db/queries/executions";

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-muted-foreground",
  working: "bg-blue-500 animate-pulse",
  paused: "bg-yellow-500",
};

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ squadId: string }>;
}) {
  const [{ orgId }, { squadId }] = await Promise.all([getSessionUser(), params]);

  const [squadData, executions] = await Promise.all([
    getSquadWithAgents(squadId),
    getExecutionsBySquadId(squadId, 20),
  ]);

  if (!squadData || squadData.orgId !== orgId) {
    notFound();
  }

  const { agents, ...squad } = squadData;

  const totalTokens = executions.reduce((sum, e) => sum + e.tokensUsed, 0);
  const totalCost = executions.reduce((sum, e) => sum + e.estimatedCost, 0);
  const completed = executions.filter((e) => e.status === "completed").length;
  const avgDuration = executions.filter((e) => e.durationMs).length > 0
    ? Math.round(
        executions
          .filter((e) => e.durationMs)
          .reduce((sum, e) => sum + (e.durationMs ?? 0), 0) /
          executions.filter((e) => e.durationMs).length /
          1000,
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/squads" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{squad.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{squad.name}</h1>
              <p className="text-sm text-muted-foreground">{squad.description}</p>
            </div>
          </div>
        </div>
        <SquadActions squadId={squad.id} status={squad.status} />
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="metrics">Metricas</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agents.map((agent) => {
              const budgetPct = agent.monthlyBudgetTokens
                ? Math.round(((agent.budgetUsedTokens ?? 0) / agent.monthlyBudgetTokens) * 100)
                : 0;
              return (
                <Card key={agent.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
                          {agent.icon}
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${STATUS_COLORS[agent.status] ?? STATUS_COLORS.idle}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{agent.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {agent.modelTier === "powerful" ? "Opus" : "Haiku"}
                      </Badge>
                      <span className="capitalize text-muted-foreground">{agent.status}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Budget</span>
                        <span>{budgetPct}%</span>
                      </div>
                      <Progress
                        value={budgetPct}
                        className={`h-1.5 ${budgetPct > 80 ? "[&>div]:bg-destructive" : budgetPct > 60 ? "[&>div]:bg-yellow-500" : ""}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                {[
                  { step: 1, name: "Pesquisa de Mercado", agent: "Ana Insights", status: "done" },
                  { step: 2, name: "Analise de Tendencias", agent: "Ana Insights", status: "done" },
                  { step: 3, name: "Definicao de Estrategia", agent: "Sofia Strategy", status: "done" },
                  { step: 4, name: "Checkpoint: Aprovacao", agent: "Humano", status: "done" },
                  { step: 5, name: "Criacao de Copy", agent: "Carlos Copy", status: "current" },
                  { step: 6, name: "Otimizacao SEO", agent: "Samuel SEO", status: "pending" },
                  { step: 7, name: "Design Visual", agent: "Diana Design", status: "pending" },
                  { step: 8, name: "Revisao de Qualidade", agent: "Vera Review", status: "pending" },
                  { step: 9, name: "Checkpoint: Aprovacao Final", agent: "Humano", status: "pending" },
                  { step: 10, name: "Publicacao", agent: "Paula Post", status: "pending" },
                ].map((s, i, arr) => (
                  <div key={s.step} className="flex w-full max-w-md flex-col items-center">
                    <div
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 ${
                        s.status === "current"
                          ? "border-primary bg-primary/5"
                          : s.status === "done"
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-border"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          s.status === "done"
                            ? "bg-green-500 text-white"
                            : s.status === "current"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.step}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.agent}</p>
                      </div>
                      {s.status === "current" && (
                        <Badge className="bg-primary/10 text-primary">Em andamento</Badge>
                      )}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="h-4 w-px bg-border" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Execucoes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{executions.length}</p>
                <p className="text-xs text-muted-foreground">{completed} concluidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(totalTokens / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground">tokens utilizados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Custo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">R$ {(totalCost / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">estimado este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duracao media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{avgDuration}s</p>
                <p className="text-xs text-muted-foreground">por execucao</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuracao do Squad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto">
                {JSON.stringify(squad.config, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
