"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import type { PortalActivity, PortalMetric } from "@/lib/types";

interface PortalPageClientProps {
  initialMetrics: PortalMetric[];
  initialActivities: PortalActivity[];
}

const channelTone: Record<PortalActivity["channel"], "info" | "secondary" | "purple"> = {
  Portal: "info",
  Email: "secondary",
  Support: "purple",
};

function PortalPageClient({ initialMetrics, initialActivities }: PortalPageClientProps) {
  const metrics = useMemo(() => initialMetrics, [initialMetrics]);
  const activities = useMemo(() => initialActivities, [initialActivities]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Customer Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Self-service engagement across your customer base.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
              {metric.value.toLocaleString()}
              {metric.unit ? <span className="text-xs font-normal text-muted-foreground"> {metric.unit}</span> : null}
            </p>
            <Badge variant={metric.trend === "up" ? "success" : "warning"} className="mt-1 text-[10px]">
              {metric.trend === "up" ? "S Trending up" : "Trending down"}
            </Badge>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <p className="border-b border-border p-4 text-sm font-medium text-ink">
          Recent Activity
        </p>
        <ul className="divide-y divide-border">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{activity.customerName}</p>
                <p className="truncate text-sm text-muted-foreground">{activity.action}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant={channelTone[activity.channel]} className="text-[10px]">
                  {activity.channel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.at).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </span>
              </div>
            </li>
          ))}
          {activities.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">No activity found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export { PortalPageClient };