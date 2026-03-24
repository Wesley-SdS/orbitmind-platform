export const dynamic = "force-dynamic";

import { Bot, CheckCircle, Zap, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getSessionUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/db/queries/metrics";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const AUDIT_ICONS: Record<string, string> = {
  "squad.created": "🚀",
  "agent.started": "🤖",
  "task.completed": "✅",
  "pipeline.checkpoint": "⏸️",
  "checkpoint.approved": "👍",
  "budget.warning": "⚠️",
  "integration.connected": "🔗",
  "org.created": "🏢",
  "user.created": "👤",
};

export default async function DashboardPage() {
  const { orgId } = await getSessionUser();
  const metrics = await getDashboardMetrics(orgId);

  const stats = [
    { label: "Squads Ativos", value: String(metrics.squadsActive), change: "", icon: Bot, color: "text-blue-500" },
    { label: "Tasks Completadas", value: String(metrics.tasksCompletedThisMonth), change: "este mes", icon: CheckCircle, color: "text-green-500" },
    { label: "Execucoes Hoje", value: String(metrics.executionsToday), change: "", icon: Zap, color: "text-yellow-500" },
    { label: "Custo Estimado", value: `R$ ${(metrics.estimatedCostCentsThisMonth / 100).toFixed(2)}`, change: "este mes", icon: DollarSign, color: "text-purple-500" },
  ];

  const maxExec = Math.max(8, ...metrics.executionsByDay.map((d) => d.completed + d.failed + d.cancelled));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral dos seus squads e metricas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
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
              {metrics.executionsByDay.length > 0 ? (
                metrics.executionsByDay.map((d) => {
                  const dayDate = new Date(d.date + "T12:00:00Z");
                  const dayLabel = DAY_LABELS[dayDate.getUTCDay()] ?? "";
                  const maxH = 128;
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                      <div className="relative w-full flex flex-col-reverse" style={{ height: maxH }}>
                        <div
                          className="w-full rounded-t bg-green-500/80"
                          style={{ height: (d.completed / maxExec) * maxH }}
                        />
                        {d.failed > 0 && (
                          <div
                            className="w-full bg-red-500/80"
                            style={{ height: (d.failed / maxExec) * maxH }}
                          />
                        )}
                        {d.cancelled > 0 && (
                          <div
                            className="w-full bg-muted-foreground/30"
                            style={{ height: (d.cancelled / maxExec) * maxH }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                  Nenhuma execucao nos ultimos 7 dias
                </div>
              )}
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
            {metrics.budgetByAgent.slice(0, 5).map((agent) => (
              <div key={agent.agentId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span>{agent.agentIcon}</span>
                    {agent.agentName}
                  </span>
                  <span className={agent.percentage > 80 ? "text-red-500" : agent.percentage > 60 ? "text-yellow-500" : "text-muted-foreground"}>
                    {agent.percentage}%
                  </span>
                </div>
                <Progress
                  value={agent.percentage}
                  className={`h-1.5 ${agent.percentage > 80 ? "[&>div]:bg-red-500" : agent.percentage > 60 ? "[&>div]:bg-yellow-500" : ""}`}
                />
              </div>
            ))}
            {metrics.budgetByAgent.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum agente configurado</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Squads Ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.activeSquads.map((squad) => (
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
            {metrics.activeSquads.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum squad ativo</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <span className="text-base mt-0.5">{AUDIT_ICONS[event.action] ?? "📋"}</span>
                  <div className="flex-1">
                    <p className="text-sm">
                      {event.action}
                      {(event.metadata as Record<string, unknown>)?.taskTitle
                        ? ` — ${(event.metadata as Record<string, unknown>).taskTitle}`
                        : (event.metadata as Record<string, unknown>)?.squadName
                          ? ` — ${(event.metadata as Record<string, unknown>).squadName}`
                          : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </div>
              ))}
              {metrics.recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
