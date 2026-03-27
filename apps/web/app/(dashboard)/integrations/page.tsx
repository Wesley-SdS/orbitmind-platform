"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, ExternalLink, Check, Settings2, Zap, Link2, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { PremiumIntegration } from "@/lib/integrations/types";
import { CATEGORY_LABELS, type IntegrationCategory } from "@/lib/integrations/types";
import { GitHubConfigDialog } from "@/components/integrations/github-config-dialog";

interface OrgIntegration {
  id: string;
  integrationId: string;
  tier: string;
  status: string;
  config: Record<string, unknown>;
  enabledCapabilities: string[];
  connectedAt: string | null;
}

interface DynamicProvider {
  id: string;
  displayName: string;
  logoUrl: string;
  authMode: string;
  category: string;
  docs: string;
}

interface GenericCategory {
  category: string;
  providers: DynamicProvider[];
}

interface CatalogData {
  premium: PremiumIntegration[];
  premiumTotal: number;
  generic: GenericCategory[];
  genericTotal: number;
  totalAvailable: number;
  source: "nango-api" | "static-fallback";
}

export default function IntegrationsPage() {
  const [orgIntegrations, setOrgIntegrations] = useState<OrgIntegration[]>([]);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedGeneric, setExpandedGeneric] = useState(false);
  const [configModal, setConfigModal] = useState<PremiumIntegration | null>(null);
  const [configOrgIntegration, setConfigOrgIntegration] = useState<OrgIntegration | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [githubConfigOpen, setGithubConfigOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [intResp, catResp] = await Promise.all([
      fetch("/api/integrations").then((r) => r.json()),
      fetch("/api/integrations/catalog").then((r) => r.json()),
    ]);
    setOrgIntegrations(intResp);
    setCatalog(catResp);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getOrgIntegration = (integrationId: string) =>
    orgIntegrations.find((i) => i.integrationId === integrationId);

  const isConnected = (integrationId: string) => {
    const org = getOrgIntegration(integrationId);
    return org?.status === "active";
  };

  async function handleConnect(integrationId: string, tier: "premium" | "generic") {
    setConnectingId(integrationId);
    try {
      // Criar session Nango
      const resp = await fetch("/api/integrations/connect", { method: "POST" });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Falha ao conectar" }));
        alert(err.error ?? "Erro ao criar sessão de conexão. Verifique se NANGO_SECRET_KEY está configurada.");
        return;
      }

      const { sessionToken } = await resp.json();
      if (!sessionToken) {
        alert("Sessão de conexão inválida. Verifique as configurações do Nango.");
        return;
      }

      if (typeof window !== "undefined") {
        // Importar Nango frontend dinamicamente (default export)
        const NangoFrontend = (await import("@nangohq/frontend")).default;
        const nango = new NangoFrontend({ connectSessionToken: sessionToken });

        nango.openConnectUI({
          onEvent: async (event) => {
            if (event.type === "connect") {
              // Salvar no banco apenas apos OAuth completar
              const saveResp = await fetch("/api/integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  integrationId,
                  tier,
                  status: "active",
                  connectedAt: new Date().toISOString(),
                }),
              });
              if (saveResp.ok) {
                await loadData();
              }
            }
          },
        });
      }
    } catch (error) {
      console.error("Connect error:", error);
      alert("Erro ao conectar integração. Tente novamente.");
    } finally {
      setConnectingId(null);
    }
  }

  async function handleDisconnect(id: string) {
    await fetch(`/api/integrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "disconnected" }),
    });
    await loadData();
  }

  async function handleSaveConfig(id: string, enabledCapabilities: string[]) {
    await fetch(`/api/integrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabledCapabilities }),
    });
    setConfigModal(null);
    await loadData();
  }

  if (loading || !catalog) {
    return <PageLoader text="Carregando integrações..." />;
  }

  const filteredPremium = catalog.premium.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (showConnectedOnly && !isConnected(i.id)) return false;
    if (selectedCategory && i.category !== selectedCategory) return false;
    return true;
  });

  const filteredGeneric = catalog.generic.map((cat) => ({
    ...cat,
    providers: cat.providers.filter((p) => {
      if (search && !p.displayName.toLowerCase().includes(search.toLowerCase()) && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (showConnectedOnly && !isConnected(p.id)) return false;
      return true;
    }),
  })).filter((cat) => cat.providers.length > 0);

  const categories = [...new Set(catalog.premium.map((i) => i.category))] as IntegrationCategory[];
  const connectedCount = orgIntegrations.filter((i) => i.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">
          {connectedCount} conectadas de {catalog.totalAvailable}+ disponíveis via Nango
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar integração..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showConnectedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowConnectedOnly(!showConnectedOnly)}
          >
            {showConnectedOnly ? "Conectados" : "Todos"}
          </Button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            {CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      {/* Premium Integrations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Integrações Premium ({filteredPremium.length})</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Actions customizadas profundas com configuração específica
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPremium.map((integration) => {
            const orgInt = getOrgIntegration(integration.id);
            const connected = orgInt?.status === "active";

            return (
              <Card key={integration.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Link2 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[integration.category]}</p>
                      </div>
                    </div>
                    <Badge variant={connected ? "default" : "secondary"} className={connected ? "bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-600/30" : ""}>
                      {connected ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm">{integration.description}</CardDescription>

                  <div className="flex flex-wrap gap-1">
                    {integration.capabilities.slice(0, 3).map((cap) => (
                      <Badge key={cap.id} variant="outline" className="text-xs">
                        {cap.name}
                      </Badge>
                    ))}
                    {integration.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{integration.capabilities.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {connected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (integration.id === "github") {
                              setGithubConfigOpen(true);
                            } else {
                              setConfigModal(integration);
                              setConfigOrgIntegration(orgInt ?? null);
                            }
                          }}
                        >
                          <Settings2 className="h-4 w-4 mr-1" /> Configurar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => orgInt && handleDisconnect(orgInt.id)}
                        >
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={connectingId === integration.id}
                        onClick={() => handleConnect(integration.id, "premium")}
                      >
                        {connectingId === integration.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-1" />
                        )}
                        Conectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Generic Integrations (700+ via Nango API) */}
      {!selectedCategory && (
        <div>
          <div
            className="flex items-center gap-2 mb-4 cursor-pointer"
            onClick={() => setExpandedGeneric(!expandedGeneric)}
          >
            <Link2 className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">
              Todas as Integrações ({catalog.genericTotal}+)
            </h2>
            {catalog.source === "nango-api" && (
              <Badge variant="outline" className="text-xs">via Nango API</Badge>
            )}
            {expandedGeneric ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Conecte qualquer API via OAuth — autenticação gerenciada pelo Nango
          </p>

          {expandedGeneric && (
            <div className="space-y-6">
              {filteredGeneric.map((cat) => (
                <div key={cat.category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {cat.category} ({cat.providers.length})
                  </h3>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {cat.providers.map((provider) => {
                      const connected = isConnected(provider.id);
                      return (
                        <Card key={provider.id} className="p-3">
                          <div className="flex items-center gap-2">
                            {provider.logoUrl ? (
                              <img
                                src={provider.logoUrl}
                                alt={provider.displayName}
                                className="h-5 w-5 rounded object-contain flex-shrink-0"
                              />
                            ) : (
                              <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium truncate flex-1" title={provider.displayName}>
                              {provider.displayName}
                            </span>
                            {connected ? (
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs flex-shrink-0"
                                disabled={connectingId === provider.id}
                                onClick={() => handleConnect(provider.id, "generic")}
                              >
                                {connectingId === provider.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Conectar"
                                )}
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Config Modal */}
      {configModal && (
        <ConfigDialog
          integration={configModal}
          orgIntegration={configOrgIntegration}
          onClose={() => setConfigModal(null)}
          onSave={handleSaveConfig}
          onRefresh={loadData}
        />
      )}

      {/* GitHub Config Dialog */}
      <GitHubConfigDialog
        open={githubConfigOpen}
        onClose={() => setGithubConfigOpen(false)}
        onImported={() => { setGithubConfigOpen(false); loadData(); }}
        currentConfig={(getOrgIntegration("github")?.config as Record<string, unknown>) ?? {}}
      />
    </div>
  );
}

function ConfigDialog({
  integration,
  orgIntegration,
  onClose,
  onSave,
  onRefresh,
}: {
  integration: PremiumIntegration;
  orgIntegration: OrgIntegration | null;
  onClose: () => void;
  onSave: (id: string, capabilities: string[]) => void;
  onRefresh: () => Promise<void>;
}) {
  const [enabledCaps, setEnabledCaps] = useState<Set<string>>(
    new Set(orgIntegration?.enabledCapabilities ?? integration.capabilities.map((c) => c.id)),
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; account?: { email?: string; name?: string; login?: string; avatar_url?: string }; debug?: unknown } | null>(null);

  // Read saved account from config (persisted from previous test)
  const savedAccount = (orgIntegration?.config as Record<string, unknown> | undefined)?.connectedAccount as
    { login?: string; name?: string; email?: string; avatar_url?: string } | undefined;

  // The account to display: test result takes priority, fallback to saved
  const displayAccount = testResult?.ok ? testResult.account : savedAccount;

  async function handleTest() {
    if (!orgIntegration) return;
    setTesting(true);
    setTestResult(null);
    try {
      const resp = await fetch(`/api/integrations/${orgIntegration.id}/test`, { method: "POST" });
      const data = await resp.json();
      console.log("[integrations] test result:", data);
      if (data.connected) {
        const acct = data.account;
        const label = acct?.login || acct?.name || acct?.email || "";
        setTestResult({
          ok: true,
          message: label ? `Conectado como ${label}` : "Conexão OK",
          account: acct,
        });
        // Refresh parent data so account info is persisted in state
        await onRefresh();
      } else {
        setTestResult({
          ok: false,
          message: data.error || "Nenhuma conexão encontrada no Nango",
          debug: data.debug,
        });
      }
    } catch {
      setTestResult({ ok: false, message: "Erro ao testar" });
    } finally {
      setTesting(false);
    }
  }

  function toggleCapability(capId: string) {
    const next = new Set(enabledCaps);
    if (next.has(capId)) next.delete(capId);
    else next.add(capId);
    setEnabledCaps(next);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar {integration.name}</DialogTitle>
          <DialogDescription>{integration.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Capabilities */}
          <div>
            <h4 className="text-sm font-medium mb-2">Capabilities ativas</h4>
            <div className="space-y-2">
              {integration.capabilities.map((cap) => (
                <label key={cap.id} className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={enabledCaps.has(cap.id)}
                    onCheckedChange={() => toggleCapability(cap.id)}
                  />
                  <div>
                    <span className="text-sm font-medium">{cap.name}</span>
                    <p className="text-xs text-muted-foreground">{cap.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Test + Save */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !orgIntegration}>
              {testing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Testar Conexão
            </Button>
            {testResult && (
              <span className={`text-xs ${testResult.ok ? "text-green-500" : "text-red-500"}`}>
                {testResult.message}
              </span>
            )}
          </div>

          {/* Connected account info — shows saved data instantly, updated on test */}
          {(orgIntegration?.connectedAt || displayAccount) && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
              {displayAccount && (displayAccount.login || displayAccount.name || displayAccount.email) && (
                <div className="flex items-center gap-2">
                  {displayAccount.avatar_url && (
                    <img src={displayAccount.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                  )}
                  <div>
                    {displayAccount.login && <p className="text-sm font-medium">{displayAccount.login}</p>}
                    {displayAccount.name && displayAccount.name !== displayAccount.login && (
                      <p className="text-xs text-muted-foreground">{displayAccount.name}</p>
                    )}
                    {displayAccount.email && (
                      <p className="text-xs text-muted-foreground">{displayAccount.email}</p>
                    )}
                  </div>
                </div>
              )}
              {orgIntegration?.connectedAt && (
                <p className="text-xs text-muted-foreground">
                  Conectado em {new Date(orgIntegration.connectedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {testResult !== null && !testResult.ok && testResult.debug != null && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Debug info</summary>
                  <pre className="mt-1 text-[10px] overflow-auto max-h-24">{JSON.stringify(testResult.debug as Record<string, unknown>, null, 2)}</pre>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => orgIntegration && onSave(orgIntegration.id, [...enabledCaps])}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
