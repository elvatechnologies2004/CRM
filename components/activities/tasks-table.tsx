"use client";

import Link from "next/link";
import {
  Check,
  CheckSquare,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge, StatusBadge } from "@/components/crm/status-badges";
import { Button } from "@/components/ui/button";
import { toDayLabel } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CrmTask, TaskType } from "@/lib/types";

export const taskTypeIcons: Record<TaskType, LucideIcon> = {
  Call: Phone,
  Email: Mail,
  WhatsApp: MessageCircle,
  Meeting: Video,
  "Follow-up": Clock,
  Demo: Video,
  Proposal: CheckSquare,
  Internal: Wrench,
  Other: Wrench,
};

function relateHref(task: CrmTask): string {
  const base = {
    Lead: "/leads",
    Contact: "/contacts",
    Company: "/companies",
    Deal: "/deals",
  }[task.relatedType];
  return task.relatedId ? `${base}/${task.relatedId}` : base;
}

interface TasksTableProps {
  tasks: CrmTask[];
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onComplete: (task: CrmTask) => void;
  onEdit: (task: CrmTask) => void;
  onDelete: (id: string) => void;
  onAddTask: () => void;
  bulkActions: {
    label: string;
    onApply: (ids: string[]) => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  }[];
}

function TasksTable({
  tasks,
  selected,
  onToggleSelected,
  onToggleAll,
  onComplete,
  onEdit,
  onDelete,
  onAddTask,
  bulkActions,
}: TasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <CheckSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
        </span>
        <p className="text-sm font-medium text-ink">No tasks match your filters</p>
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          Try clearing your filters or create a new task.
        </p>
        {onAddTask && (
          <Button size="sm" variant="outline" className="mt-2" onClick={onAddTask}>
            <Plus className="h-4 w-4" aria-hidden /> New task
          </Button>
        )}
      </div>
    );
  }

  const allSelected = tasks.every((task) => selected.has(task.id));
  const someSelected = tasks.some((task) => selected.has(task.id));

  return (
    <div className="rounded-xl border border-border bg-card shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent/50 px-4 py-2.5">
          <span className="text-xs font-medium text-accent-foreground">
            {selected.size} selected
          </span>
          {bulkActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant ?? "outline"}
              className="h-7 text-xs"
              onClick={() => action.onApply([...selected])}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                  aria-label="Select all tasks"
                  className={someSelected && !allSelected ? "bg-primary text-white" : undefined}
                />
              </th>
              <th className="px-4 py-2.5 font-medium">Task</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Due date</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 font-medium">Related record</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const Icon = taskTypeIcons[task.type];
              const overdue = task.status !== "Completed" && +new Date(task.dueDate) < new Date().getTime();
              return (
                <tr
                  key={task.id}
                  className={cn("bg-card hover:bg-muted/30", task.status === "Completed" && "opacity-60")}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.has(task.id)}
                      onCheckedChange={() => onToggleSelected(task.id)}
                      aria-label={`Select ${task.title}`}
                    />
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <button
                      type="button"
                      className="block truncate text-left font-medium text-ink hover:text-primary"
                      onClick={() => onEdit(task)}
                      title={task.description ?? task.title}
                    >
                      {task.title}
                    </button>
                    {task.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {task.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "whitespace-nowrap text-xs",
                        overdue ? "font-medium text-danger" : "text-muted-foreground"
                      )}
                    >
                      {toDayLabel(task.dueDate)}
                      {task.dueTime ? ` Â· ${task.dueTime}` : ""}
                    </span>
                    {overdue && (
                      <p className="text-[11px] text-danger">Overdue</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{task.ownerName}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={relateHref(task)}
                      className="whitespace-nowrap text-xs text-primary hover:underline"
                    >
                      {task.relatedName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {task.status !== "Completed" && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Mark completed"
                          aria-label="Mark completed"
                          onClick={() => onComplete(task)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        title="Edit"
                        aria-label="Edit task"
                        onClick={() => onEdit(task)}
                      >
                        <Wrench className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        title="Delete"
                        aria-label="Delete task"
                        onClick={() => onDelete(task.id)}
                      >
                        <span className="text-danger">Ã—</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { TasksTable };