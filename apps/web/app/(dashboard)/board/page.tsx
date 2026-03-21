"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskDetailDialog } from "@/components/board/task-detail-dialog";
import { MOCK_TASKS, MOCK_AGENTS, MOCK_SQUADS } from "@/lib/mock-data";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  assignedAgentId?: string | null;
}

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const agents = MOCK_AGENTS.map((a) => ({ id: a.id, name: a.name, icon: a.icon }));
  const squad = MOCK_SQUADS[0]!;

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  }, []);

  const handleTaskMove = useCallback((taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
  }, []);

  const handleTaskUpdate = useCallback((taskId: string, data: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
    );
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, ...data } : prev));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Board</h1>
          <p className="text-sm text-muted-foreground">{squad.icon} {squad.name}</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Task
        </Button>
      </div>
      <KanbanBoard
        tasks={tasks}
        agents={agents}
        onTaskClick={handleTaskClick}
        onTaskMove={handleTaskMove}
      />
      <TaskDetailDialog
        task={selectedTask}
        agents={agents}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleTaskUpdate}
      />
    </div>
  );
}
