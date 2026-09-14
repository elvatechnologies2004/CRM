"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CrmSupportTicket } from "@/lib/types";

interface SupportPageClientProps {
  initialTickets: CrmSupportTicket[];
}

function SupportPageClient({ initialTickets }: SupportPageClientProps) {
  const tickets = useMemo(() => initialTickets, [initialTickets]);

  const statusTone: Record<CrmSupportTicket["status"], "info" | "success" | "warning" | "danger"> = {
    Open: "info",
    "In Progress": "warning",
    Resolved: "success",
    Closed: "info",
  };

  const priorityTone: Record<CrmSupportTicket["priority"], "secondary" | "warning" | "danger" | "info"> = {
    Low: "info",
    Medium: "warning",
    High: "danger",
    Urgent: "danger",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Support</h1>
        <Button size="sm" variant="ghost">
          + New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tickets.map((ticket) => {
          const StatusTone = statusTone[ticket.status];
          const PriorityTone = priorityTone[ticket.priority];
          return (
            <div
              key={ticket.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-2">
                <p className="font-medium text-ink truncate">{ticket.title}</p>
                <Badge variant={StatusTone} className="text-[10px]">
                  {ticket.status}
                </Badge>
                <Badge variant={PriorityTone} className="text-[10px] ml-2">
                  {ticket.priority}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {ticket.customerName}
                  {ticket.dealName ? ` · ${ticket.dealName}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(ticket.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                  {ticket.slaDue && ` · SLA due ${new Date(ticket.slaDue).toLocaleDateString("en-US", { timeZone: "UTC" })}`}
                </p>
              </div>
            </div>
          );
        })}
        {tickets.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tickets found.
          </p>
        )}
      </div>
    </div>
  );
}

export { SupportPageClient };