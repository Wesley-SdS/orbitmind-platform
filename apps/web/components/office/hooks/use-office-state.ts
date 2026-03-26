import { useState, useEffect, useRef, useCallback } from "react";
import { OFFICE_ROOMS, AGENT_COLORS, getRoomForRole } from "@/lib/office/room-layout";

export interface OfficeAgent3D {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "idle" | "working" | "delivering" | "done" | "checkpoint";
  roomId: string;
  position: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number } | null;
  targetAgentId: string | null;
  color: number;
}

// Desk positions per room — must match DESKS in office-scene.tsx
// Agent sits BEHIND the desk at Z+0.8 (facing the monitor at Z-0.2)
const ROOM_DESKS: Record<string, Array<{ deskX: number; deskZ: number }>> = {
  research:   [{ deskX: -7, deskZ: -2 }, { deskX: -5, deskZ: -2 }],
  creative:   [{ deskX: -1.2, deskZ: -2 }, { deskX: 1.2, deskZ: -2 }, { deskX: 0, deskZ: -3 }],
  review:     [{ deskX: 6, deskZ: -2 }],
  strategy:   [{ deskX: -6, deskZ: 4 }, { deskX: -4, deskZ: 4 }],
  publishing: [{ deskX: 1, deskZ: 4 }],
  lobby:      [{ deskX: 7, deskZ: 3 }],
};

const AGENT_SIT_OFFSET_Z = 0.8; // Agent sits behind desk

// Demo statuses — used when all agents come as "idle" from backend
const DEMO_STATUSES: OfficeAgent3D["status"][] = [
  "working", "working", "idle", "done", "checkpoint", "working", "idle",
];

function mapAgentsToPositions(
  data: Array<{ id: string; name: string; role: string; icon: string | null; status: string }>,
): OfficeAgent3D[] {
  const roomDeskCounters: Record<string, number> = {};

  const mapped = data.map((a, i) => {
    const roomId = getRoomForRole(a.role);
    const desks = ROOM_DESKS[roomId] ?? ROOM_DESKS.lobby!;

    const deskIdx = roomDeskCounters[roomId] ?? 0;
    roomDeskCounters[roomId] = deskIdx + 1;

    const desk = desks[deskIdx % desks.length]!;
    const colors = AGENT_COLORS[a.role.toLowerCase().split(" ")[0] ?? "default"] ?? AGENT_COLORS.default!;

    // Use real status from backend, fallback to demo status if all idle
    const realStatus = (a.status as OfficeAgent3D["status"]) || "idle";

    return {
      id: a.id,
      name: a.name,
      role: a.role,
      icon: a.icon ?? "🤖",
      status: realStatus,
      roomId,
      position: {
        x: desk.deskX,
        y: 0,
        z: desk.deskZ + AGENT_SIT_OFFSET_Z,
      },
      targetPosition: null,
      targetAgentId: null,
      color: colors.primary,
    };
  });

  // If ALL agents are idle (no pipeline running), assign demo statuses for visual variety
  const allIdle = mapped.every((a) => a.status === "idle");
  if (allIdle) {
    mapped.forEach((a, i) => {
      a.status = DEMO_STATUSES[i % DEMO_STATUSES.length]!;
    });

    // Demo handoff: last "working" agent delivers to next
    const deliveringIdx = mapped.findIndex((a) => a.status === "idle");
    if (deliveringIdx >= 0 && mapped.length > 1) {
      const target = mapped[(deliveringIdx + 1) % mapped.length]!;
      const deliverer = mapped[deliveringIdx]!;
      deliverer.status = "delivering";
      (deliverer as { targetAgentId: string | null }).targetAgentId = target.id;
      (deliverer as { targetPosition: { x: number; y: number; z: number } | null }).targetPosition = { ...target.position };
    }
  }

  return mapped;
}

export function useOfficeState(squadId: string | null) {
  const [agents, setAgents] = useState<OfficeAgent3D[]>([]);
  const [squads, setSquads] = useState<Array<{ id: string; name: string; icon: string | null; agentCount: number }>>([]);
  const agentsRef = useRef<OfficeAgent3D[]>([]);

  // Load squads
  useEffect(() => {
    fetch("/api/squads")
      .then((r) => r.json())
      .then((data) => setSquads(data))
      .catch(() => {});
  }, []);

  // Load agents for selected squad
  useEffect(() => {
    if (!squadId) return;
    fetch(`/api/squads/${squadId}/agents`)
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string; role: string; icon: string | null; status: string }>) => {
        const mapped = mapAgentsToPositions(data);
        agentsRef.current = mapped;
        setAgents(mapped);
      })
      .catch(() => {});
  }, [squadId]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!squadId) return;
    let ws: WebSocket | null = null;
    try {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${window.location.host}/api/ws?squadId=${squadId}`);
      ws.onerror = () => {};
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "HANDOFF_START") {
            const from = agentsRef.current.find((a) => a.id === data.from);
            const to = agentsRef.current.find((a) => a.id === data.to);
            if (from && to) {
              from.status = "delivering";
              from.targetPosition = { ...to.position };
              from.targetAgentId = to.id;
              agentsRef.current = [...agentsRef.current];
              setAgents(agentsRef.current);
            }
          } else if (data.type === "STEP_CHANGE") {
            const agent = agentsRef.current.find((a) => a.id === data.agentId);
            if (agent) {
              agent.status = data.status || "working";
              agentsRef.current = [...agentsRef.current];
              setAgents(agentsRef.current);
            }
          }
        } catch { /* ignore */ }
      };
    } catch { /* WS not available */ }
    return () => { ws?.close(); };
  }, [squadId]);

  const selectFirstSquad = useCallback(() => {
    if (squads.length > 0) return squads[0]!.id;
    return null;
  }, [squads]);

  return { agents, squads, selectFirstSquad };
}
