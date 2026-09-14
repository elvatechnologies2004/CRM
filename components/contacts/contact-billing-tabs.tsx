"use client";

import { useEffect, useState } from "react";

import {
  Badge,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DealsTable } from "@/components/crm/deals-table";
import { NewDealDialog } from "@/components/crm/new-deal-dialog";
import { formatCurrency } from "@/lib/crm-meta";
import { readAddedDeals, writeAddedDeal } from "@/lib/crm-local";
import type { CrmDeal, Invoice, SupportTicket, User } from "@/lib/types";

const ticketStatusVariant: Record<SupportTicket["status"], "secondary" | "info" | "purple" | "success"> = {
  Open: "info",
  "In Progress": "purple",
  Resolved: "success",
  Closed: "secondary",
};

const invoiceStatusVariant: Record<Invoice["status"], "secondary" | "info" | "success" | "warning" | "danger"> = {
  draft: "secondary",
  sent: "info",
  paid: "success",
  overdue: "danger",
};

interface ContactDealsTabProps {
  deals: CrmDeal[];
  owners: User[];
  category: string;
  openRequest?: number;
}

function ContactDealsTab({ deals, owners, category, openRequest = 0 }: ContactDealsTabProps) {
  const [list, setList] = useState<CrmDeal[]>(deals);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prevOpenRequest, setPrevOpenRequest] = useState(0);

  if (openRequest !== prevOpenRequest) {
    setPrevOpenRequest(openRequest);
    if (openRequest > 0) setDialogOpen(true);
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = readAddedDeals();
      const extra = (stored[category] as CrmDeal[] | undefined) ?? [];
      if (extra.length > 0) setList((prev) => [...extra, ...prev]);
    }, 0);
    return () => window.clearTimeout(id);
  }, [category]);

  const handleCreated = (deal: CrmDeal) => {
    writeAddedDeal(category, deal);
    setList((prev) => [deal, ...prev]);
  };

  return (
    <>
      <DealsTable deals={list} onAddDeal={() => setDialogOpen(true)} />
      <NewDealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        owners={owners}
        onCreated={handleCreated}
      />
    </>
  );
}

interface ContactInvoicesTabProps {
  invoices: Invoice[];
}

function ContactInvoicesTab({ invoices }: ContactInvoicesTabProps) {
  if (invoices.length === 0) {
    return (
      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardContent className="py-10 text-center text-xs text-muted-foreground">
          No invoices for this contact yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-ink">Invoices</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Number</th>
              <th className="px-5 py-2.5 text-right font-medium">Amount</th>
              <th className="px-5 py-2.5 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="bg-card">
                <td className="px-5 py-3 font-medium text-ink">{invoice.number}</td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {formatCurrency(invoice.amount)}
                </td>
                <td className="px-5 py-3 text-right">
                  <Badge variant={invoiceStatusVariant[invoice.status]} className="capitalize">
                    {invoice.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ContactTicketsTabProps {
  tickets: SupportTicket[];
}

function ContactTicketsTab({ tickets }: ContactTicketsTabProps) {
  if (tickets.length === 0) {
    return (
      <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <CardContent className="py-10 text-center text-xs text-muted-foreground">
          No support tickets for this contact.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Support Tickets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground">
                {ticket.priority} priority · {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
              </p>
            </div>
            <Badge variant={ticketStatusVariant[ticket.status]}>{ticket.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { ContactDealsTab, ContactInvoicesTab, ContactTicketsTab };