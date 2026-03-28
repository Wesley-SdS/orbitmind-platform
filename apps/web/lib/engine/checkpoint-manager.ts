/**
 * In-process checkpoint manager for pipeline runs.
 *
 * Uses globalThis to survive module re-compilations in Next.js dev mode.
 * The PipelineRunner's `onCheckpoint` callback returns the promise created
 * here, effectively pausing execution until `approveCheckpoint` or
 * `rejectCheckpoint` resolves it.
 */

interface PendingCheckpoint {
  resolve: (response: string) => void;
  stepId: string;
}

// Use globalThis to persist across dev mode recompilations
const globalKey = "__orbitmind_pending_checkpoints__";

function getMap(): Map<string, PendingCheckpoint> {
  if (!(globalThis as Record<string, unknown>)[globalKey]) {
    (globalThis as Record<string, unknown>)[globalKey] = new Map<string, PendingCheckpoint>();
  }
  return (globalThis as Record<string, unknown>)[globalKey] as Map<string, PendingCheckpoint>;
}

export function waitForCheckpoint(runId: string, stepId: string): Promise<string> {
  return new Promise((resolve) => {
    const map = getMap();
    map.set(runId, { resolve, stepId });
    console.log(`[CheckpointManager] Registered pending checkpoint for run ${runId}, step ${stepId}. Total pending: ${map.size}`);
  });
}

export function approveCheckpoint(runId: string): boolean {
  const map = getMap();
  console.log(`[CheckpointManager] approveCheckpoint called for run ${runId}. Pending keys: [${[...map.keys()].join(", ")}]`);
  const pending = map.get(runId);
  if (pending) {
    pending.resolve("continuar");
    map.delete(runId);
    console.log(`[CheckpointManager] Checkpoint approved for run ${runId}`);
    return true;
  }
  console.log(`[CheckpointManager] No pending checkpoint found for run ${runId}`);
  return false;
}

export function rejectCheckpoint(runId: string): boolean {
  const map = getMap();
  const pending = map.get(runId);
  if (pending) {
    pending.resolve("cancelar");
    map.delete(runId);
    return true;
  }
  return false;
}

export function getPendingCheckpoint(runId: string): PendingCheckpoint | null {
  return getMap().get(runId) ?? null;
}
