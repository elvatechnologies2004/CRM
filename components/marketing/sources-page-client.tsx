"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/crm-meta";
import type { MarketingSource } from "@/lib/types";

interface MarketingSourcesPageClientProps {
  initialSources: MarketingSource[];
}

function getSourceTone(name: string): "info" | "success" | "warning" {
  if (name === "Referral" || name === "Website") return "success";
  if (name === "Paid Advertising") return "warning";
  return "info";
}

function MarketingSourcesPageClient({ initialSources }: MarketingSourcesPageClientProps) {
  const sources = useMemo(() => initialSources, [initialSources]);

  const totals = useMemo(() => {
    const leads = sources.reduce((sum, source) => sum + source.leads, 0);
    const weighted = sources.length
      ? Math.round(sources.reduce((sum, source) => sum + source.conversionRate, 0) / sources.length)
      : 0;
    const cost = sources.reduce((sum, source) => sum + (source.cost ?? 0), 0);
    return { leads, weighted, cost };
  }, [sources]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Lead Sources</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Active Sources</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{sources.filter((s) => s.status === "Active").length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Total Leads</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{totals.leads.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Avg. Conversion</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{totals.weighted}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{formatCurrency(totals.cost)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{source.name}</p>
                <p className="text-xs text-muted-foreground">{source.type}</p>
              </div>
              <Badge variant={getSourceTone(source.name)} className="text-[10px]">
                {source.status}
              </Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{source.leads} leads</span>
              <span className="font-semibold tabular-nums text-ink">{source.conversionRate}%</span>
            </div>
            {source.cost !== undefined && (
              <p className="text-xs text-muted-foreground">Cost: {formatCurrency(source.cost)}</p>
            )}
          </div>
        ))}
        {sources.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sources found.
          </p>
        )}
      </div>
    </div>
  );
}

export { MarketingSourcesPageClient };