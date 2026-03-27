import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createWebhookLog, markWebhookProcessed, getIntegrationByType } from "@/lib/db/queries/integrations";

/**
 * Webhook receiver para todas as integracoes.
 * Rota publica (definida em middleware.ts).
 * Recebe eventos de GitHub, Slack, Jira, Linear, etc.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ integrationId: string }> },
): Promise<Response> {
  try {
    const { integrationId } = await params;
    const rawBody = await req.text();

    // Verificar signature do GitHub (Fix 8)
    if (integrationId === "github") {
      const signature = req.headers.get("x-hub-signature-256");
      const orgId = resolveOrgId(integrationId, safeJsonParse(rawBody));
      if (orgId) {
        const integration = await getIntegrationByType(orgId, "github");
        const secret = (integration?.config as Record<string, unknown>)?.webhookSecret as string | undefined;
        if (secret && !verifyGitHubSignature(rawBody, signature, secret)) {
          return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
        }
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = detectEventType(integrationId, req.headers);
    const orgId = resolveOrgId(integrationId, payload);

    let webhookId: string | undefined;
    if (orgId) {
      const log = await createWebhookLog({
        orgId,
        integrationId,
        eventType,
        payload: payload as Record<string, unknown>,
      });
      webhookId = log.id;
    }

    // Processar webhook de forma assincrona
    processWebhookAsync(integrationId, eventType, payload, orgId, webhookId).catch(console.error);

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing error." }, { status: 500 });
  }
}

// ── Signature Verification (Fix 8) ──

function verifyGitHubSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const expected = `sha256=${hmac.digest("hex")}`;
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function safeJsonParse(str: string): unknown {
  try { return JSON.parse(str); } catch { return {}; }
}

function detectEventType(integrationId: string, headers: Headers): string {
  switch (integrationId) {
    case "github":
      return headers.get("x-github-event") ?? "unknown";
    case "gitlab":
      return headers.get("x-gitlab-event") ?? "unknown";
    case "slack":
      return "slack_event";
    case "jira":
      return headers.get("x-atlassian-webhook-identifier") ? "jira_event" : "unknown";
    case "linear":
      return "linear_event";
    default:
      return "generic_webhook";
  }
}

function resolveOrgId(_integrationId: string, payload: unknown): string | null {
  const p = payload as Record<string, unknown>;
  if (p.orbitmind_org_id && typeof p.orbitmind_org_id === "string") {
    return p.orbitmind_org_id;
  }
  return null;
}

async function processWebhookAsync(
  integrationId: string,
  eventType: string,
  payload: unknown,
  orgId: string | null,
  webhookId?: string,
): Promise<void> {
  try {
    switch (integrationId) {
      case "github":
        await processGitHubWebhook(eventType, payload, orgId);
        break;
      case "slack":
        await processSlackWebhook(payload);
        break;
      case "jira":
      case "linear":
        await processProjectManagementWebhook(integrationId, payload);
        break;
      default:
        break;
    }

    if (webhookId) {
      await markWebhookProcessed(webhookId);
    }
  } catch (error) {
    console.error(`[webhook] Error processing ${integrationId}/${eventType}:`, error);
  }
}

// ── GitHub Webhook Processing ──

interface GitHubWebhookPayload {
  action?: string;
  workflow_run?: {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    workflow_id: number;
    run_started_at: string;
    updated_at: string;
    html_url: string;
  };
  pull_request?: {
    number: number;
    title: string;
    state: string;
    merged: boolean;
    user: { login: string };
    html_url: string;
  };
  issue?: {
    number: number;
    title: string;
    body?: string;
    state: string;
    labels: Array<{ name: string }>;
    user: { login: string };
    html_url: string;
  };
  label?: { name: string };
  repository?: {
    name: string;
    full_name: string;
    owner: { login: string };
  };
}

async function processGitHubWebhook(eventType: string, payload: unknown, orgId: string | null): Promise<void> {
  const p = payload as GitHubWebhookPayload;

  switch (eventType) {
    case "workflow_run":
      await handleWorkflowRunEvent(p, orgId);
      break;
    case "pull_request":
      await handlePullRequestEvent(p, orgId);
      break;
    case "issues":
      await handleIssueEvent(p, orgId);
      break;
    case "push":
      // Log de atividade — broadcast via WebSocket
      if (orgId) {
        await broadcastToOrg(orgId, {
          type: "GITHUB_PUSH",
          data: {
            repository: p.repository?.full_name,
          },
        });
      }
      break;
  }
}

async function handleWorkflowRunEvent(p: GitHubWebhookPayload, orgId: string | null): Promise<void> {
  const run = p.workflow_run;
  if (!run) return;

  const agentName = inferAgentName(run.name);

  if (p.action === "requested" || p.action === "in_progress") {
    // Workflow started — broadcast agent working status
    if (orgId) {
      await broadcastToOrg(orgId, {
        type: "PIPELINE_AGENT_STATUS",
        data: {
          agentName,
          workflowId: run.workflow_id,
          status: "working",
          runId: run.id,
          runUrl: run.html_url,
        },
      });
    }
  } else if (p.action === "completed") {
    // Workflow completed — broadcast result
    if (orgId) {
      await broadcastToOrg(orgId, {
        type: "PIPELINE_AGENT_STATUS",
        data: {
          agentName,
          workflowId: run.workflow_id,
          status: run.conclusion === "success" ? "done" : "error",
          conclusion: run.conclusion,
          runId: run.id,
          runUrl: run.html_url,
          duration: run.run_started_at && run.updated_at
            ? Math.round((new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()) / 1000)
            : null,
        },
      });
    }
  }
}

async function handlePullRequestEvent(p: GitHubWebhookPayload, orgId: string | null): Promise<void> {
  const pr = p.pull_request;
  if (!pr || !orgId) return;

  // Fix 1: PR opened → criar task "Review PR #N" no board
  if (p.action === "opened") {
    const squadId = await getLinkedSquadId(orgId);
    if (squadId) {
      const { createTask } = await import("@/lib/db/queries/tasks");
      await createTask({
        squadId,
        title: `Review PR #${pr.number}: ${pr.title}`,
        description: `Pull request aberta por ${pr.user.login}.\n\nURL: ${pr.html_url}`,
        status: "in_review",
        type: "review",
        priority: "p1",
        metadata: { source: "github", prNumber: pr.number, prUrl: pr.html_url, prState: "open" },
      });
    }
    await broadcastToOrg(orgId, {
      type: "GITHUB_PR",
      data: { action: "opened", number: pr.number, title: pr.title, author: pr.user.login, url: pr.html_url, repository: p.repository?.full_name },
    });
  }

  // Fix 2: PR merged → mover task para "done"
  if (p.action === "closed" && pr.merged) {
    const squadId = await getLinkedSquadId(orgId);
    if (squadId) {
      const { getTasksBySquadId, updateTask } = await import("@/lib/db/queries/tasks");
      const tasks = await getTasksBySquadId(squadId);
      const match = tasks.find((t) =>
        (t.metadata as Record<string, unknown>)?.prNumber === pr.number
        || t.title.includes(`PR #${pr.number}`),
      );
      if (match) {
        await updateTask(match.id, {
          status: "done",
          metadata: { ...(match.metadata as Record<string, unknown>), prState: "merged" },
        });
      }
    }
    await broadcastToOrg(orgId, {
      type: "GITHUB_PR",
      data: { action: "merged", number: pr.number, title: pr.title, author: pr.user.login, url: pr.html_url, repository: p.repository?.full_name },
    });
  }
}

async function handleIssueEvent(p: GitHubWebhookPayload, orgId: string | null): Promise<void> {
  const issue = p.issue;
  if (!issue || !orgId) return;

  const labels = issue.labels.map((l) => l.name);

  // Fix 3: Issue labeled "ready" → criar task no board
  if (p.action === "labeled" && labels.includes("ready")) {
    const squadId = await getLinkedSquadId(orgId);
    if (squadId) {
      const { getTasksBySquadId, createTask } = await import("@/lib/db/queries/tasks");
      const tasks = await getTasksBySquadId(squadId);
      const alreadyExists = tasks.some((t) =>
        (t.metadata as Record<string, unknown>)?.issueNumber === issue.number,
      );
      if (!alreadyExists) {
        await createTask({
          squadId,
          title: issue.title,
          description: `Issue #${issue.number} — ${issue.html_url}\n\n${issue.body?.substring(0, 500) ?? ""}`,
          status: "ready",
          type: "feature",
          priority: "p1",
          metadata: { source: "github", issueNumber: issue.number, issueUrl: issue.html_url, labels },
        });
      }
    }
  }

  // Issue closed → mover task para done
  if (p.action === "closed") {
    const squadId = await getLinkedSquadId(orgId);
    if (squadId) {
      const { getTasksBySquadId, updateTask } = await import("@/lib/db/queries/tasks");
      const tasks = await getTasksBySquadId(squadId);
      const match = tasks.find((t) =>
        (t.metadata as Record<string, unknown>)?.issueNumber === issue.number,
      );
      if (match) {
        await updateTask(match.id, { status: "done" });
      }
    }
  }

  // Broadcast
  if (p.action === "opened" || p.action === "labeled") {
    await broadcastToOrg(orgId, {
      type: "GITHUB_ISSUE",
      data: { action: p.action, number: issue.number, title: issue.title, labels, author: issue.user.login, url: issue.html_url, repository: p.repository?.full_name },
    });
  }
}

/** Resolve linkedSquadId from GitHub integration config */
async function getLinkedSquadId(orgId: string): Promise<string | null> {
  const integration = await getIntegrationByType(orgId, "github");
  if (!integration) return null;
  return (integration.config as Record<string, unknown>)?.linkedSquadId as string | null ?? null;
}

