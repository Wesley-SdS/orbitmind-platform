"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Trash2, Loader2, Power, Zap, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  id: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  autonomy: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

interface ScheduleManagerProps {
  squadId: string;
}

const FREQUENCY_PRESETS = [
  { label: "Diário às 9h", cron: "0 9 * * *", desc: "Todo dia às 9:00" },
  { label: "Seg-Sex às 9h", cron: "0 9 * * 1-5", desc: "Dias úteis às 9:00" },
  { label: "Seg-Sex às 14h", cron: "0 14 * * 1-5", desc: "Dias úteis às 14:00" },
  { label: "2x por dia", cron: "0 9,18 * * 1-5", desc: "Seg-Sex às 9h e 18h" },
  { label: "3x por semana", cron: "0 10 * * 1,3,5", desc: "Seg, Qua, Sex às 10:00" },
  { label: "Semanal (segunda)", cron: "0 9 * * 1", desc: "Toda segunda às 9:00" },
  { label: "A cada 2 horas", cron: "0 */2 * * *", desc: "De 2 em 2 horas" },
];

const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Lisbon", label: "Lisboa (WET)" },
  { value: "UTC", label: "UTC" },
];

export function ScheduleManager({ squadId }: ScheduleManagerProps) {
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customCron, setCustomCron] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [autonomy, setAutonomy] = useState<"autonomous" | "interactive">("autonomous");

  const loadSchedules = useCallback(async () => {
    try {
      const res = await fetch(`/api/squads/${squadId}/schedules`);
      if (res.ok) {
        const data = await res.json();
        setScheduleList(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [squadId]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  async function handleCreate() {
    const cronExpression = selectedPreset || customCron;
    if (!cronExpression || cronExpression.length < 5) {
      toast.error("Selecione uma frequência ou digite uma expressão cron.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cronExpression, timezone, autonomy }),
      });
      if (res.ok) {
        toast.success("Agendamento criado!");
        setShowForm(false);
        setSelectedPreset(null);
        setCustomCron("");
        loadSchedules();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao criar agendamento");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(schedule: Schedule) {
    try {
      const res = await fetch(`/api/squads/${squadId}/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      });
      if (res.ok) {
        toast.success(schedule.isActive ? "Agendamento pausado" : "Agendamento ativado");
        loadSchedules();
      }
    } catch {
      toast.error("Erro de conexão");
    }
  }

  async function handleDelete(scheduleId: string) {
    try {
      const res = await fetch(`/api/squads/${squadId}/schedules/${scheduleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Agendamento removido");
        loadSchedules();
      }
    } catch {
      toast.error("Erro de conexão");
    }
  }

  function describeCron(cron: string): string {
    const preset = FREQUENCY_PRESETS.find(p => p.cron === cron);
    if (preset) return preset.desc;
    return cron;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Agendamentos
          </CardTitle>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Novo agendamento
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Schedule list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : scheduleList.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground py-4">
            Nenhum agendamento configurado. Crie um para executar o pipeline automaticamente.
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {scheduleList.map((schedule) => (
              <div
                key={schedule.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  schedule.isActive ? "border-green-500/30 bg-green-500/5" : "border-border opacity-60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{describeCron(schedule.cronExpression)}</p>
                    <Badge variant={schedule.isActive ? "default" : "secondary"} className="text-[10px]">
                      {schedule.isActive ? "Ativo" : "Pausado"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {schedule.autonomy === "autonomous" ? (
                        <><Zap className="h-2.5 w-2.5" /> Autônomo</>
                      ) : (
                        <><UserCheck className="h-2.5 w-2.5" /> Interativo</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>Cron: <code className="font-mono">{schedule.cronExpression}</code></span>
                    <span>TZ: {schedule.timezone}</span>
                    {schedule.lastRunAt && <span>Última: {formatDate(schedule.lastRunAt)}</span>}
                    {schedule.nextRunAt && <span>Próxima: {formatDate(schedule.nextRunAt)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggle(schedule)}
                    title={schedule.isActive ? "Pausar" : "Ativar"}
                  >
                    <Power className={`h-4 w-4 ${schedule.isActive ? "text-green-500" : "text-muted-foreground"}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-destructive"
                    onClick={() => handleDelete(schedule.id)}
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="space-y-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium">Novo agendamento</p>

            {/* Frequency presets */}
            <div className="space-y-2">
              <Label>Frequência</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FREQUENCY_PRESETS.map((preset) => (
                  <button
                    key={preset.cron}
                    type="button"
                    onClick={() => { setSelectedPreset(preset.cron); setCustomCron(""); }}
                    className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                      selectedPreset === preset.cron
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border/50 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-xs font-medium">{preset.label}</span>
                    <span className="text-[10px] text-muted-foreground">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom cron */}
            <div className="space-y-1.5">
              <Label htmlFor="custom-cron">Ou expressão cron personalizada</Label>
              <Input
                id="custom-cron"
                placeholder="0 9 * * 1-5"
                value={customCron}
                onChange={(e) => { setCustomCron(e.target.value); setSelectedPreset(null); }}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Formato: minuto hora dia mês dia-semana (ex: 0 9 * * 1-5 = seg-sex às 9h)
              </p>
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            {/* Autonomy */}
            <div className="space-y-2">
              <Label>Modo de execução</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAutonomy("autonomous")}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                    autonomy === "autonomous"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/50 hover:bg-muted/50"
                  }`}
                >
                  <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Autônomo</p>
                    <p className="text-[10px] text-muted-foreground">Executa tudo sozinho, sem aprovação humana</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAutonomy("interactive")}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                    autonomy === "interactive"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/50 hover:bg-muted/50"
                  }`}
                >
                  <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Interativo</p>
                    <p className="text-[10px] text-muted-foreground">Pausa nos checkpoints e aguarda sua aprovação</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={creating} className="gap-1.5">
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Criar agendamento
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
