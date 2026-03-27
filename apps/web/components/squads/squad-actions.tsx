"use client";

import { useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SquadActionsProps {
  squadId: string;
  status: string;
}

export function SquadActions({ squadId, status }: SquadActionsProps) {
  const [running, setRunning] = useState(false);
  const [pausing, setPausing] = useState(false);

  async function handleRun() {
    setRunning(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/run`, { method: "POST" });
      if (res.ok) {
        toast.success("Pipeline iniciado!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao executar pipeline");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setRunning(false);
    }
  }

  async function handlePause() {
    setPausing(true);
    try {
      const newStatus = status === "paused" ? "active" : "paused";
      const res = await fetch(`/api/squads/${squadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus === "paused" ? "Squad pausado" : "Squad ativado");
        window.location.reload();
      } else {
        toast.error("Erro ao alterar status");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setPausing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handlePause} disabled={pausing}>
        {pausing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pause className="mr-2 h-4 w-4" />}
        {status === "paused" ? "Ativar" : "Pausar"}
      </Button>
      <Button size="sm" onClick={handleRun} disabled={running}>
        {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        Executar
      </Button>
    </div>
  );
}
