"use client";

import { Bot, CheckCircle, Zap, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MOCK_SQUADS, MOCK_AGENTS, MOCK_EXECUTIONS } from "@/lib/mock-data";

const STATS = [
  { label: "Squads Ativos", value: "2", change: "+1 este mes", icon: Bot, color: "text-blue-500" },
  { label: "Tasks Completadas", value: "8", change: "+3 esta semana", icon: CheckCircle, color: "text-green-500" },
  { label: "Execucoes Hoje", value: "6", change: "4 concluidas", icon: Zap, color: "text-yellow-500" },
  { label: "Custo Estimado", value: "R$ 3,78", change: "este mes", icon: DollarSign, color: "text-purple-500" },
];

const ACTIVITY = [
  { icon: "🤖", text: "Carlos Copy completou 'Post LinkedIn sobre IA'", time: "2 min" },
  { icon: "✅", text: "Vera Review aprovou copy do email marketing", time: "5 min" },
  { icon: "📊", text: "Samuel SEO analisou SEO do blog post - Score: 78/100", time: "12 min" },
  { icon: "🧠", text: "Sofia Strategy definiu estrategia Q2 2026", time: "25 min" },
  { icon: "🔍", text: "Ana Insights completou pesquisa de tendencias", time: "45 min" },
  { icon: "🚀", text: "Pipeline 'Marketing Campaign Q2' iniciado", time: "1h" },
  { icon: "📤", text: "Paula Post publicou conteudo no Instagram", time: "2h" },
  { icon: "🎨", text: "Diana Design criou carrossel de 5 slides", time: "3h" },
];

const EXEC_DAYS = [
  { day: "Seg", completed: 3, failed: 0, cancelled: 0 },
  { day: "Ter", completed: 5, failed: 1, cancelled: 0 },
  { day: "Qua", completed: 4, failed: 0, cancelled: 1 },
  { day: "Qui", completed: 7, failed: 0, cancelled: 0 },
  { day: "Sex", completed: 6, failed: 1, cancelled: 0 },
  { day: "Sab", completed: 2, failed: 0, cancelled: 0 },
  { day: "Dom", completed: 1, failed: 0, cancelled: 0 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral dos seus squads e metricas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Execucoes - Ultimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {EXEC_DAYS.map((d) => {
                const total = d.completed + d.failed + d.cancelled;
                const maxH = 128;
                const h = Math.max((total / 8) * maxH, 8);
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div className="relative w-full flex flex-col-reverse" style={{ height: maxH }}>
                      <div
                        className="w-full rounded-t bg-green-500/80"
                        style={{ height: (d.completed / 8) * maxH }}
                      />
                      {d.failed > 0 && (
                        <div
                          className="w-full bg-red-500/80"
                          style={{ height: (d.failed / 8) * maxH }}
                        />
                      )}
                      {d.cancelled > 0 && (
                        <div
                          className="w-full bg-muted-foreground/30"
                          style={{ height: (d.cancelled / 8) * maxH }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500/80" />
                Concluidas
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/80" />
                Falhas
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                Canceladas
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Budget por Agente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_AGENTS.slice(0, 5).map((agent) => {
              const pct = agent.monthlyBudgetTokens
                ? Math.round((agent.budgetUsedTokens / agent.monthlyBudgetTokens) * 100)
                : 0;
              return (
                <div key={agent.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span>{agent.icon}</span>
                      {agent.name}
                    </span>
                    <span className={pct > 80 ? "text-red-500" : pct > 60 ? "text-yellow-500" : "text-muted-foreground"}>
                      {pct}%
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={`h-1.5 ${pct > 80 ? "[&>div]:bg-red-500" : pct > 60 ? "[&>div]:bg-yellow-500" : ""}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Squads Ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_SQUADS.filter((s) => s.status === "active").map((squad) => (
              <div key={squad.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="text-2xl">{squad.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{squad.name}</p>
                  <p className="text-xs text-muted-foreground">{squad.agentCount} agentes</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  <div className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                  Ativo
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ACTIVITY.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base mt-0.5">{event.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm">{event.text}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
