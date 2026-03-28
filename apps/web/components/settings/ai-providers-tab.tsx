"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Star, Check, Loader2, AlertCircle, ArrowLeft, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LlmProvider {
  id: string;
  provider: string;
  authMethod: string;
  label: string;
  defaultModel: string | null;
  isActive: boolean;
  isDefault: boolean;
  totalTokensUsed: number;
  totalCostCents: number;
  lastUsedAt: string | null;
  createdAt: string;
}

const PROVIDER_META: Record<string, { name: string; icon: string; color: string; models: string[] }> = {
  anthropic: { name: "Anthropic Claude", icon: "✦", color: "border-orange-500/30", models: ["Claude Opus", "Claude Sonnet", "Claude Haiku"] },
  openai: { name: "OpenAI", icon: "◈", color: "border-green-500/30", models: ["GPT-5.4", "o3 / o4-mini", "GPT-5.4 Mini"] },
  gemini: { name: "Google Gemini", icon: "◆", color: "border-blue-500/30", models: ["Gemini 3.1 Pro", "Gemini Flash", "Gemini 2.5 Pro"] },
};

const AUTH_LABELS: Record<string, string> = {
  oauth_token: "OAuth Token",
  api_key: "API Key",
};

interface ModelOption {
  id: string;
  name: string;
  tier: string;
  description: string;
}

const MODEL_OPTIONS: Record<string, ModelOption[]> = {
  anthropic: [
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", tier: "powerful", description: "Mais inteligente — raciocinio complexo e analise profunda" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", tier: "powerful", description: "Equilibrio ideal entre inteligencia e velocidade" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", tier: "fast", description: "Ultra rapido e economico" },
  ],
  openai: [
    { id: "gpt-5.4", name: "GPT-5.4", tier: "powerful", description: "Modelo mais avancado — raciocinio complexo e coding" },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", tier: "fast", description: "Rapido e economico com alta capacidade" },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", tier: "fast", description: "Ultra rapido — classificacao e autocompletar" },
    { id: "gpt-5.3", name: "GPT-5.3 Instant", tier: "powerful", description: "Conversacional e versatil" },
    { id: "o3", name: "o3", tier: "powerful", description: "Raciocinio avancado — STEM, math e coding" },
    { id: "o3-pro", name: "o3 Pro", tier: "powerful", description: "Raciocinio maximo — pensa mais antes de responder" },
    { id: "o4-mini", name: "o4 Mini", tier: "fast", description: "Raciocinio rapido e economico" },
  ],
  gemini: [
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", tier: "powerful", description: "Mais avancado — raciocinio e agentes" },
    { id: "gemini-3-flash", name: "Gemini 3 Flash", tier: "fast", description: "Rapido com inteligencia de proxima geracao" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", tier: "fast", description: "Ultra economico para alto volume" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tier: "powerful", description: "Producao estavel — raciocinio e coding" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "fast", description: "Producao estavel — rapido e confiavel" },
  ],
};

const CREDENTIAL_CONFIG: Record<string, Record<string, { placeholder: string; help: string }>> = {
  anthropic: {
    api_key: { placeholder: "sk-ant-...", help: "Crie em console.anthropic.com > API Keys" },
    oauth_token: { placeholder: "Cole seu OAuth token aqui...", help: "Obtenha via: claude config get oauth_token" },
  },
  openai: {
    api_key: { placeholder: "sk-...", help: "Crie em platform.openai.com > API Keys" },
  },
  gemini: {
    api_key: { placeholder: "AIza...", help: "Crie em aistudio.google.com > Get API Key" },
  },
};

const LABEL_PLACEHOLDERS: Record<string, Record<string, string>> = {
  anthropic: { api_key: "Ex: Anthropic Producao", oauth_token: "Ex: Meu Claude Max" },
  openai: { api_key: "Ex: OpenAI Empresa" },
  gemini: { api_key: "Ex: Google Gemini" },
};

