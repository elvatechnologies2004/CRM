"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddQuoteDialog } from "@/components/quotes/add-quote-dialog";
import { createQuoteAction } from "@/app/quotes/actions";
import type { QuoteRecord, QuoteStatus } from "@/lib/types";

interface QuotesPageClientProps {
  initialQuotes: QuoteRecord[];
  initialError?: string | null;
}

function QuotesPageClient({ initialQuotes }: QuotesPageClientProps) {
  const [quotes, setQuotes] = useState<QuoteRecord[]>(initialQuotes);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
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

  const handleCreate = async (data: {
    customerName: string;
    dealName?: string;
    total: number;
    status: QuoteStatus;
    issueDate: string;
    expiryDate?: string;
    notes?: string;
  }) => {
    setBusy(true);
    const result = await createQuoteAction({
      customerName: data.customerName,
      dealName: data.dealName,
      total: data.total,
      status: data.status,
      currency: "USD",
      issue_date: data.issueDate,
      expiry_date: data.expiryDate || null,
      notes: data.notes,
    });
    setBusy(false);

    if (result.error || !result.quote) {
      setToast(result.error || "Failed to create quote");
      window.setTimeout(() => setToast(null), 2400);
      return;
    }

    const created: QuoteRecord = {
      id: result.quote.id,
      number: result.quote.number,
      customerName: result.quote.customerName,
      dealName: result.quote.dealName,
      total: result.quote.total,
      status: result.quote.status as QuoteStatus,
      createdAt: result.quote.createdAt,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate ?? "",
      currency: "USD",
      lineItems: [],
      subtotal: data.total,
      discount: 0,
      tax: 0,
      timeline: [],
    };
    setQuotes((prev) => [created, ...prev]);
    setAddOpen(false);
    setToast(`Quote ${created.number} created`);
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
        busy={busy}
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