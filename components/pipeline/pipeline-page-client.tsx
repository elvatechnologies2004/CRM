"use client";

import { useMemo } from "react";

import type { DealRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/crm-meta";

interface PipelinePageClientProps {
  initialDeals: DealRecord[];
}

function normalizeStage(stageName: string): string {
  return stageName.charAt(0).toUpperCase() + stageName.slice(1).toLowerCase();
}

const columnTone: Record<string, string> = {
  New: "bg-brand-blue",
  Qualified: "bg-brand-sky",
  Proposal: "bg-brand-purple",
  Negotiation: "bg-warning",
  Won: "bg-success",
  Lost: "bg-danger",
};

function PipelinePageClient({ initialDeals }: PipelinePageClientProps) {
  const columns = useMemo(() => {
    const grouped: Record<string, DealRecord[]> = {};
    initialDeals.forEach((deal) => {
      const label = normalizeStage(deal.stageName);
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(deal);
    });
    const order = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
    const known = order.filter((label) => grouped[label]);
    const extra = Object.keys(grouped).filter((label) => !order.includes(label));
    return [...known, ...extra].map((label) => ({
      label,
      deals: grouped[label],
      total: grouped[label].reduce((sum, deal) => sum + deal.value, 0),
    }));
  }, [initialDeals]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">Main Sales Pipeline · board view</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <div
            key={column.label}
            className="w-64 shrink-0 rounded-xl border border-border bg-muted/40 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${columnTone[column.label] ?? "bg-brand-sky"}`} aria-hidden />
                <span className="text-xs font-medium text-ink">{column.label}</span>
                <span className="text-xs text-muted-foreground">{column.deals.length}</span>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatCurrency(column.total)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {column.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="rounded-lg border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
                >
                  <p className="truncate text-sm font-medium text-ink">{deal.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{deal.companyName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold tabular-nums text-ink">
                      {formatCurrency(deal.value)}
                    </span>
                    <span className="text-xs text-muted-foreground">{deal.ownerName}</span>
                  </div>
                </div>
              ))}
              {column.deals.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No deals</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { PipelinePageClient };