"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/crm-meta";

export interface DealsStatsProps {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  pipelineValue: number;
  averageDealSize: number;
}

function DealsStats({ totalDeals, openDeals, wonDeals, pipelineValue, averageDealSize }: DealsStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
      <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <p className="text-xs font-medium text-muted-foreground">Total Opportunities</p>
        <p className="text-2xl font-semibold tabular-nums text-ink">{totalDeals}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <p className="text-xs font-medium text-muted-foreground">Open Opportunities</p>
        <p className="text-2xl font-semibold tabular-nums text-ink">{openDeals}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <p className="text-xs font-medium text-muted-foreground">Won Opportunities</p>
        <div className="text-2xl font-semibold tabular-nums text-ink">
          <Badge variant="success">{wonDeals}</Badge>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <p className="text-xs font-medium text-muted-foreground">Pipeline Value</p>
        <p className="text-2xl font-semibold tabular-nums text-ink">{formatCurrency(pipelineValue)}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <p className="text-xs font-medium text-muted-foreground">Avg Opportunity Value</p>
        <p className="text-2xl font-semibold tabular-nums text-ink">{formatCurrency(averageDealSize)}</p>
      </div>
    </div>
  );
}

export { DealsStats };