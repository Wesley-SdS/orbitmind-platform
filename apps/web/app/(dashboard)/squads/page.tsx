"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Bot, Users, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MOCK_SQUADS } from "@/lib/mock-data";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  paused: "secondary",
  archived: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

export default function SquadsPage() {
  const [squads] = useState(MOCK_SQUADS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Squads</h1>
          <p className="text-muted-foreground">Gerencie seus squads de agentes IA</p>
        </div>
        <Button render={<Link href="/squads/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Squad
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {squads.map((squad) => {
          const budgetUsed = 35;
          return (
            <Link key={squad.id} href={`/squads/${squad.id}`}>
              <Card className="transition-colors hover:border-primary/50 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{squad.icon}</span>
                      <div>
                        <CardTitle className="text-base">{squad.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{squad.code}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[squad.status]}>
                      {STATUS_LABEL[squad.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{squad.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {squad.agentCount} agentes
                    </div>
                    <div className="flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {squad.taskCount} tasks
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Budget</span>
                      <span>{budgetUsed}%</span>
                    </div>
                    <Progress value={budgetUsed} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
