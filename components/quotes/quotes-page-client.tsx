"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuoteRecord, QuoteStatus } from "@/lib/types";

interface QuotesPageClientProps {
  initialQuotes: QuoteRecord[];
}

function QuotesPageClient({ initialQuotes }: QuotesPageClientProps) {
  const quotes = useMemo(() => initialQuotes, [initialQuotes]);

  const statusTone: Record<QuoteStatus, "success" | "warning" | "info" | "danger"> = {
    Draft: "info",
    Sent: "warning",
    Viewed: "info",
    Accepted: "success",
    Rejected: "danger",
    Expired: "danger",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Quotes</h1>
        <Button size="sm" variant="ghost">
          + New Quote
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quotes.map((quote) => {
          const Tone = statusTone[quote.status];
          return (
            <div
              key={quote.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{quote.number}</p>
                  <Badge variant={Tone}>{quote.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {quote.customerName}
                  {quote.dealName ? ` · ${quote.dealName}` : ""}
                </p>
                <p className="text-xl font-semibold tabular-nums text-ink">${quote.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(quote.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </p>
              </div>
            </div>
          );
        })}
        {quotes.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No quotes found.
          </p>
        )}
      </div>
    </div>
  );
}

export { QuotesPageClient };