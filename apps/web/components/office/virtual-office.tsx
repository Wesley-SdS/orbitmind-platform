"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Application, Graphics, Container, Text } from "pixi.js";
import { OFFICE_ROOMS, AGENT_COLORS, getRoomForRole } from "@/lib/office/room-layout";
import type { RoomDefinition, FurnitureItem } from "@/lib/office/room-layout";
import { findPath } from "@/lib/office/pathfinding";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AgentVisual {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "idle" | "working" | "delivering" | "done" | "checkpoint";
  roomId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  frame: number;
  color: number;
  hairColor: number;
}

interface SquadInfo {
  id: string;
  name: string;
  icon: string | null;
  agentCount: number;
}

export default function VirtualOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const agentsRef = useRef<AgentVisual[]>([]);
  const animFrameRef = useRef<number>(0);
  const [squads, setSquads] = useState<SquadInfo[]>([]);
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentVisual | null>(null);
  const [agents, setAgents] = useState<AgentVisual[]>([]);

  // Load squads
  useEffect(() => {
    fetch("/api/squads").then((r) => r.json()).then((data) => {
      setSquads(data);
      if (data.length > 0 && !selectedSquadId) setSelectedSquadId(data[0].id);
    });
  }, []);

  // Load agents for selected squad
  useEffect(() => {
    if (!selectedSquadId) return;
    fetch(`/api/squads/${selectedSquadId}/agents`).then((r) => r.json()).then((data) => {
      const visuals: AgentVisual[] = data.map((a: { id: string; name: string; role: string; icon: string | null; status: string }, i: number) => {
        const roomId = getRoomForRole(a.role);
        const room = OFFICE_ROOMS.find((r) => r.id === roomId) ?? OFFICE_ROOMS[5]!;
        const deskIdx = i % room.desks.length;
        const desk = room.desks[deskIdx]!;
        const colors = AGENT_COLORS[a.role.toLowerCase().split(" ")[0] ?? "default"] ?? AGENT_COLORS.default!;

        return {
          id: a.id,
          name: a.name,
          role: a.role,
          icon: a.icon ?? "🤖",
          status: (a.status as AgentVisual["status"]) || "idle",
          roomId,
          x: room.x + desk.x,
          y: room.y + desk.y,
          targetX: room.x + desk.x,
          targetY: room.y + desk.y,
          frame: Math.random() * 100,
          color: colors.primary,
          hairColor: colors.hair,
        };
      });
      agentsRef.current = visuals;
      setAgents(visuals);
    });
  }, [selectedSquadId]);

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application();
    appRef.current = app;

    (async () => {
      await app.init({
        canvas: canvasRef.current!,
        width: 816,
        height: 440,
        backgroundColor: 0x0f172a,
        antialias: false,
        resolution: 2,
        autoDensity: true,
      });

      // Start render loop
      app.ticker.add(() => {
        animFrameRef.current++;
        render(app);
      });
    })();

    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, []);

  // Re-render when agents change
  useEffect(() => {
    if (appRef.current) render(appRef.current);
  }, [agents]);

  function render(app: Application) {
    app.stage.removeChildren();
    const frame = animFrameRef.current;

    // Draw rooms
    for (const room of OFFICE_ROOMS) {
      drawRoom(app.stage, room, frame);
    }

    // Draw agents
    for (const agent of agentsRef.current) {
      drawAgent(app.stage, agent, frame, agent.id === selectedAgent?.id);
      // Animate movement
      if (agent.x !== agent.targetX || agent.y !== agent.targetY) {
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
          agent.x += (dx / dist) * 1.5;
          agent.y += (dy / dist) * 1.5;
        } else {
          agent.x = agent.targetX;
          agent.y = agent.targetY;
        }
      }
      agent.frame = frame;
    }
  }

  function drawRoom(stage: Container, room: RoomDefinition, frame: number) {
    const g = new Graphics();

    // Floor
    g.roundRect(room.x, room.y, room.width, room.height, 8);
    g.fill({ color: room.color, alpha: 0.06 });

    // Border
    g.roundRect(room.x, room.y, room.width, room.height, 8);
    g.stroke({ color: room.color, width: 1.5, alpha: 0.2 });

    stage.addChild(g);

    // Furniture
    for (const f of room.furniture) {
      drawFurniture(stage, room.x + f.x, room.y + f.y, f.type);
    }

    // Desks
    for (const desk of room.desks) {
      const dg = new Graphics();
      dg.roundRect(room.x + desk.x - 20, room.y + desk.y - 8, 40, 20, 3);
      dg.fill({ color: 0x92400e, alpha: 0.4 });
      // Computer
      dg.roundRect(room.x + desk.x - 8, room.y + desk.y - 12, 16, 10, 2);
      dg.fill({ color: 0x475569, alpha: 0.5 });
      stage.addChild(dg);
    }

    // Label
    const label = new Text({
      text: `${room.icon} ${room.name}`,
      style: { fontSize: 9, fill: room.color, fontFamily: "system-ui", fontWeight: "500" },
    });
    label.x = room.x + 8;
    label.y = room.y + room.height - 16;
    label.alpha = 0.6;
    stage.addChild(label);
  }

  function drawFurniture(stage: Container, x: number, y: number, type: string) {
    const g = new Graphics();
    switch (type) {
      case "plant":
        g.circle(x + 6, y + 12, 2);
        g.fill(0x6b4423);
        g.circle(x + 6, y + 4, 6);
        g.fill({ color: 0x22c55e, alpha: 0.6 });
        g.circle(x + 2, y + 7, 4);
        g.fill({ color: 0x16a34a, alpha: 0.5 });
        break;
      case "coffee-machine":
        g.roundRect(x, y, 14, 18, 2);
        g.fill({ color: 0x334155, alpha: 0.6 });
        g.circle(x + 7, y + 6, 2);
        g.fill({ color: 0xef4444, alpha: 0.8 });
        break;
      case "whiteboard":
        g.roundRect(x, y, 56, 32, 3);
        g.fill({ color: 0xf8fafc, alpha: 0.15 });
        g.roundRect(x, y, 56, 32, 3);
        g.stroke({ color: 0x94a3b8, width: 1, alpha: 0.3 });
        break;
      case "bookshelf":
        g.roundRect(x, y, 40, 28, 2);
        g.fill({ color: 0x92400e, alpha: 0.3 });
        for (let i = 0; i < 3; i++) {
          g.roundRect(x + 4 + i * 12, y + 4, 8, 20, 1);
          g.fill({ color: [0x3b82f6, 0xa855f7, 0xf59e0b][i]!, alpha: 0.4 });
        }
        break;
    }
    stage.addChild(g);
  }

  function drawAgent(stage: Container, agent: AgentVisual, frame: number, selected: boolean) {
    const g = new Graphics();
    const bounce = agent.status === "idle" ? Math.sin(frame * 0.05 + agent.x) * 1.5 : 0;
    const shake = agent.status === "working" ? (frame % 4 < 2 ? 1 : -1) : 0;
    const ax = agent.x + shake;
    const ay = agent.y + bounce;

    // Shadow
    g.ellipse(ax, ay + 14, 10, 3);
    g.fill({ color: 0x000000, alpha: 0.12 });

    // Body
    g.roundRect(ax - 6, ay, 12, 16, 3);
    g.fill(agent.color);

    // Head
    g.circle(ax, ay - 6, 5);
    g.fill(0xffddb3);

    // Hair
    g.arc(ax, ay - 8, 4, Math.PI, 0);
    g.fill(agent.hairColor);

    // Status indicator
    if (agent.status === "working") {
      const pulse = Math.sin(frame * 0.15) * 0.2 + 0.5;
      g.circle(ax + 10, ay - 10, 4);
      g.fill({ color: 0x3b82f6, alpha: pulse });
    } else if (agent.status === "done") {
      g.circle(ax + 10, ay - 10, 4);
      g.fill({ color: 0x22c55e, alpha: 0.8 });
    } else if (agent.status === "checkpoint") {
      const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;
      g.circle(ax + 10, ay - 10, 5);
      g.fill({ color: 0xf59e0b, alpha: pulse });
    } else if (agent.status === "delivering") {
      // Envelope
      g.roundRect(ax + 6, ay - 2, 8, 6, 1);
      g.fill({ color: 0xfbbf24, alpha: 0.9 });
    }

    // Selection ring
    if (selected) {
      g.circle(ax, ay + 2, 16);
      g.stroke({ color: 0xa855f7, width: 2, alpha: 0.5 });
    }

    // Working glow
    if (agent.status === "working") {
      const glow = Math.sin(frame * 0.08) * 0.1 + 0.15;
      g.circle(ax, ay + 2, 18);
      g.fill({ color: agent.color, alpha: glow });
    }

    stage.addChild(g);

    // Name
    const nameText = new Text({
      text: agent.name.split(" ")[0] ?? "",
      style: { fontSize: 8, fill: selected ? 0xa855f7 : 0x9ca3af, fontFamily: "system-ui" },
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = ax;
    nameText.y = ay + 18;
    stage.addChild(nameText);
  }

  const selectedSquad = squads.find((s) => s.id === selectedSquadId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Escritorio Virtual</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus agentes trabalhando em tempo real</p>
        </div>
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={selectedSquadId ?? ""}
          onChange={(e) => setSelectedSquadId(e.target.value)}
        >
          {squads.map((s) => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>
      </div>

      {/* Canvas + Detail Panel */}
      <div className="flex gap-4">
        {/* Canvas */}
        <div className="flex-1 rounded-xl border border-border/50 overflow-hidden bg-[#0f172a]">
          <canvas
            ref={canvasRef}
            style={{ width: 816, height: 440, imageRendering: "pixelated" }}
            onClick={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              const cx = (e.clientX - rect.left) * 2;
              const cy = (e.clientY - rect.top) * 2;
              // Find clicked agent
              const clicked = agentsRef.current.find((a) => {
                const dx = cx - a.x * 2;
                const dy = cy - a.y * 2;
                return Math.sqrt(dx * dx + dy * dy) < 40;
              });
              setSelectedAgent(clicked ?? null);
            }}
          />
        </div>

        {/* Agent Detail Panel */}
        {selectedAgent && (
          <Card className="w-64 shrink-0">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg" style={{ backgroundColor: `#${selectedAgent.color.toString(16).padStart(6, "0")}20` }}>
                  {selectedAgent.icon}
                </div>
                <div>
                  <CardTitle className="text-sm">{selectedAgent.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{selectedAgent.role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={selectedAgent.status === "working" ? "default" : selectedAgent.status === "done" ? "secondary" : "outline"}>
                  {selectedAgent.status === "idle" ? "Disponivel" : selectedAgent.status === "working" ? "Trabalhando" : selectedAgent.status === "done" ? "Concluido" : selectedAgent.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Sala: {OFFICE_ROOMS.find((r) => r.id === selectedAgent.roomId)?.name ?? "Lobby"}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Budget</span>
                  <span>—</span>
                </div>
                <Progress value={0} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500" /> Trabalhando</div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /> Concluido</div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-yellow-500" /> Checkpoint</div>
        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-muted-foreground" /> Idle</div>
      </div>
    </div>
  );
}
