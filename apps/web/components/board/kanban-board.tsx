"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";

interface Task {
  id: string;
  title: string;
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

interface KanbanBoardProps {
  tasks: Task[];
  agents: Agent[];
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: "backlog", label: "Backlog", color: "bg-muted-foreground" },
  { id: "ready", label: "Ready", color: "bg-blue-500" },
  { id: "in_progress", label: "In Progress", color: "bg-yellow-500" },
  { id: "in_review", label: "In Review", color: "bg-purple-500" },
  { id: "done", label: "Done", color: "bg-green-500" },
];

export function KanbanBoard({ tasks, agents, onTaskClick, onTaskMove }: KanbanBoardProps) {
  const getAgent = (agentId?: string | null) =>
    agentId ? agents.find((a) => a.id === agentId) ?? null : null;

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData("taskId", taskId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, status: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId && onTaskMove) {
      onTaskMove(taskId, status);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/30 border border-border/50"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
              <div className={`h-2 w-2 rounded-full ${col.color}`} />
              <span className="text-sm font-medium">{col.label}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                {columnTasks.length}
              </Badge>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <TaskCard
                      task={task}
                      agent={getAgent(task.assignedAgentId)}
                      onClick={() => onTaskClick?.(task)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
