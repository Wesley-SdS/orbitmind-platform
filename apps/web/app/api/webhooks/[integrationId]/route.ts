import { NextResponse } from "next/server";
import { createWebhookLog } from "@/lib/db/queries/integrations";

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
    const payload = await req.json();

    // Detectar tipo de evento baseado nos headers
    const eventType = detectEventType(integrationId, req.headers);

    // Log do webhook (orgId sera resolvido pelo processamento async)
    // Para webhooks, o orgId precisa vir do payload ou ser resolvido via connectionId
    const orgId = resolveOrgId(integrationId, payload);

    if (orgId) {
      await createWebhookLog({
        orgId,
        integrationId,
        eventType,
        payload: payload as Record<string, unknown>,
      });
    }

    // Processar webhook de forma assincrona
    processWebhookAsync(integrationId, eventType, payload).catch(console.error);

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing error." }, { status: 500 });
  }
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

function resolveOrgId(integrationId: string, payload: unknown): string | null {
  // Em producao, resolver orgId via:
  // 1. Buscar nango connection pelo installation_id/team_id
  // 2. Mapear para orgId no banco
  // Por enquanto, extrair de metadata se disponivel
  const p = payload as Record<string, unknown>;
  if (p.orbitmind_org_id && typeof p.orbitmind_org_id === "string") {
    return p.orbitmind_org_id;
  }
  return null;
}

async function processWebhookAsync(
  integrationId: string,
  eventType: string,
  _payload: unknown,
): Promise<void> {
  switch (integrationId) {
    case "github":
      await processGitHubWebhook(eventType, _payload);
      break;
    case "slack":
      await processSlackWebhook(_payload);
      break;
    case "jira":
    case "linear":
      await processProjectManagementWebhook(integrationId, _payload);
      break;
    default:
      // Log generico — sem processamento especial
      break;
  }
}

async function processGitHubWebhook(eventType: string, _payload: unknown): Promise<void> {
  switch (eventType) {
    case "pull_request":
      // PR opened/merged/closed → criar/atualizar task no board
      break;
    case "issues":
      // Issue opened → potencial task
      break;
    case "push":
      // Log de atividade
      break;
  }
}

async function processSlackWebhook(_payload: unknown): Promise<void> {
  // Slash commands, event callbacks, interactions
}

async function processProjectManagementWebhook(_integrationId: string, _payload: unknown): Promise<void> {
  // Sync bidirecional: issue_updated → atualizar task no board
}
