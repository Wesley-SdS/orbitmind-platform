/**
 * Envia um evento para os clientes WebSocket inscritos num squad.
 * O servidor WS só existe quando o app roda via `server.ts` (dev:ws / start:ws);
 * fora disso a chamada é um no-op silencioso.
 */
export async function broadcastSquad(squadId: string, message: { type: string; [key: string]: unknown }): Promise<void> {
  try {
    const { wsManager } = await import("./ws-manager");
    wsManager.broadcastToSquad(squadId, message);
  } catch {
    // WebSocket indisponível neste processo
  }
}

/** Eventos que o escritório virtual e outras telas escutam. */
export const OFFICE_EVENTS = {
  STEP_STARTED: "STEP_STARTED",
  STEP_COMPLETED: "STEP_COMPLETED",
  STEP_FAILED: "STEP_FAILED",
  HANDOFF_START: "HANDOFF_START",
  CHECKPOINT_REACHED: "CHECKPOINT_REACHED",
  CHECKPOINT_RESOLVED: "CHECKPOINT_RESOLVED",
  PIPELINE_STARTED: "PIPELINE_STARTED",
  PIPELINE_COMPLETED: "PIPELINE_COMPLETED",
  PIPELINE_FAILED: "PIPELINE_FAILED",
  PIPELINE_CANCELLED: "PIPELINE_CANCELLED",
} as const;
