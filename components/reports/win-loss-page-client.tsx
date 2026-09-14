"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { formatCurrency } from "@/lib/crm-meta";
import type { WinLossData } from "@/lib/types";
import type { WinLossDeal } from "@/lib/mock-win-loss";

interface WinLossPageClientProps {
  initialSummary: WinLossData;
  initialDeals: WinLossDeal[];
}

function WinLossPageClient({ initialSummary, initialDeals }: WinLossPageClientProps) {
  const summary = useMemo(() => initialSummary, [initialSummary]);
  const deals = useMemo(() => initialDeals, [initialDeals]);

  const wonValue = useMemo(
    () => deals.filter((deal) => deal.outcome === "Won").reduce((sum, deal) => sum + deal.amount, 0),
    [deals]
  );
  const lostValue = useMemo(
    () => deals.filter((deal) => deal.outcome === "Lost").reduce((sum, deal) => sum + deal.amount, 0),
    [deals]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Win / Loss Analysis</h1>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{summary.winRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Deals Won</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-success">{summary.won}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Deals Lost</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-danger">{summary.lost}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Won Value</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{formatCurrency(wonValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Total Won</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
            {formatCurrency(wonValue)} · {deals.filter((d) => d.outcome === "Won").length} deals
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <p className="text-xs text-muted-foreground">Total Lost</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
            {formatCurrency(lostValue)} · {deals.filter((d) => d.outcome === "Lost").length} deals
          </p>
        </div>
      </div>

      <Table<WinLossDeal>
        data={deals}
        columns={[
          { header: "Deal", cell: (deal) => <span className="font-medium text-ink">{deal.dealName}</span> },
          { header: "Company", cell: (deal) => <span className="text-muted-foreground">{deal.companyName}</span> },
          { header: "Value", alignment: "right", cell: (deal) => <span className="tabular-nums">{formatCurrency(deal.amount)}</span> },
          { header: "Owner", cell: (deal) => <span className="text-muted-foreground">{deal.ownerName}</span> },
          {
            header: "Result",
            cell: (deal) => (
              <Badge variant={deal.outcome === "Won" ? "success" : "danger"} className="text-[10px]">
                {deal.outcome}
              </Badge>
            ),
          },
          { header: "Reason", cell: (deal) => <span className="text-muted-foreground">{deal.reason}</span> },
        ]}
      />
    </div>
  );
}

export { WinLossPageClient };