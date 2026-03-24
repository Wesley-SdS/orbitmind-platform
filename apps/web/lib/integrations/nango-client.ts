import { Nango } from "@nangohq/node";

let nangoInstance: Nango | null = null;

export function getNango(): Nango {
  if (!nangoInstance) {
    const secretKey = process.env.NANGO_SECRET_KEY;
    if (!secretKey) throw new Error("NANGO_SECRET_KEY is required");
    nangoInstance = new Nango({ secretKey });
  }
  return nangoInstance;
}

export async function createConnectSession(orgId: string): Promise<{ sessionToken: string }> {
  const nango = getNango();
  const response = await nango.createConnectSession({
    end_user: { id: orgId, display_name: orgId },
  });
  return { sessionToken: response.data.token };
}

export async function isIntegrationConnected(
  orgId: string,
  providerConfigKey: string,
): Promise<boolean> {
  try {
    const nango = getNango();
    const connection = await nango.getConnection(providerConfigKey, orgId);
    return !!connection;
  } catch {
    return false;
  }
}

export async function nangoRequest<T = unknown>(opts: {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string;
  providerConfigKey: string;
  connectionId: string;
  data?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}): Promise<T> {
  const nango = getNango();
  const baseOpts = {
    endpoint: opts.endpoint,
    providerConfigKey: opts.providerConfigKey,
    connectionId: opts.connectionId,
    params: opts.params,
    headers: opts.headers,
  };

  let response;
  switch (opts.method) {
    case "GET":
      response = await nango.get(baseOpts);
      break;
    case "POST":
      response = await nango.post({ ...baseOpts, data: opts.data });
      break;
    case "PUT":
      response = await nango.put({ ...baseOpts, data: opts.data });
      break;
    case "PATCH":
      response = await nango.patch({ ...baseOpts, data: opts.data });
      break;
    case "DELETE":
      response = await nango.delete(baseOpts);
      break;
  }

  return response.data as T;
}

export async function listConnections(orgId: string): Promise<Array<{ id: number; connection_id: string; provider_config_key: string }>> {
  const nango = getNango();
  const response = await nango.listConnections({ userId: orgId });
  return response.connections as unknown as Array<{ id: number; connection_id: string; provider_config_key: string }>;
}

// ──────────────────────────────────────────────
// Provider Catalog (700+ integracoes)
// ──────────────────────────────────────────────

export interface NangoProvider {
  name: string;
  displayName: string;
  logoUrl: string;
  authMode: string;
  categories: string[];
  docs: string;
}

/** Cache em memoria — revalidado a cada 1h */
let providerCache: { data: NangoProvider[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Busca TODOS os providers disponiveis no Nango (700+).
 * Usa cache em memoria com TTL de 1h.
 * Retorna fallback vazio se NANGO_SECRET_KEY nao estiver configurada.
 */
export async function fetchNangoProviders(): Promise<NangoProvider[]> {
  // Retorna cache se valido
  if (providerCache && Date.now() - providerCache.fetchedAt < CACHE_TTL_MS) {
    return providerCache.data;
  }

  try {
    const nango = getNango();
    const response = await nango.listProviders({});

    const providers: NangoProvider[] = response.data.map((p) => ({
      name: p.name,
      displayName: p.display_name ?? p.name,
      logoUrl: p.logo_url ?? "",
      authMode: p.auth_mode ?? "UNKNOWN",
      categories: (p as unknown as Record<string, unknown>).categories as string[] ?? [],
      docs: p.docs ?? "",
    }));

    providerCache = { data: providers, fetchedAt: Date.now() };
    return providers;
  } catch (error) {
    console.error("Falha ao buscar providers do Nango:", error);
    // Retorna cache expirado se existir, senao array vazio
    return providerCache?.data ?? [];
  }
}

/** Invalida o cache de providers */
export function invalidateProviderCache(): void {
  providerCache = null;
}
