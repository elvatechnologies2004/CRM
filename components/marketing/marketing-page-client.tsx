"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketingSource } from "@/lib/marketing-data";

interface MarketingPageClientProps {
  initialSources: MarketingSource[];
}

function MarketingPageClient({ initialSources }: MarketingPageClientProps) {
  const sources = useMemo(() => initialSources, [initialSources]);

  function getSourceTone(source: MarketingSource): "info" | "success" | "warning" | "danger" {
    switch (source) {
      case "Website":
        return "info";
      case "Referral":
        return "success";
      case "Cold Call":
        return "warning";
      case "Trade Show":
        return "info";
      case "Partner":
        return "warning";
      case "Social Media":
        return "info";
      case "Email Campaign":
        return "warning";
      case "Paid Advertising":
        return "info";
      default:
        return "info";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Marketing</h1>
        <Button size="sm" variant="ghost">
          + Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => {
          const Tone = getSourceTone(source);
          return (
            <div
              key={source}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink capitalize">{source}</span>
                <Badge variant={Tone} className="text-[10px]">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Campaigns: 5 · Leads: 145 · Budget Utilization: 64%
              </p>
            </div>
          );
        })}
        {sources.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No marketing sources found.
          </p>
        )}
      </div>

      <div className="mt-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" variant="ghost">
            + New Campaign
          </Button>
          <Button size="sm" variant="outline">
            + New Form
          </Button>
          <Button size="sm" variant="outline">
            + New Landing Page
          </Button>
        </div>
      </div>
    </div>
  );
}

export { MarketingPageClient };