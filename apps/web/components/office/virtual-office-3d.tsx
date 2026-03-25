"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useOfficeState } from "./hooks/use-office-state";
import type { OfficeAgent3D } from "./hooks/use-office-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const OfficeCanvas = dynamic(() => import("./office-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0a0a1a]">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-sm text-gray-400">Carregando escritorio 3D...</p>
      </div>
    </div>
  ),
});

export default function VirtualOffice3D() {
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<OfficeAgent3D | null>(null);
  const { agents, squads, selectFirstSquad } = useOfficeState(selectedSquadId);

  // Auto-select first squad
  useEffect(() => {
    if (!selectedSquadId && squads.length > 0) {
      setSelectedSquadId(selectFirstSquad());
    }
  }, [squads, selectedSquadId, selectFirstSquad]);

  return (
    <div className="relative h-full w-full">
      {/* 3D Canvas — fills entire container */}
      <OfficeCanvas
        agents={agents}
        selectedAgentId={selectedAgent?.id ?? null}
        onAgentClick={(agent) => setSelectedAgent(agent)}
      />

      {/* === HTML OVERLAYS === */}

      {/* Squad selector — top left */}
      <div className="absolute top-4 left-4 z-10">
        <select
          className="rounded-lg border border-white/10 bg-black/60 backdrop-blur-md px-3 py-2 text-sm text-white"
          value={selectedSquadId ?? ""}
          onChange={(e) => {
            setSelectedSquadId(e.target.value);
            setSelectedAgent(null);
          }}
        >
          {squads.map((s) => (
            <option key={s.id} value={s.id} className="bg-gray-900">
              {s.icon} {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title — top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
        <h1 className="text-lg font-bold text-white/90">Escritorio Virtual</h1>
        <p className="text-xs text-white/40">{agents.length} agentes ativos</p>
      </div>

      {/* Legend — bottom center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-3 rounded-lg bg-black/50 backdrop-blur-md px-4 py-2 text-xs text-white/70 border border-white/10">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500" /> Trabalhando
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" /> Concluido
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-yellow-500" /> Checkpoint
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-purple-500" /> Entregando
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-gray-500" /> Idle
        </div>
      </div>

      {/* Camera hint — bottom right */}
      <div className="absolute bottom-4 right-4 z-10 rounded-md bg-black/40 backdrop-blur px-2 py-1 text-[10px] text-white/30">
        Arraste para rotacionar · Scroll para zoom
      </div>

      {/* Agent detail panel — right side */}
      {selectedAgent && (
        <div className="absolute top-4 right-4 z-10 w-64 animate-in slide-in-from-right-4 duration-200">
          <Card className="bg-black/70 backdrop-blur-xl border-white/10 text-white shadow-2xl">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm"
                    style={{ backgroundColor: `#${selectedAgent.color.toString(16).padStart(6, "0")}30` }}
                  >
                    {selectedAgent.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm text-white">{selectedAgent.name}</CardTitle>
                    <p className="text-xs text-white/50">{selectedAgent.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-white/40 hover:text-white text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedAgent.status === "working"
                      ? "default"
                      : selectedAgent.status === "done"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-xs"
                >
                  {selectedAgent.status === "idle" ? "Disponivel"
                    : selectedAgent.status === "working" ? "Trabalhando"
                    : selectedAgent.status === "done" ? "Concluido"
                    : selectedAgent.status === "delivering" ? "Entregando"
                    : selectedAgent.status === "checkpoint" ? "Checkpoint"
                    : selectedAgent.status}
                </Badge>
              </div>
              <div className="text-xs text-white/40">
                Sala: {selectedAgent.roomId.charAt(0).toUpperCase() + selectedAgent.roomId.slice(1)}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Budget</span>
                  <span>—</span>
                </div>
                <Progress value={0} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
