/**
 * GitHub Sync — bidirectional sync between OrbitMind tasks and GitHub issues/PRs.
 * Called after task status changes in the board.
 */

import { getIntegrationByType } from "@/lib/db/queries/integrations";
import { GitHubIntegration } from "./actions/github";

interface TaskLike {
  id: string;
  title: string;
  status: string;
  squadId: string;
  metadata: unknown;
}

/**
 * When a task status changes in OrbitMind, sync to GitHub:
 * - Task moved to "in_progress" + has issueNumber → add label "ready"
 * - Task moved to "done" + has issueNumber → close issue
 * - Task moved to "done" + has prNumber → (PR already handled by GitHub merge)
 */
export async function syncTaskStatusToGitHub(task: TaskLike, orgId: string): Promise<void> {
  const integration = await getIntegrationByType(orgId, "github");
  if (!integration || integration.status !== "active") return;

  const config = (integration.config as Record<string, unknown>) ?? {};
  const linkedSquadId = config.linkedSquadId as string | undefined;
  if (!linkedSquadId || linkedSquadId !== task.squadId) return;

  const owner = config.organization as string | undefined;
  const repo = config.repository as string | undefined;
  if (!owner || !repo) return;

  const metadata = (task.metadata ?? {}) as Record<string, unknown>;
  if (metadata.source !== "github") return;

  const github = new GitHubIntegration(orgId);
  const issueNumber = metadata.issueNumber as number | undefined;

  if (!issueNumber) return;

  try {
    if (task.status === "in_progress") {
      // Add "ready" label when task moves to in_progress
      await github.addLabels(owner, repo, issueNumber, ["ready"]);
    } else if (task.status === "done") {
      // Close the GitHub issue when task is done
      await github.closeIssue(owner, repo, issueNumber);
    }
  } catch (error) {
    console.error(`[github-sync] Failed to sync task ${task.id} to GitHub:`, error);
  }
}
