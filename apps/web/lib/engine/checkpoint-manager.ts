/**
 * In-process checkpoint manager for pipeline runs.
 *
 * Works because the Node process (dev or custom server) stays alive
 * between the moment a checkpoint is hit and the moment the user
 * approves/rejects via the API.  The PipelineRunner's `onCheckpoint`
 * callback returns the promise created here, effectively pausing
 * execution until `approveCheckpoint` or `rejectCheckpoint` resolves it.
 */

interface PendingCheckpoint {
  resolve: (response: string) => void;
  stepId: string;
}

const pendingCheckpoints = new Map<string, PendingCheckpoint>();

export function waitForCheckpoint(runId: string, stepId: string): Promise<string> {
  return new Promise((resolve) => {
    pendingCheckpoints.set(runId, { resolve, stepId });
  });
}

export function approveCheckpoint(runId: string): boolean {
  const pending = pendingCheckpoints.get(runId);
  if (pending) {
    pending.resolve("continuar");
    pendingCheckpoints.delete(runId);
    return true;
  }
  return false;
}

export function rejectCheckpoint(runId: string): boolean {
  const pending = pendingCheckpoints.get(runId);
  if (pending) {
    pending.resolve("cancelar");
    pendingCheckpoints.delete(runId);
    return true;
  }
  return false;
}

export function getPendingCheckpoint(runId: string): PendingCheckpoint | null {
  return pendingCheckpoints.get(runId) ?? null;
}
