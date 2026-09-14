"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DataQualityMetric } from "@/lib/types";

interface DataQualityPageClientProps {
  initialMetrics: DataQualityMetric[];
}

function DataQualityPageClient({ initialMetrics }: DataQualityPageClientProps) {
  const metrics = useMemo(() => initialMetrics, [initialMetrics]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Data Quality</h1>
        <Button size="sm" variant="ghost">
          + Metric
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const issueCount = metric.issues?.length ?? 0;
          return (
            <div
              key={metric.metric}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-2">
                <p className="font-medium text-ink">{metric.metric}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-ink">Score</span>
                  <span className="text-2xl font-semibold text-ink">{metric.score}</span>
                  <Badge variant="info" className="text-[10px]">
                    out of 100
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last Update: {metric.lastUpdate || "N/A"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Issues: {issueCount}
                </p>
              </div>
            </div>
          );
        })}
        {metrics.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No metrics found.
          </p>
        )}
      </div>
    </div>
  );
}

export { DataQualityPageClient };