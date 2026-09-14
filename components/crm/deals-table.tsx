import { Plus, ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dealStageLabels, formatCurrency } from "@/lib/crm-meta";
import type { CrmDeal } from "@/lib/types";

import { EmptyState } from "./empty-state";

const stageBadgeTint: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  qualified: "bg-indigo-100 text-indigo-700",
  proposal: "bg-brand-purple/10 text-[#7c3aed]",
  negotiation: "bg-warning/10 text-[#b45309]",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-slate-100 text-slate-500 line-through",
};

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

interface DealsTableProps {
  deals: CrmDeal[];
  onAddDeal?: () => void;
}

function DealsTable({ deals, onAddDeal }: DealsTableProps) {
  if (deals.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <EmptyState
          icon={ScrollText}
          title="No deals yet"
          description="No deals linked to this record yet."
          actionLabel={onAddDeal ? "Add Deal" : undefined}
          onAction={onAddDeal}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-ink">
          Deals
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {deals.length}
          </span>
        </h3>
        {onAddDeal && (
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onAddDeal}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add deal
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Deal</th>
              <th className="px-5 py-2.5 text-right font-medium">Value</th>
              <th className="px-5 py-2.5 font-medium">Stage</th>
              <th className="px-5 py-2.5 text-right font-medium">Probability</th>
              <th className="px-5 py-2.5 text-right font-medium">Expected Close</th>
              <th className="px-5 py-2.5 font-medium">Owner</th>
              <th className="px-5 py-2.5 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deals.map((deal) => {
              const tint = stageBadgeTint[deal.stage] ?? stageBadgeTint.new;
              return (
                <tr key={deal.id} className="bg-card hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium text-ink">{deal.name}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={tint}>
                      {dealStageLabels[deal.stage]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {deal.probability}%
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                    {formatShortDate(deal.expectedClose)}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{deal.ownerName}</td>
                  <td className="px-5 py-3 text-right">
                    <Badge
                      variant="outline"
                      className={
                        deal.status === "Won"
                          ? "bg-emerald-100 text-emerald-700"
                          : deal.status === "Lost"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-indigo-100 text-indigo-700"
                      }
                    >
                      {deal.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DealsTable };