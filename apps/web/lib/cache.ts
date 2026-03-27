import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import { cache } from "react";

// ---------------------------------------------------------------------------
// Cache Tags — deterministic tag strings for invalidation
// ---------------------------------------------------------------------------

export const CacheTags = {
  squads: (orgId: string) => `squads-${orgId}`,
  squad: (squadId: string) => `squad-${squadId}`,
  agents: (squadId: string) => `agents-${squadId}`,
  agentsByOrg: (orgId: string) => `agents-org-${orgId}`,
  metrics: (orgId: string) => `metrics-${orgId}`,
  tasks: (squadId: string) => `tasks-${squadId}`,
  executions: (squadId: string) => `executions-${squadId}`,
  conversations: (squadId: string) => `conversations-${squadId}`,
} as const;

// ---------------------------------------------------------------------------
// Revalidation helpers — call after mutations
// ---------------------------------------------------------------------------

export function invalidateSquads(orgId: string): void {
  revalidateTag(CacheTags.squads(orgId));
}

export function invalidateSquad(squadId: string, orgId: string): void {
  revalidateTag(CacheTags.squad(squadId));
  revalidateTag(CacheTags.squads(orgId));
  revalidateTag(CacheTags.agents(squadId));
  revalidateTag(CacheTags.metrics(orgId));
}

export function invalidateAgents(squadId: string, orgId: string): void {
  revalidateTag(CacheTags.agents(squadId));
  revalidateTag(CacheTags.agentsByOrg(orgId));
  revalidateTag(CacheTags.squad(squadId));
  revalidateTag(CacheTags.squads(orgId));
  revalidateTag(CacheTags.metrics(orgId));
}

export function invalidateTasks(squadId: string, orgId: string): void {
  revalidateTag(CacheTags.tasks(squadId));
  revalidateTag(CacheTags.squads(orgId));
  revalidateTag(CacheTags.metrics(orgId));
}

export function invalidateExecutions(squadId: string, orgId: string): void {
  revalidateTag(CacheTags.executions(squadId));
  revalidateTag(CacheTags.metrics(orgId));
}

export function invalidateMetrics(orgId: string): void {
  revalidateTag(CacheTags.metrics(orgId));
}

// ---------------------------------------------------------------------------
// Re-export React cache for convenience
// ---------------------------------------------------------------------------

export { cache, unstable_cache };
