"use client";

import { useState } from "react";
import { Github, MessageCircle, Send, Hash, Slack, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "connected" | "disconnected";
  details: string | null;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Sincronize issues, PRs e webhooks com seus squads. Code review automatizado.",
    icon: Github,
    status: "connected" as const,
    details: "3 repos conectados",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Notificacoes de tasks, checkpoints e budget via webhooks do Discord.",
    icon: MessageCircle,
    status: "connected" as const,
    details: "2 canais configurados",
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Alertas e notificacoes diretamente no Telegram via Bot API.",
    icon: Send,
    status: "disconnected" as const,
    details: null,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Integre squads com canais do Slack para comunicacao em tempo real.",
    icon: Hash,
    status: "disconnected" as const,
    details: null,
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "Conecte repos do GitLab para pipelines CI/CD integrados.",
    icon: ExternalLink,
    status: "disconnected" as const,
    details: null,
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integracoes</h1>
        <p className="text-muted-foreground">Conecte servicos externos ao seu workspace</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <integration.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    {integration.details && (
                      <p className="text-xs text-muted-foreground mt-0.5">{integration.details}</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={integration.status === "connected" ? "default" : "secondary"}
                >
                  {integration.status === "connected" ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{integration.description}</CardDescription>
              <div className="flex items-center justify-between">
                <Switch
                  checked={integration.status === "connected"}
                  onCheckedChange={(checked) => {
                    setIntegrations((prev) =>
                      prev.map((i) =>
                        i.id === integration.id
                          ? { ...i, status: checked ? "connected" as const : "disconnected" as const }
                          : i,
                      ),
                    );
                  }}
                />
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
