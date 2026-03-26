import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIntegrationById, updateIntegration } from "@/lib/db/queries";
import { getNango, listConnections } from "@/lib/integrations";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ integrationId: string }> },
): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const { integrationId } = await params;
    const integration = await getIntegrationById(integrationId);
    if (!integration) {
      console.log("[test] Integration not found in DB:", integrationId);
      return NextResponse.json({ error: "Integracao nao encontrada." }, { status: 404 });
    }

    console.log("[test] DB integration:", {
      id: integration.id,
      integrationId: integration.integrationId,
      status: integration.status,
      orgId: session.user.orgId,
    });

    // List ALL Nango connections for this org
    let connections: Array<{ id: number; connection_id: string; provider_config_key: string }> = [];
    try {
      connections = await listConnections(session.user.orgId);
      console.log("[test] Nango connections for org:", JSON.stringify(connections, null, 2));
    } catch (err) {
      console.error("[test] listConnections failed:", err);
      // Try without userId filter — list all connections
      try {
        const nango = getNango();
        const allConns = await nango.listConnections();
        console.log("[test] ALL Nango connections:", JSON.stringify(allConns.connections?.slice(0, 10), null, 2));
        connections = allConns.connections as unknown as typeof connections;
      } catch (err2) {
        console.error("[test] listConnections (all) failed:", err2);
      }
    }

    // Try to find matching connection
    // Nango Connect UI uses "provider_config_key" (e.g. "github-getting-started")
    // which differs from our integrationId (e.g. "github").
    // Match by: provider_config_key exact → provider_config_key contains → provider field
    const providerKey = integration.integrationId;
    type NangoConn = (typeof connections)[number] & { provider?: string };

    let match: NangoConn | undefined = (connections as NangoConn[]).find(
      (c) => c.provider_config_key === providerKey,
    );

    if (!match) {
      match = (connections as NangoConn[]).find(
        (c) => c.provider_config_key.includes(providerKey) || c.provider === providerKey,
      );
    }

    console.log("[test] Looking for:", providerKey);
    console.log("[test] Match:", match ? `YES (${match.provider_config_key})` : "NO");

    if (match) {
      // Get full connection details — includes credentials and metadata
      let accountInfo: { email?: string; name?: string; login?: string; avatar_url?: string } = {};
      try {
        const nango = getNango();
        const conn = await nango.getConnection(match.provider_config_key, match.connection_id);
        const connData = conn as Record<string, unknown>;
        console.log("[test] Connection keys:", Object.keys(connData));

        // Try extracting user info from various Nango connection fields
        // Nango stores different data depending on the provider
        const metadata = connData.metadata as Record<string, unknown> | undefined;
        const credentials = connData.credentials as Record<string, unknown> | undefined;
        const endUser = connData.end_user as Record<string, unknown> | undefined;

        console.log("[test] metadata:", JSON.stringify(metadata));
        console.log("[test] credentials keys:", credentials ? Object.keys(credentials) : "none");
        console.log("[test] end_user:", JSON.stringify(endUser));

        // For GitHub specifically, we can make an API call to get the user
        if (providerKey === "github" && credentials) {
          try {
            const token = credentials.access_token as string;
            if (token) {
              const ghResp = await fetch("https://api.github.com/user", {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
              });
              if (ghResp.ok) {
                const ghUser = await ghResp.json() as { login: string; name: string; email: string; avatar_url: string };
                accountInfo = {
                  login: ghUser.login,
                  name: ghUser.name,
                  email: ghUser.email,
                  avatar_url: ghUser.avatar_url,
                };
                console.log("[test] GitHub user:", ghUser.login);
              }
            }
          } catch {
            console.log("[test] GitHub API call failed");
          }
        }

        // Generic fallback from Nango metadata/endUser
        if (!accountInfo.login && !accountInfo.name && !accountInfo.email) {
          if (endUser) {
            accountInfo.name = endUser.display_name as string | undefined;
            accountInfo.email = endUser.email as string | undefined;
          }
          if (metadata) {
            accountInfo.login = metadata.login as string | undefined;
            accountInfo.name = accountInfo.name || (metadata.name as string | undefined);
            accountInfo.email = accountInfo.email || (metadata.email as string | undefined);
          }
        }
      } catch (err) {
        console.error("[test] getConnection failed:", err);
      }

      // Persist account info in DB so we don't need to re-test every time
      if (accountInfo.login || accountInfo.name || accountInfo.email) {
        try {
          const existingConfig = (integration.config as Record<string, unknown>) ?? {};
          await updateIntegration(integration.id, {
            config: { ...existingConfig, connectedAccount: accountInfo },
          });
        } catch {
          console.log("[test] Failed to persist account info");
        }
      }

      return NextResponse.json({
        connected: true,
        integrationId: integration.integrationId,
        connectionId: match.connection_id,
        status: "ok",
        account: accountInfo,
      });
    }

    console.log("[test] No matching connection found for", providerKey);
    return NextResponse.json({
      connected: false,
      integrationId: integration.integrationId,
      status: "disconnected",
      debug: {
        orgId: session.user.orgId,
        providerKey,
        availableProviders: connections.map((c) => c.provider_config_key),
        connectionCount: connections.length,
      },
    });
  } catch (error) {
    console.error("[test] Unexpected error:", error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : "Erro ao testar conexao",
    }, { status: 500 });
  }
}
