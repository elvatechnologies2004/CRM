"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Phone,
  Video,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

const taskIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("call")) return Phone;
  if (lower.includes("proposal")) return FileText;
  if (lower.includes("meeting")) return Video;
  if (lower.includes("follow")) return MessageSquare;
  return ClipboardCheck;
};

const priorityStyles: Record<TaskPriority, "danger" | "warning" | "secondary"> = {
  high: "danger",
  medium: "warning",
  low: "secondary",
};

interface UpcomingTasksProps {
  tasks: Task[];
}

function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const [items, setItems] = React.useState(tasks);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Upcoming Tasks</CardTitle>
        <Link
          href="/tasks"
          scroll={false}
          className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          View all
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="pt-1">
        <ul className="flex flex-col">
          {items.map((task) => {
            const Icon = taskIcon(task.title);
            const priorityBadge = priorityStyles[task.priority];
            return (
              <li
                key={task.id}
                className={cn(
                  "-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50",
                  task.completed && "opacity-60"
                )}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggle(task.id)}
                  aria-label={`Mark "${task.title}" as ${
                    task.completed ? "not done" : "done"
                  }`}
                  className="shrink-0"
                />
                <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                  {task.time}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate text-[13px] font-medium text-ink",
                      task.completed && "line-through decoration-muted-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {task.subtitle}
                  </span>
                </span>
                <Badge variant={priorityBadge} className="shrink-0 border-transparent capitalize">
                  {task.priority}
                </Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export { UpcomingTasks };