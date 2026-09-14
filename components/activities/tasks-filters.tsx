"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  taskMocks,
  taskPriorities,
  taskStatuses,
  taskTypes,
} from "@/lib/mock-tasks";

export type TasksViewMode = "list" | "board" | "mine";

export interface TaskFilterState {
  search: string;
  status: "all" | (typeof taskStatuses)[number];
  priority: "all" | (typeof taskPriorities)[number];
  owner: "all" | string;
  due: "all" | "today" | "overdue" | "upcoming" | "completed";
  record: "all" | "Lead" | "Contact" | "Company" | "Deal";
  type: "all" | (typeof taskTypes)[number];
}

export type dueFilter = TaskFilterState["due"];

export const defaultTaskFilters: TaskFilterState = {
  search: "",
  status: "all",
  priority: "all",
  owner: "all",
  due: "all",
  record: "all",
  type: "all",
};

interface TasksFiltersProps {
  filters: TaskFilterState;
  onChange: (patch: Partial<TaskFilterState>) => void;
  onClear: () => void;
  view: TasksViewMode;
  onViewChange: (view: TasksViewMode) => void;
  resultCount: number;
}

function TasksFilters({
  filters,
  onChange,
  onClear,
  view,
  onViewChange,
  resultCount,
}: TasksFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.owner !== "all" ||
    filters.due !== "all" ||
    filters.record !== "all" ||
    filters.type !== "all";

  return (
    <Card className="p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search tasks..."
            className="h-9 pl-9"
            aria-label="Search tasks"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["list", "board", "mine"] as TasksViewMode[]).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={view === mode ? "secondary" : "ghost"}
              onClick={() => onViewChange(mode)}
              className="h-8 text-xs capitalize"
            >
              {mode === "mine" ? "My Tasks" : mode}
            </Button>
          ))}
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => onChange({ status: value as TaskFilterState["status"] })}
        >
          <SelectTrigger className="h-9 w-auto min-w-[130px] text-[13px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {taskStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(value) => onChange({ priority: value as TaskFilterState["priority"] })}
        >
          <SelectTrigger className="h-9 w-auto min-w-[120px] text-[13px]" aria-label="Filter by priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {taskPriorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.owner}
          onValueChange={(value) => onChange({ owner: value as TaskFilterState["owner"] })}
        >
          <SelectTrigger className="h-9 w-auto min-w-[130px] text-[13px]" aria-label="Filter by owner">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {Array.from(new Set(taskMocks.map((t) => t.ownerName).filter(Boolean))).map(
              (owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select
          value={filters.due}
          onValueChange={(value) => onChange({ due: value as TaskFilterState["due"] })}
        >
          <SelectTrigger className="h-9 w-auto min-w-[120px] text-[13px]" aria-label="Filter by due date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any due date</SelectItem>
            <SelectItem value="today">Due today</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.record}
          onValueChange={(value) => onChange({ record: value as TaskFilterState["record"] })}
        >
          <SelectTrigger className="h-9 w-auto min-w-[120px] text-[13px]" aria-label="Filter by related record">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All records</SelectItem>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="Contact">Contact</SelectItem>
            <SelectItem value="Company">Company</SelectItem>
            <SelectItem value="Deal">Deal</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(value) => onChange({ type: value as TaskFilterState["type"] })}
        >
          <SelectTrigger className="h-9 w-auto min-w-[110px] text-[13px]" aria-label="Filter by task type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {taskTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">{resultCount} tasks</span>
      </div>
    </Card>
  );
}

export { TasksFilters };