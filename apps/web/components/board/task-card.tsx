"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PRIORITY_LABELS } from "@orbitmind/shared";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    priority: string;
    type: string;
    assignedAgentId?: string | null;
  };
  agent?: { name: string; icon: string } | null;
  onClick?: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  p0: "bg-red-500/10 text-red-500 border-red-500/20",
  p1: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  p2: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  p3: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABEL: Record<string, string> = {
  feature: "Feature",
  fix: "Fix",
  content: "Content",
  research: "Research",
  review: "Review",
};

export function TaskCard({ task, agent, onClick }: TaskCardProps) {
  return (
    <Card
      className="cursor-pointer p-3 transition-all hover:shadow-md hover:border-primary/30"
      onClick={onClick}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium leading-tight">{task.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {TYPE_LABEL[task.type] ?? task.type}
          </Badge>
        </div>
        {agent && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-sm">{agent.icon}</span>
            <span className="text-xs text-muted-foreground">{agent.name}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
