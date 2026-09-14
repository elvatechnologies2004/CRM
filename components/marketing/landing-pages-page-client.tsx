"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LandingPage } from "@/lib/types";

interface MarketingLandingPagesPageClientProps {
  initialPages: LandingPage[];
}

const statusTone: Record<LandingPage["status"], "success" | "secondary"> = {
  Active: "success",
  Inactive: "secondary",
  Draft: "secondary",
};

function MarketingLandingPagesPageClient({ initialPages }: MarketingLandingPagesPageClientProps) {
  const pages = useMemo(() => initialPages, [initialPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Landing Pages</h1>
        <Button size="sm" variant="ghost">
          + New Page
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <ul className="divide-y divide-border">
          {pages.map((page) => (
            <li key={page.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-ink">{page.name}</p>
                  <Badge variant={statusTone[page.status]} className="text-[10px]">
                    {page.status}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{page.url}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-sm">
                <span className="text-muted-foreground">{page.views.toLocaleString()} views</span>
                <span className="text-muted-foreground">{page.conversions.toLocaleString()} conversions</span>
                <span className="font-semibold tabular-nums text-ink">{page.conversionRate}%</span>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            </li>
          ))}
          {pages.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              No landing pages found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export { MarketingLandingPagesPageClient };