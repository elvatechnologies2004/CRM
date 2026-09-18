"use client";

import { useEffect, useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/crm/toast";
import { TasksHeader } from "@/components/activities/tasks-header";
import { TasksStats, type TasksStatsData } from "@/components/activities/tasks-stats";
import {
  TasksFilters,
  defaultTaskFilters,
  type TaskFilterState,
  type TasksViewMode,
} from "@/components/activities/tasks-filters";
import { TasksTable } from "@/components/activities/tasks-table";
import { TasksBoard } from "@/components/activities/tasks-board";
import { MyTasksView } from "@/components/activities/my-tasks-view";
import { AddTaskDialog, type TaskFormValues } from "@/components/activities/add-task-dialog";
import {
  readDeletedTaskIds,
  readStoredTasks,
  removeTask,
  uid,
  upsertTask,
} from "@/lib/activity-local";
import { useCurrentUser } from "@/lib/current-user";
import type { CrmTask } from "@/lib/types";

interface TasksPageClientProps {
  initialTasks: CrmTask[];
  owners: string[];
}

function TasksSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Skeleton key={n} className="h-[76px]" />
        ))}
      </div>
      <Skeleton className="h-[76px]" />
      <Skeleton className="h-[420px]" />
    </div>
  );
}

function TasksPageClient({ initialTasks, owners }: TasksPageClientProps) {
  const [tasks, setTasks] = useState<CrmTask[]>(initialTasks);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilterState>(defaultTaskFilters);
  const [view, setView] = useState<TasksViewMode>("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CrmTask | null>(null);

  const currentUser = useCurrentUser();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const deleted = readDeletedTaskIds();
      const stored = readStoredTasks().filter((task) => !deleted.has(task.id));
      const merged = [
        ...stored,
        ...initialTasks.filter(
          (task) => !deleted.has(task.id) && !stored.some((t) => t.id === task.id),
        ),
      ];
      setTasks(merged);
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialTasks]);

  const stats: TasksStatsData = useMemo(() => {
    const now = new Date().getTime();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const open = tasks.filter((t) => t.status === "Open" || t.status === "In Progress");
    return {
      openTasks: open.length,
      dueToday: open.filter((t) => {
        const due = new Date(t.dueDate).getTime();
        return due >= todayStart.getTime() && due <= todayEnd.getTime();
      }).length,
      overdue: open.filter((t) => new Date(t.dueDate).getTime() < now).length,
      completedThisWeek: tasks.filter(
        (t) =>
          t.status === "Completed" &&
          t.completedAt &&
          new Date(t.completedAt).getTime() >= weekAgo.getTime()
      ).length,
      highPriority: open.filter((t) => t.priority === "High" || t.priority === "Urgent").length,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const now = new Date().getTime();
    let result = [...tasks];

    if (query) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.relatedName?.toLowerCase().includes(query) || "") ||
          task.ownerName.toLowerCase().includes(query)
      );
    }
    if (filters.status !== "all") result = result.filter((t) => t.status === filters.status);
    if (filters.priority !== "all") result = result.filter((t) => t.priority === filters.priority);
    if (filters.owner !== "all") result = result.filter((t) => t.ownerName === filters.owner);
    if (filters.type !== "all") result = result.filter((t) => t.type === filters.type);
    if (filters.record !== "all") result = result.filter((t) => t.relatedType === filters.record);

    switch (filters.due) {
      case "today": {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        result = result.filter(
          (t) => new Date(t.dueDate).getTime() >= start.getTime() && new Date(t.dueDate).getTime() <= end.getTime()
        );
        break;
      }
      case "overdue":
        result = result.filter(
          (t) => t.status !== "Completed" && new Date(t.dueDate).getTime() < now
        );
        break;
      case "upcoming":
        result = result.filter((t) => new Date(t.dueDate).getTime() >= now);
        break;
      case "completed":
        result = result.filter((t) => t.status === "Completed");
        break;
    }

    return result.sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  }, [tasks, filters]);

  const setFilter = (patch: Partial<TaskFilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const clearFilters = () => setFilters({ ...defaultTaskFilters });

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map((t) => t.id)) : new Set());
  };

  const handleComplete = (task: CrmTask) => {
    const updated: CrmTask = {
      ...task,
      status: task.status === "Completed" ? "Open" : "Completed",
      completedAt: task.status === "Completed" ? undefined : new Date().toISOString(),
    };
    upsertTask(updated);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setToast(updated.status === "Completed" ? "Task completed" : "Task reopened");
  };

  const handleAddSubmit = (form: TaskFormValues) => {
    const task: CrmTask = {
      id: uid("tk"),
      title: form.title,
      description: form.description,
      type: form.type,
      priority: form.priority,
      status: form.status,
      ownerId: currentUser?.id ?? "",
      ownerName: form.ownerName,
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      relatedType: form.relatedType,
      relatedName: form.relatedName,
      createdAt: new Date().toISOString(),
    };
    upsertTask(task);
    setTasks((prev) => [task, ...prev]);
    setToast("Task created");
  };

  const handleEditSubmit = (form: TaskFormValues) => {
    if (!editingTask) return;
    const updated: CrmTask = {
      ...editingTask,
      title: form.title,
      description: form.description,
      type: form.type,
      priority: form.priority,
      status: form.status,
      ownerName: form.ownerName,
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      relatedType: form.relatedType,
      relatedName: form.relatedName,
    };
    upsertTask(updated);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTask(null);
    setToast("Task updated");
  };

  const handleDelete = (id: string) => {
    removeTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setToast("Task deleted");
  };

  const openCreate = () => {
    setEditingTask(null);
    setAddOpen(true);
  };

  const openEdit = (task: CrmTask) => {
    setEditingTask(task);
    setAddOpen(true);
  };

  if (loading) return <TasksSkeleton />;

  return (
    <div className="space-y-4">
      <TasksHeader onAddTask={openCreate} />
      <TasksStats {...stats} />

      <TasksFilters
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        view={view}
        onViewChange={setView}
        resultCount={filtered.length}
      />

      {view === "list" && (
        <TasksTable
          tasks={filtered}
          selected={selected}
          onToggleSelected={toggleSelected}
          onToggleAll={toggleAll}
          onComplete={handleComplete}
          onEdit={openEdit}
          onDelete={handleDelete}
          onAddTask={openCreate}
          bulkActions={[
            {
              label: "Mark completed",
              onApply: (ids) => {
                const now = new Date().toISOString();
                const updated: CrmTask[] = [];
                ids.forEach((id) => {
                  const task = tasks.find((t) => t.id === id);
                  if (task && task.status !== "Completed") {
                    const next = { ...task, status: "Completed" as const, completedAt: now };
                    updated.push(next);
                    upsertTask(next);
                  }
                });
                if (updated.length > 0) {
                  setTasks((prev) =>
                    prev.map((t) => updated.find((u) => u.id === t.id) ?? t)
                  );
                  setToast(`${updated.length} tasks completed`);
                  setSelected(new Set());
                }
              },
            },
            {
              label: "Reassign to me",
              onApply: (ids) => {
                ids.forEach((id) => {
                  const task = tasks.find((t) => t.id === id);
                  if (task) {
                    upsertTask({ ...task, ownerId: currentUser?.id ?? "", ownerName: currentUser?.name ?? "" });
                  }
                });
                setTasks((prev) =>
                  prev.map((t) =>
                    ids.includes(t.id) ? { ...t, ownerId: currentUser?.id ?? "", ownerName: currentUser?.name ?? "" } : t
                  )
                );
                setToast("Tasks reassigned");
                setSelected(new Set());
              },
            },
            {
              label: "Delete",
              variant: "destructive" as const,
              onApply: (ids) => {
                ids.forEach((id) => {
                  removeTask(id);
                  setTasks((prev) => prev.filter((t) => t.id !== id));
                });
                setSelected(new Set());
                setToast("Tasks deleted");
              },
            },
          ]}
        />
      )}

      {view === "board" && (
        <TasksBoard tasks={filtered} onEdit={openEdit} onComplete={handleComplete} onAddTask={openCreate} />
      )}

      {view === "mine" && (
        <MyTasksView
          tasks={tasks}
          currentUser={currentUser?.name ?? ""}
          onComplete={handleComplete}
          onEdit={openEdit}
          onAddTask={openCreate}
        />
      )}

      <AddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        owners={owners}
        initial={editingTask}
        onSubmit={editingTask ? handleEditSubmit : handleAddSubmit}
      />

      <Toast message={toast} />
    </div>
  );
}

export { TasksPageClient };