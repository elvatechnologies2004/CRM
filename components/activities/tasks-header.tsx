"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TasksHeaderProps {
  onAddTask: () => void;
}

function TasksHeader({ onAddTask }: TasksHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan, assign and track sales activities.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAddTask}>
          <Plus className="h-4 w-4" aria-hidden />
          New Task
        </Button>
      </div>
    </div>
  );
}

export { TasksHeader };