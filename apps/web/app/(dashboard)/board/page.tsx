"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskDetailDialog } from "@/components/board/task-detail-dialog";

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

interface Squad {
  id: string;
  name: string;
  icon: string | null;
}

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [squad, setSquad] = useState<Squad | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Load first squad
    fetch("/api/squads")
      .then((r) => r.json())
      .then((squads: Squad[]) => {
        const first = squads[0];
        if (!first) return;
        setSquad(first);

        // Load tasks and agents for this squad
        fetch(`/api/tasks?squadId=${first.id}`)
          .then((r) => r.json())
          .then((data) => setTasks(data));

        fetch(`/api/squads/${first.id}/agents`)
          .then((r) => r.json())
          .then((data: Agent[]) => setAgents(data.map((a) => ({ id: a.id, name: a.name, icon: a.icon }))));
      });
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  }, []);

  const handleTaskMove = useCallback((taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    // Persist to database
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }, []);

  const handleTaskUpdate = useCallback((taskId: string, data: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
    );
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, ...data } : prev));
    // Persist to database
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Board</h1>
          {squad && (
            <p className="text-sm text-muted-foreground">{squad.icon} {squad.name}</p>
          )}
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
