"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CrmInvoice } from "@/lib/types";

interface InvoicesPageClientProps {
  initialInvoices: CrmInvoice[];
}

function InvoicesPageClient({ initialInvoices }: InvoicesPageClientProps) {
  const invoices = useMemo(() => initialInvoices, [initialInvoices]);

  const statusTone: Record<string, "success" | "warning" | "danger" | "info"> = {
    Draft: "info",
    Sent: "warning",
    Paid: "success",
    Overdue: "danger",
    Cancelled: "danger",
  };

  const paymentStatusTone: Record<string, "success" | "warning" | "info" | "danger"> = {
    Unpaid: "danger",
    "Partially Paid": "warning",
    Paid: "success",
    Refunded: "info",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Invoices</h1>
        <Button size="sm" variant="ghost">
          + New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {invoices.map((invoice) => {
          const StatusTone = statusTone[invoice.status];
          const PaymentTone = paymentStatusTone[invoice.paymentStatus];
          return (
            <div
              key={invoice.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{invoice.number}</p>
                  <Badge variant={StatusTone}>{invoice.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {invoice.customerName}
                  {invoice.dealName ? ` · ${invoice.dealName}` : ""}
                </p>
                <p className="text-xl font-semibold tabular-nums text-ink">${invoice.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Due {new Date(invoice.dueDate).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Payment: {invoice.paymentStatus}</p>
                <Badge variant={PaymentTone} className="text-[10px]">
                  {invoice.paymentMethod ?? "—"}
                </Badge>
              </div>
            </div>
          );
        })}
        {invoices.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No invoices found.
          </p>
        )}
      </div>
    </div>
  );
}

export { InvoicesPageClient };