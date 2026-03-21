"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITY_LABELS } from "@orbitmind/shared";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  assignedAgentId?: string | null;
}

interface Agent {
  id: string;
  name: string;
  icon: string;
}

interface TaskDetailDialogProps {
  task: Task | null;
  agents: Agent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (taskId: string, data: Partial<Task>) => void;
}

export function TaskDetailDialog({ task, agents, open, onOpenChange, onUpdate }: TaskDetailDialogProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input
              value={task.title}
              onChange={(e) => onUpdate?.(task.id, { title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              value={task.description ?? ""}
              onChange={(e) => onUpdate?.(task.id, { description: e.target.value })}
              rows={3}
              placeholder="Descricao da task..."
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={task.status}
                onValueChange={(v) => v && onUpdate?.(task.id, { status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => v && onUpdate?.(task.id, { priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={task.type}
                onValueChange={(v) => v && onUpdate?.(task.id, { type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="fix">Fix</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Agente atribuido</Label>
            <Select
              value={task.assignedAgentId ?? "unassigned"}
              onValueChange={(v) => v && onUpdate?.(task.id, { assignedAgentId: v === "unassigned" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Nenhum</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.icon} {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