function inferAgentName(workflowName: string): string {
  const n = workflowName.toLowerCase();
  if (n.includes("review")) return "Reviewer";
  if (n.includes("autofix")) return "Autofix";
  if (n.includes("architect")) return "Architect";
  if (n.includes("docs")) return "Docs";
  if (n.includes("qa")) return "QA";
  if (n.includes("ideator")) return "Ideator";
  if (n.includes("taskmaster")) return "Taskmaster";
  if (n.includes("designer")) return "Designer";
  if (n.includes("claude") || n.includes("implement")) return "Developer";
  if (n.includes("release")) return "Release";
  if (n.includes("rebase")) return "Rebase";
  return workflowName;
}

async function broadcastToOrg(orgId: string, message: { type: string; data: Record<string, unknown> }) {
  try {
    const { wsManager } = await import("@/lib/realtime/ws-manager");
    wsManager.broadcastToOrg(orgId, message as Parameters<typeof wsManager.broadcastToOrg>[1]);
  } catch {
    // WebSocket not available
  }
}

// ── Stubs for other integrations ──

async function processSlackWebhook(_payload: unknown): Promise<void> {
  // Slash commands, event callbacks, interactions
}

async function processProjectManagementWebhook(_integrationId: string, _payload: unknown): Promise<void> {
  // Sync bidirecional: issue_updated → atualizar task no board
}