export function AiProvidersTab() {
  const [providers, setProviders] = useState<LlmProvider[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [step, setStep] = useState<1 | 2>(1);
  const [formProvider, setFormProvider] = useState<string>("");
  const [formAuthMethod, setFormAuthMethod] = useState<string>("api_key");
  const [formCredential, setFormCredential] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    const res = await fetch("/api/llm-providers");
    if (res.ok) setProviders(await res.json());
    setLoading(false);
  }

  function resetForm() {
    setStep(1);
    setFormProvider("");
    setFormAuthMethod("api_key");
    setFormCredential("");
    setFormLabel("");
    setFormModel("");
    setFormIsDefault(false);
    setTestResult(null);
  }

  function selectProvider(provider: string) {
    setFormProvider(provider);
    setFormAuthMethod(provider === "anthropic" ? "oauth_token" : "api_key");
    setFormModel("");
    setTestResult(null);
    setStep(2);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/llm-providers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: formProvider, authMethod: formAuthMethod, credential: formCredential }),
    });
    setTestResult(await res.json());
    setTesting(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/llm-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: formProvider,
        authMethod: formAuthMethod,
        credential: formCredential,
        label: formLabel,
        defaultModel: formModel || undefined,
        isDefault: formIsDefault || providers.length === 0,
      }),
    });
    if (res.ok) {
      await loadProviders();
      setDialogOpen(false);
      resetForm();
    }
    setSaving(false);
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/llm-providers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) });
    await loadProviders();
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await fetch(`/api/llm-providers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    await loadProviders();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/llm-providers/${id}`, { method: "DELETE" });
    await loadProviders();
  }

  const credConfig = CREDENTIAL_CONFIG[formProvider]?.[formAuthMethod] ?? { placeholder: "", help: "" };
  const labelPlaceholder = LABEL_PLACEHOLDERS[formProvider]?.[formAuthMethod] ?? "Ex: Meu Provedor";
  const isFirstProvider = providers.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Provedores de IA</h3>
          <p className="text-sm text-muted-foreground">Configure seus provedores de IA para ativar os agentes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Provedor
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{step === 1 ? "Escolha o Provedor" : `Configurar ${PROVIDER_META[formProvider]?.name ?? ""}`}</DialogTitle>
              <DialogDescription>
                {step === 1
                  ? "Selecione qual provedor de IA você quer configurar"
                  : "Configure a credencial e modelo padrao"}
              </DialogDescription>
            </DialogHeader>

            {step === 1 ? (
              /* ===== STEP 1: Provider Selection ===== */
              <div className="grid grid-cols-3 gap-3 py-4">
                {(["anthropic", "openai", "gemini"] as const).map((prov) => {
                  const meta = PROVIDER_META[prov]!;
                  return (
                    <button
                      key={prov}
                      onClick={() => selectProvider(prov)}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border/50 p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent/50"
                    >
                      <span className="text-2xl">{meta.icon}</span>
                      <span className="text-sm font-medium">{meta.name}</span>
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        {meta.models.map((m) => <div key={m}>{m}</div>)}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {prov === "anthropic" ? "OAuth ou API Key" : "API Key"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* ===== STEP 2: Configuration ===== */
              <div className="space-y-4 py-4">
                {/* Auth method — only for Anthropic */}
                {formProvider === "anthropic" && (
                  <div className="space-y-2">
                    <Label>Metodo de autenticacao</Label>
                    <div className="flex gap-2">
                      {(["oauth_token", "api_key"] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => { setFormAuthMethod(method); setTestResult(null); setFormCredential(""); }}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            formAuthMethod === method
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                        >
                          {method === "oauth_token" ? "OAuth Token (Plano Max)" : "API Key"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Label */}
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    placeholder={labelPlaceholder}
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                  />
                </div>

                {/* Credential */}
                <div className="space-y-2">
                  <Label>{formAuthMethod === "oauth_token" ? "OAuth Token" : "API Key"}</Label>
                  <Input
                    type="password"
                    placeholder={credConfig.placeholder}
                    value={formCredential}
                    onChange={(e) => { setFormCredential(e.target.value); setTestResult(null); }}
                  />
                  <p className="text-xs text-muted-foreground">{credConfig.help}</p>
                </div>

                {/* Model selection — rich dropdown */}
                <div className="space-y-2">
                  <Label>Modelo padrao</Label>
                  <Select value={formModel} onValueChange={(v) => { if (v) setFormModel(v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Automatico por tier do agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {(MODEL_OPTIONS[formProvider] || []).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            {m.tier === "powerful" ? <Brain className="h-3 w-3 text-purple-500 shrink-0" /> : <Zap className="h-3 w-3 text-green-500 shrink-0" />}
                            <span>{m.name}</span>
                            <span className="text-muted-foreground text-xs ml-1">— {m.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Default checkbox */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formIsDefault || isFirstProvider}
                    onCheckedChange={isFirstProvider ? undefined : setFormIsDefault}
                    disabled={isFirstProvider}
                  />
                  <Label className={isFirstProvider ? "text-muted-foreground" : ""}>
                    Definir como padrão {isFirstProvider && "(automático — primeiro provedor)"}
                  </Label>
                </div>

                {/* Test button */}
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleTest} disabled={!formCredential || testing}>
                    {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Testar Conexão
                  </Button>
                  {testResult && (
                    <span className={`text-xs ${testResult.valid ? "text-green-600" : "text-destructive"}`}>
                      {testResult.valid ? "Conexão válida" : testResult.error || "Credencial inválida"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleSave} disabled={!formLabel || !formCredential || !testResult?.valid || saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== Provider List ===== */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : providers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Nenhum provedor configurado</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Configure seu Claude, OpenAI ou Gemini para ativar respostas dos agentes no chat.
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Configurar agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => {
            const meta = PROVIDER_META[p.provider] ?? PROVIDER_META.anthropic!;
            const modelName = MODEL_OPTIONS[p.provider]?.find((m) => m.id === p.defaultModel)?.name ?? p.defaultModel ?? "automatico";
            return (
              <Card key={p.id} className={p.isDefault ? meta.color : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg font-medium">
                        {meta.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          {p.label}
                          {p.isDefault && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Star className="h-3 w-3" />
                              Padrao
                            </Badge>
                          )}
                          <Badge variant={p.isActive ? "default" : "secondary"} className="text-[10px]">
                            {p.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {meta.name} · {modelName} · {AUTH_LABELS[p.authMethod] ?? p.authMethod}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={p.isActive} onCheckedChange={() => handleToggleActive(p.id, p.isActive)} />
                      {!p.isDefault && (
                        <Button variant="ghost" size="sm" onClick={() => handleSetDefault(p.id)} title="Definir como padrão">
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover provedor?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => handleDelete(p.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{(p.totalTokensUsed / 1000).toFixed(1)}k tokens</span>
                    <span>R$ {(p.totalCostCents / 100).toFixed(2)}</span>
                    {p.lastUsedAt && <span>Ultimo uso: {new Date(p.lastUsedAt).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
