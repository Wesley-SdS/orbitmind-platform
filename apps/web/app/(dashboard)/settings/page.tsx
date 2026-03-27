"use client";

import { useState, useEffect } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import { Trash2, Plus, Shield, Crown, User, Eye } from "lucide-react";
import { AiProvidersTab } from "@/components/settings/ai-providers-tab";
import { SkillsTab } from "@/components/settings/skills-tab";

interface OrgData {
  name: string;
  slug: string;
  plan: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actorType: string;
  actorId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Membro",
  viewer: "Viewer",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgData>({ name: "", slug: "", plan: "free" });
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/organizations")
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setOrg({ name: data.name ?? "", slug: data.slug ?? "", plan: data.plan ?? "free" });
          }
        }),
      fetch("/api/users")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setMembers(data);
        }),
      fetch("/api/audit-logs?limit=10")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setAuditLogs(data);
        }),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: org.name, slug: org.slug }),
    });
    setSaving(false);
  }

  const currentPlan = org.plan;

  if (loading) return <PageLoader text="Carregando configurações..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Gerencie sua organização e configurações</p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organização</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger id="tour-ai-providers" value="ai-providers">Provedores de IA</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Organização</CardTitle>
              <CardDescription>Atualize os dados da sua organização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={org.name} onChange={(e) => setOrg((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={org.slug} onChange={(e) => setOrg((p) => ({ ...p, slug: e.target.value }))} />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Ações irreversíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Organização
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os dados serão permanentemente deletados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Membros</CardTitle>
                <CardDescription>{members.length} membros na organização</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Convidar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role] ?? User;
                  return (
                    <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {ROLE_LABELS[member.role] ?? member.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-providers" className="mt-6">
          <AiProvidersTab />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsTab />
        </TabsContent>

        <TabsContent value="plan" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Free", price: "R$ 0", squads: 1, agents: 3, executions: 100 },
              { name: "Pro", price: "R$ 49/mês", squads: 5, agents: 15, executions: 1000 },
              { name: "Enterprise", price: "R$ 199/mês", squads: "Ilimitado", agents: "Ilimitado", executions: 10000 },
            ].map((plan) => {
              const isCurrent = plan.name.toLowerCase() === currentPlan;
              return (
                <Card key={plan.name} className={isCurrent ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {isCurrent && <Badge>Atual</Badge>}
                    </div>
                    <p className="text-2xl font-bold">{plan.price}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{typeof plan.squads === "number" ? `${plan.squads} squad${plan.squads > 1 ? "s" : ""}` : plan.squads}</p>
                    <p>{typeof plan.agents === "number" ? `${plan.agents} agentes` : plan.agents}</p>
                    <p>{plan.executions.toLocaleString()} execuções/mês</p>
                    <Separator className="my-3" />
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>Plano Atual</Button>
                    ) : (
                      <Button variant="outline" className="w-full">Upgrade</Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Histórico de ações da organização</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 rounded border p-3 text-sm">
                    <Badge variant="outline" className="shrink-0 text-[10px]">{log.action}</Badge>
                    <span className="flex-1">
                      {log.actorType}:{log.actorId.slice(0, 8)}
                      {(() => {
                        const meta = log.metadata as Record<string, string> | null;
                        if (meta?.taskTitle) return ` \u2192 ${meta.taskTitle}`;
                        if (meta?.squadName) return ` \u2192 ${meta.squadName}`;
                        return null;
                      })()}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum log de auditoria</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
