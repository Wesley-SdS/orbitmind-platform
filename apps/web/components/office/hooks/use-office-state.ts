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

// Map room IDs to 3D positions
const ROOM_3D_POSITIONS: Record<string, { x: number; z: number }> = {
  research:   { x: -6, z: -2 },
  creative:   { x: 0,  z: -2 },
  review:     { x: 6,  z: -2 },
  strategy:   { x: -5, z: 4 },
  publishing: { x: 1,  z: 4 },
  lobby:      { x: 6,  z: 4 },
};

function mapAgentsToPositions(
  data: Array<{ id: string; name: string; role: string; icon: string | null; status: string }>,
): OfficeAgent3D[] {
  const roomDeskCounters: Record<string, number> = {};

  return data.map((a) => {
    const roomId = getRoomForRole(a.role);
    const roomPos = ROOM_3D_POSITIONS[roomId] ?? { x: 6, z: 4 };

    // Offset desks within the room
    const deskIdx = roomDeskCounters[roomId] ?? 0;
    roomDeskCounters[roomId] = deskIdx + 1;

    const offsets = [
      { dx: -1.2, dz: 0 },
      { dx: 1.2, dz: 0 },
      { dx: 0, dz: -1 },
      { dx: 0, dz: 1 },
    ];
    const offset = offsets[deskIdx % offsets.length]!;

    const colors = AGENT_COLORS[a.role.toLowerCase().split(" ")[0] ?? "default"] ?? AGENT_COLORS.default!;

    return {
      id: a.id,
      name: a.name,
      role: a.role,
      icon: a.icon ?? "🤖",
      status: (a.status as OfficeAgent3D["status"]) || "idle",
      roomId,
      position: {
        x: roomPos.x + offset.dx,
        y: 0,
        z: roomPos.z + offset.dz,
      },
      targetPosition: null,
      targetAgentId: null,
      color: colors.primary,
    };
  });
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
