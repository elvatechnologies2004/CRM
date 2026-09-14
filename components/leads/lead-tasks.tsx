"use client";

import { CheckSquare, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { LeadTask, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

const priorityMeta: Record<TaskPriority, { label: string; variant: "danger" | "warning" | "secondary" }> = {
  high: { label: "High", variant: "danger" },
  medium: { label: "Medium", variant: "warning" },
  low: { label: "Low", variant: "secondary" },
};

interface LeadTasksProps {
  tasks: LeadTask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function LeadTasks({ tasks, onToggle, onDelete, onAdd }: LeadTasksProps) {
  const openCount = tasks.filter((task) => task.status === "Open").length;

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" aria-hidden />
          Tasks
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {openCount} open
          </span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <CheckSquare className="h-4 w-4 text-muted-foreground/60" aria-hidden />
            <p className="text-xs text-muted-foreground">
              No tasks yet. Add a task to keep follow-up on track.
            </p>
            <Button variant="outline" size="sm" className="mt-1" onClick={onAdd}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add Task
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const priority = priorityMeta[task.priority];
              const done = task.status === "Done";
              return (
                <li
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => onToggle(task.id)}
                    aria-label={`Mark "${task.title}" as ${done ? "open" : "done"}`}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "text-[13px] font-medium",
                          done ? "text-muted-foreground line-through" : "text-ink"
                        )}
                      >
                        {task.title}
                      </p>
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Due {formatDue(task.due)} · {task.owner}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    aria-label={`Delete task "${task.title}"`}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function formatDue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export { LeadTasks };