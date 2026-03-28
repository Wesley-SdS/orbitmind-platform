"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
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
} from "@/components/ui/dialog";

interface SkillView {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  installed: boolean;
  isActive: boolean;
  dbId: string | null;
  requiredConfig: Array<{
    key: string;
    label: string;
    type: "text" | "password" | "url";
    placeholder: string;
    helpText: string;
  }>;
}

export function SkillsTab() {
  const [skills, setSkills] = useState<SkillView[]>([]);
  const [loading, setLoading] = useState(true);
  const [configSkill, setConfigSkill] = useState<SkillView | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; detail?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    const res = await fetch("/api/skills");
    if (res.ok) setSkills(await res.json());
    setLoading(false);
  }

  function openConfig(skill: SkillView) {
    setConfigSkill(skill);
    setConfigValues({});
    setTestResult(null);
  }

  async function handleTest() {
    if (!configSkill) return;
    setTesting(true);
    setTestResult(null);
    const res = await fetch(`/api/skills/${configSkill.id}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: configValues }),
    });
    setTestResult(await res.json());
    setTesting(false);
  }

  async function handleSave() {
    if (!configSkill) return;
    setSaving(true);

    // Separate config (public) from secrets (private)
    const secrets: Record<string, string> = {};
    const config: Record<string, string> = {};
    for (const field of configSkill.requiredConfig) {
      if (field.type === "password") {
        secrets[field.key] = configValues[field.key] ?? "";
      } else {
        config[field.key] = configValues[field.key] ?? "";
      }
    }

    if (configSkill.installed && configSkill.dbId) {
      await fetch(`/api/skills/${configSkill.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, secrets, isActive: true }),
      });
    } else {
      await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: configSkill.id, config, secrets }),
      });
    }

    await loadSkills();
    setConfigSkill(null);
    setSaving(false);
  }

  async function handleToggle(skill: SkillView) {
    if (!skill.dbId) return;
    await fetch(`/api/skills/${skill.dbId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !skill.isActive }),
    });
    await loadSkills();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Skills de Publicacao</h3>
        <p className="text-sm text-muted-foreground">
          Configure skills para publicar conteudo em redes sociais
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {skills.map((skill) => (
            <Card key={skill.id} className={skill.isActive ? "border-green-500/30" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <div>
                      <CardTitle className="text-sm">{skill.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{skill.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={skill.isActive ? "default" : "secondary"}>
                    {skill.isActive ? "Ativo" : skill.installed ? "Inativo" : "Nao configurado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                {skill.installed && (
                  <Switch checked={skill.isActive} onCheckedChange={() => handleToggle(skill)} />
                )}
                <Button variant="outline" size="sm" onClick={() => openConfig(skill)}>
                  {skill.installed ? "Reconfigurar" : "Configurar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Config Dialog */}
      <Dialog open={!!configSkill} onOpenChange={(open) => { if (!open) setConfigSkill(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{configSkill?.icon} Configurar {configSkill?.name}</DialogTitle>
            <DialogDescription>Configure as credenciais para ativar esta skill</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {configSkill?.requiredConfig.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type === "password" ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={configValues[field.key] ?? ""}
                  onChange={(e) => setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{field.helpText}</p>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Testar Conexão
              </Button>
              {testResult && (
                <span className={`text-xs ${testResult.ok ? "text-green-600" : "text-destructive"}`}>
                  {testResult.ok ? `Conectado: ${testResult.detail}` : testResult.detail || "Falhou"}
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={!testResult?.ok || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
