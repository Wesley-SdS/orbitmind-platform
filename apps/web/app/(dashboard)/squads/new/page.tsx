"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Rocket, Code, Headphones, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const TEMPLATES = [
  {
    id: "marketing-agency",
    name: "Agencia de Marketing",
    description: "Squad completo de marketing digital com 7 agentes especializados e pipeline de 10 steps.",
    icon: "🚀",
    agents: 7,
    lucideIcon: Rocket,
  },
  {
    id: "dev-team",
    name: "Dev Team",
    description: "Squad de desenvolvimento com arquiteto, devs, reviewer e deployer.",
    icon: "💻",
    agents: 5,
    lucideIcon: Code,
  },
  {
    id: "support-team",
    name: "Suporte ao Cliente",
    description: "Squad de atendimento com triagem, respostas e escalacao automatica.",
    icon: "🎧",
    agents: 3,
    lucideIcon: Headphones,
  },
];

export default function NewSquadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🚀");
  const [loading, setLoading] = useState(false);

  function selectTemplate(id: string) {
    const t = TEMPLATES.find((t) => t.id === id);
    if (t) {
      setSelectedTemplate(id);
      setName(t.name);
      setDescription(t.description);
      setIcon(t.icon);
      setStep(2);
    }
  }

  async function handleCreate() {
    setLoading(true);
    const code = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const res = await fetch("/api/squads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        code,
        description,
        icon,
        templateId: selectedTemplate,
      }),
    });

    if (res.ok) {
      const squad = await res.json();
      router.push(`/squads/${squad.id}`);
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/squads" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Criar Squad</h1>
          <p className="text-sm text-muted-foreground">
            Passo {step} de 2 — {step === 1 ? "Escolha um template" : "Personalize"}
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-3">
          {TEMPLATES.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => selectTemplate(t.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {t.agents} agentes
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{t.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
          <Card
            className="cursor-pointer border-dashed transition-colors hover:border-primary/50"
            onClick={() => {
              setSelectedTemplate(null);
              setStep(2);
            }}
          >
            <CardHeader className="flex h-full items-center justify-center text-center">
              <CardTitle className="text-base text-muted-foreground">Do zero</CardTitle>
              <CardDescription>Crie um squad customizado</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalize seu Squad</CardTitle>
            <CardDescription>Ajuste nome, descricao e icon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-20 text-center text-2xl"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do squad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que este squad faz?"
                rows={3}
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleCreate} disabled={!name || loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Criar Squad
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
