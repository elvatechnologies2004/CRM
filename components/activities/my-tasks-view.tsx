"use client";

import {
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  Video,
  type LucideIcon,
} from "lucide-react";

import { PanelCard } from "@/components/crm/panel";
import { PriorityBadge, StatusBadge } from "@/components/crm/status-badges";
import { Button } from "@/components/ui/button";
import { toDayLabel } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CrmTask } from "@/lib/types";

const typeIcons: Record<string, LucideIcon> = {
  Call: Phone,
  Email: Mail,
  WhatsApp: MessageCircle,
  Meeting: Video,
};

interface MyTasksViewProps {
  tasks: CrmTask[];
  currentUser: string;
  onComplete: (task: CrmTask) => void;
  onEdit: (task: CrmTask) => void;
  onAddTask: () => void;
}

function MyTasksView({ tasks, currentUser, onComplete, onEdit, onAddTask }: MyTasksViewProps) {
  const mine = tasks.filter(
    (task) => task.ownerName === currentUser && task.status !== "Cancelled"
  );
  const open = mine.filter((task) => task.status !== "Completed");
  const done = mine.filter((task) => task.status === "Completed");

  const today = new Date().toDateString();

  const grouped = open.reduce<Record<string, CrmTask[]>>((acc, task) => {
    const key = +new Date(task.dueDate) === +new Date(today) ? "Due today" : toDayLabel(task.dueDate);
    (acc[key] = acc[key] ?? []).push(task);
    return acc;
  }, {});

  return (
    <PanelCard title={`My Tasks (${currentUser})`} className="p-5">
      {mine.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No tasks assigned to you.</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([label, list]) => (
            <div key={label}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <div className="flex flex-col gap-1.5">
                {list.map((task) => {
                  const Icon = typeIcons[task.type] ?? Clock;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink hover:text-primary"
                      >
                        {task.title}
                      </button>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {task.dueTime ?? task.type}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        title="Mark completed"
                        aria-label="Mark completed"
                        onClick={() => onComplete(task)}
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {done.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Completed ({done.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {done.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-muted-foreground opacity-70"
                  >
                    <StatusBadge status={task.status} />
                    <span className={cn("min-w-0 flex-1 truncate text-sm line-through")}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button size="sm" variant="outline" onClick={onAddTask}>
            + Add task
          </Button>
        </div>
      )}
    </PanelCard>
  );
}

export { MyTasksView };