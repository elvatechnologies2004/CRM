"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SalesGoal } from "@/lib/types";

interface GoalsPageClientProps {
  initialGoals: SalesGoal[];
}

function progressLabel(progress: number): { label: string; tone: "success" | "warning" | "danger" | "info" } {
  if (progress >= 100) return { label: "Achieved", tone: "success" };
  if (progress >= 75) return { label: "On Track", tone: "info" };
  if (progress >= 50) return { label: "At Risk", tone: "warning" };
  return { label: "Behind", tone: "danger" };
}

function GoalsPageClient({ initialGoals }: GoalsPageClientProps) {
  const goals = useMemo(() => initialGoals, [initialGoals]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Goals</h1>
        <Button size="sm" variant="ghost">
          + New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => {
          const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100);
          const { label, tone } = progressLabel(progress);
          const displayTarget = goal.currency ? `Rs ${goal.target.toLocaleString()}` : goal.target.toLocaleString();
          const displayCurrent = goal.currency ? `Rs ${goal.current.toLocaleString()}` : goal.current.toLocaleString();
          return (
            <div
              key={goal.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-ink">{goal.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {goal.ownerName}
                    {goal.team ? ` · ${goal.team}` : ""} · {goal.period}
                  </p>
                </div>
                <Badge variant={tone} className="text-[10px]">
                  {label}
                </Badge>
              </div>

              <div className="flex items-end justify-between">
                <p className="text-xl font-semibold tabular-nums text-ink">{displayCurrent}</p>
                <p className="text-xs text-muted-foreground">target {displayTarget}</p>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    progress >= 100
                      ? "bg-success"
                      : progress >= 75
                        ? "bg-brand-blue"
                        : progress >= 50
                          ? "bg-warning"
                          : "bg-danger"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          );
        })}
        {goals.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No goals found.
          </p>
        )}
      </div>
    </div>
  );
}

export { GoalsPageClient };