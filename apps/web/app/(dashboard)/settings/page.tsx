"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const MOCK_MEMBERS = [
  { id: "u-1", name: "Admin OrbitMind", email: "admin@orbitmind.com", role: "owner", initials: "AO" },
  { id: "u-2", name: "Maria Silva", email: "maria@orbitmind.com", role: "admin", initials: "MS" },
  { id: "u-3", name: "Joao Santos", email: "joao@orbitmind.com", role: "member", initials: "JS" },
];

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

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("OrbitMind Demo");
  const [orgSlug, setOrgSlug] = useState("orbitmind-demo");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Gerencie sua organizacao e configuracoes</p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organizacao</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes da Organizacao</CardTitle>
              <CardDescription>Atualize os dados da sua organizacao</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} />
              </div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Acoes irreversiveis</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Organizacao
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acao nao pode ser desfeita. Todos os dados serao permanentemente deletados.
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
                <CardDescription>{MOCK_MEMBERS.length} membros na organizacao</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Convidar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_MEMBERS.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role] ?? User;
                  return (
                    <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Free", price: "R$ 0", squads: 1, agents: 3, executions: 100, current: false },
              { name: "Pro", price: "R$ 49/mes", squads: 5, agents: 15, executions: 1000, current: true },
              { name: "Enterprise", price: "R$ 199/mes", squads: "Ilimitado", agents: "Ilimitado", executions: 10000, current: false },
            ].map((plan) => (
              <Card key={plan.name} className={plan.current ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.current && <Badge>Atual</Badge>}
                  </div>
                  <p className="text-2xl font-bold">{plan.price}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{typeof plan.squads === "number" ? `${plan.squads} squad${plan.squads > 1 ? "s" : ""}` : plan.squads}</p>
                  <p>{typeof plan.agents === "number" ? `${plan.agents} agentes` : plan.agents}</p>
                  <p>{plan.executions.toLocaleString()} execucoes/mes</p>
                  <Separator className="my-3" />
                  {plan.current ? (
                    <Button variant="outline" className="w-full" disabled>Plano Atual</Button>
                  ) : (
                    <Button variant="outline" className="w-full">Upgrade</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uso do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Squads", used: 2, total: 5 },
                { label: "Agentes", used: 7, total: 15 },
                { label: "Execucoes", used: 28, total: 1000 },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.used}/{item.total}</span>
                  </div>
                  <Progress value={(item.used / item.total) * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Historico de acoes da organizacao</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { action: "squad.created", actor: "Admin OrbitMind", target: "Marketing Agency", time: "2026-03-21 10:00" },
                  { action: "agent.started", actor: "Ana Insights", target: "Pesquisa Q2", time: "2026-03-21 10:01" },
                  { action: "task.completed", actor: "Carlos Copy", target: "Post LinkedIn", time: "2026-03-21 10:05" },
                  { action: "pipeline.checkpoint", actor: "System", target: "Aprovacao publicacao", time: "2026-03-21 10:08" },
                  { action: "budget.warning", actor: "System", target: "Carlos Copy - 80%", time: "2026-03-21 10:10" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-3 rounded border p-3 text-sm">
                    <Badge variant="outline" className="shrink-0 text-[10px]">{log.action}</Badge>
                    <span className="flex-1">{log.actor} &rarr; {log.target}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
