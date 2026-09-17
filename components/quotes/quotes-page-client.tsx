"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddQuoteDialog } from "@/components/quotes/add-quote-dialog";
import { readStoredQuotes, upsertQuote } from "@/lib/quote-local";
import type { QuoteRecord, QuoteStatus } from "@/lib/types";

interface QuotesPageClientProps {
  initialQuotes: QuoteRecord[];
}

function QuotesPageClient({ initialQuotes }: QuotesPageClientProps) {
  const [quotes, setQuotes] = useState<QuoteRecord[]>(() => {
    const stored = readStoredQuotes();
    return stored.length > 0 ? stored : initialQuotes;
  });
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const nextNumber = useMemo(() => {
    const sequence = quotes.filter((q) => q.number.startsWith("QT-"));
    const max = sequence.reduce((highest, q) => {
      const numeric = Number(q.number.replace("QT-", ""));
      return Number.isFinite(numeric) && numeric > highest ? numeric : highest;
    }, 0);
    return `QT-${String(max + 1).padStart(4, "0")}`;
  }, [quotes]);

  const statusTone: Record<QuoteStatus, "success" | "warning" | "info" | "danger"> = {
    Draft: "info",
    Sent: "warning",
    Viewed: "info",
    Accepted: "success",
    Rejected: "danger",
    Expired: "danger",
  };

  const handleCreate = (quote: QuoteRecord) => {
    upsertQuote(quote);
    setQuotes((prev) => [quote, ...prev]);
    setToast(`Quote ${quote.number} created`);
    window.setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Quotes</h1>
        <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}>
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

      <AddQuoteDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleCreate}
        nextNumber={nextNumber}
      />

      {toast && (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export { QuotesPageClient };