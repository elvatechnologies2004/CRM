"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CrmCustomerSuccess } from "@/lib/types";

interface CustomerSuccessPageClientProps {
  initialCustomerSuccess: CrmCustomerSuccess[];
}

function CustomerSuccessPageClient({ initialCustomerSuccess }: CustomerSuccessPageClientProps) {
  const data = useMemo(() => initialCustomerSuccess, [initialCustomerSuccess]);

  const healthTrendTone: Record<string, "info" | "success" | "warning"> = {
    up: "success",
    down: "warning",
    stable: "info",
  };

  const churnRiskTone: Record<string, "secondary" | "danger" | "info" | "warning"> = {
    Low: "info",
    Medium: "warning",
    High: "danger",
  };

  const csatScoreClass: Record<number, string> = {
    94: "text-success",
    82: "text-warning",
    97: "text-success",
    61: "text-danger",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Customer Success</h1>
        <Button size="sm" variant="ghost">
          + New Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((item) => {
          const TrendTone = healthTrendTone[item.trend];
          const ChurnTone = churnRiskTone[item.churnRisk];
          const CsatClass = csatScoreClass[item.csatScore] || "text-muted-foreground";
          return (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-3">
                <p className="font-medium text-ink">{item.customerName}</p>
                <p className="text-sm text-muted-foreground">
                  Owner: {item.managerName} · Quarterly Revenue: ${item.quarterlyRevenue?.toLocaleString() || '-'} · Renewal: {new Date(item.nextRenewalDate).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Health Score</span>
                  <Badge variant={TrendTone} className="text-[11px]">
                    {item.healthScore}
                  </Badge>
                  <span className="text-xs ml-2">{item.trend}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Churn Risk</span>
                  <Badge variant={ChurnTone} className="text-[10px]">
                    {item.churnRisk}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">CSAT Score</span>
                  <span className={cn("h-4 w-4 rounded-full", CsatClass)} aria-hidden />
                  <span className="text-xs ml-1">{item.csatScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Tickets This Quarter</span>
                  <span>{item.ticketsThisQuarter}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Resolution Rate</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {item.resolutionRate}%
                  </Badge>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Upsell Opportunity</p>
                  <p className="font-medium text-ink">{item.upsellOpportunity}</p>
                  <Badge variant="info" className="text-[10px] ml-2">
                    {item.churnRisk === "Low" ? "Low Risk" : item.churnRisk === "Medium" ? "Medium Risk" : "High Risk"}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No customer success data found.
          </p>
        )}
      </div>
    </div>
  );
}

export { CustomerSuccessPageClient };