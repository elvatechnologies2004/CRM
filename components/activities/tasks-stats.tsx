"use client";

import { StatGrid } from "@/components/crm/stat-grid";

export interface TasksStatsData {
  openTasks: number;
  dueToday: number;
  overdue: number;
  completedThisWeek: number;
  highPriority: number;
}

function TasksStats(stats: TasksStatsData) {
  return (
    <StatGrid
      stats={[
        { label: "Open Tasks", value: stats.openTasks },
        { label: "Due Today", value: stats.dueToday, tone: "info" },
        { label: "Overdue", value: stats.overdue, tone: "danger" },
        { label: "Completed This Week", value: stats.completedThisWeek, tone: "success" },
        { label: "High Priority", value: stats.highPriority, tone: "warning" },
      ]}
    />
  );
}

export { TasksStats };