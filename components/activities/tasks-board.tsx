"use client";

import {
  CheckCircle2,
  CircleDashed,
  CircleDot,
  XCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";

import { PanelCard } from "@/components/crm/panel";
import { PriorityBadge } from "@/components/crm/status-badges";
import { taskTypeIcons } from "@/components/activities/tasks-table";
import { toDayLabel } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CrmTask, TaskStatus } from "@/lib/types";

const boardConfig: { status: TaskStatus; icon: LucideIcon; accent: string }[] = [
  { status: "Open", icon: CircleDashed, accent: "text-muted-foreground" },
  { status: "In Progress", icon: CircleDot, accent: "text-primary" },
  { status: "Completed", icon: CheckCircle2, accent: "text-[#15803d]" },
  { status: "Cancelled", icon: XCircle, accent: "text-muted-foreground" },
];

interface TasksBoardProps {
  tasks: CrmTask[];
  onEdit: (task: CrmTask) => void;
  onComplete: (task: CrmTask) => void;
  onAddTask: () => void;
}

function TasksBoard({ tasks, onEdit, onComplete, onAddTask }: TasksBoardProps) {
  return (
    <PanelCard className="p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {boardConfig.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);
          const Icon = column.icon;
          return (
            <div
              key={column.status}
              className="min-h-[260px] rounded-xl border border-border bg-muted/30 p-2.5"
            >
              <div className="mb-2 flex items-center gap-1.5 px-1">
                <Icon className={cn("h-4 w-4", column.accent)} aria-hidden />
                <p className="text-xs font-semibold text-ink">{column.status}</p>
                <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {columnTasks.map((task) => {
                  const TypeIcon = taskTypeIcons[task.type];
                  const overdue =
                    task.status !== "Completed" &&
                    task.status !== "Cancelled" &&
                    +new Date(task.dueDate) < new Date().getTime();
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onEdit(task)}
                      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2.5 text-left shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] transition-colors hover:border-primary/40"
                    >
                      <span className="flex items-start gap-1.5">
                        <span className="text-xs font-medium text-ink">{task.title}</span>
                        {task.status !== "Completed" && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onComplete(task);
                            }}
                            title="Mark completed"
                            aria-label="Mark completed"
                            className="ml-auto text-muted-foreground hover:text-success"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </span>
                      <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <TypeIcon className="h-3.5 w-3.5" aria-hidden />
                        {task.type}
                        <PriorityBadge priority={task.priority} />
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px]",
                          overdue ? "text-danger" : "text-muted-foreground"
                        )}
                      >
                        <Clock className="h-3 w-3" aria-hidden />
                        {toDayLabel(task.dueDate)}
                        {overdue && " Â· Overdue"}
                        <span className="ml-auto">{task.ownerName}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={onAddTask}
          className="text-xs font-medium text-primary hover:underline"
        >
          + Add task
        </button>
      </div>
    </PanelCard>
  );
}

export { TasksBoard };