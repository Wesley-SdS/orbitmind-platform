"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Check, GitBranch, Building2, User, FolderGit2, Zap, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface GitHubOrg {
  login: string;
  avatar_url: string;
  type: "user" | "org";
}

interface GitHubRepo {
  name: string;
  full_name: string;
  private: boolean;
  default_branch?: string;
}

interface ImportedAgentSummary {
  name: string;
  displayName: string;
  role: string;
  state: string;
  skillPath: string;
}

interface ImportResult {
  agents: ImportedAgentSummary[];
  summary: {
    total: number;
    active: number;
    withSkillFile: number;
    withLastRun: number;
  };
}

interface GitHubConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  currentConfig?: Record<string, unknown>;
}

type Step = "select-org" | "select-repo" | "detect-pipeline" | "done";

export function GitHubConfigDialog({ open, onClose, onImported, currentConfig }: GitHubConfigDialogProps) {
  const [step, setStep] = useState<Step>("select-org");
  const [loading, setLoading] = useState(false);

  // Step 1
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");

  // Step 2
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [branch, setBranch] = useState("main");

  // Step 3
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  // Load existing config
  useEffect(() => {
    if (currentConfig?.organization) {
      setSelectedOrg(currentConfig.organization as string);
    }
    if (currentConfig?.repository) {
      setSelectedRepo(currentConfig.repository as string);
    }
    if (currentConfig?.branch) {
      setBranch(currentConfig.branch as string);
    }
  }, [currentConfig]);

  // Load organizations
  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/integrations/github/orgs");
      if (resp.ok) {
        const data = await resp.json();
        setOrgs(data);
      }
    } catch (e) {
      console.error("Failed to load orgs:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadOrgs();
  }, [open, loadOrgs]);

  // Load repos when org changes
  useEffect(() => {
    if (!selectedOrg) return;
    setLoading(true);
    fetch(`/api/integrations/github/repos?org=${encodeURIComponent(selectedOrg)}`)
      .then((r) => r.json())
      .then((data) => {
        setRepos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedOrg]);

  async function handleDetectPipeline() {
    if (!selectedOrg || !selectedRepo) return;
    setImporting(true);
    setStep("detect-pipeline");
    try {
      const resp = await fetch("/api/integrations/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization: selectedOrg, repository: selectedRepo, branch }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setImportResult(data);
      } else {
        setImportResult(null);
      }
    } catch {
      setImportResult(null);
    } finally {
      setImporting(false);
    }
  }

  function handleDone() {
    setStep("done");
    onImported();
    onClose();
  }

  const roleIcons: Record<string, string> = {
    developer: "🔧", reviewer: "🔍", autofix: "🔄", architect: "🏛️",
    designer: "🎨", docs: "📝", ideator: "💡", taskmaster: "📋",
    qa: "🧪", release: "🚀", rebase: "🔀", "project-sync": "📌",
    general: "⚙️",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar GitHub</DialogTitle>
          <DialogDescription>
            Selecione a organizacao e repositorio para conectar a esteira de desenvolvimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Select Organization */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Organizacao GitHub</label>
            {loading && orgs.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <Select value={selectedOrg} onValueChange={(v) => { setSelectedOrg(v ?? ""); setSelectedRepo(""); setImportResult(null); setStep("select-org"); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a organizacao" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((org) => (
                    <SelectItem key={org.login} value={org.login}>
                      <div className="flex items-center gap-2">
                        {org.type === "user" ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        {org.login}
                        {org.type === "user" && <Badge variant="outline" className="text-[10px] ml-1">pessoal</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Step 2: Select Repository */}
          {selectedOrg && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Repositorio</label>
              {loading && repos.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando repos...
                </div>
              ) : (
                <Select value={selectedRepo} onValueChange={(v) => { setSelectedRepo(v ?? ""); setImportResult(null); setStep("select-repo"); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o repositorio" />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.name} value={repo.name}>
                        <div className="flex items-center gap-2">
                          <FolderGit2 className="h-4 w-4" />
                          {repo.name}
                          {repo.private && <Badge variant="outline" className="text-[10px]">privado</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedRepo && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>Branch padrao: {branch}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2.5: Detect Pipeline button */}
          {selectedOrg && selectedRepo && step !== "detect-pipeline" && !importResult && (
            <Button onClick={handleDetectPipeline} className="w-full" disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Detectar esteira no repositorio
            </Button>
          )}

          {/* Step 3: Pipeline Detection Results */}
          {importing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analisando workflows e skill files...
            </div>
          )}

          {importResult && (
            <div className="space-y-3">
              {importResult.summary.total > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-green-500">
                    <Zap className="h-4 w-4" />
                    Esteira detectada! {importResult.summary.total} workflows encontrados
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-auto">
                    {importResult.agents.map((agent) => (
                      <div
                        key={agent.name}
                        className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2 text-sm"
                      >
                        <span className={agent.state === "active" ? "text-green-500" : "text-muted-foreground"}>
                          {agent.state === "active" ? "●" : "○"}
                        </span>
                        <span>{roleIcons[agent.role] ?? "⚙️"}</span>
                        <span className="font-medium flex-1">{agent.displayName}</span>
                        <Badge variant="outline" className="text-[10px]">{agent.role}</Badge>
                        {agent.skillPath && <Check className="h-3.5 w-3.5 text-green-500" />}
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {importResult.summary.active} ativos · {importResult.summary.withSkillFile} com skill file · {importResult.summary.withLastRun} com historico de runs
                  </div>

                  <Button onClick={handleDone} className="w-full">
                    <Check className="h-4 w-4 mr-2" /> Importar como squad
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground py-2">
                    Nenhum workflow encontrado neste repositorio.
                  </div>
                  <Button variant="outline" onClick={handleDone} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Criar esteira nova neste repo
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
