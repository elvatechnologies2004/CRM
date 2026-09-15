import type { Metadata } from "next";
import { Headphones, LifeBuoy } from "lucide-react";

import { AdminFilters } from "@/components/admin/admin-filters";
import { EmptyState } from "@/components/admin/empty-state";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/section-card";
import { Pagination } from "@/components/admin/pagination";
import { PriorityBadge, StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  getOpenTicketCount,
  listSupportTickets,
  type PlatformSupportTicket,
} from "@/lib/admin/support";

export const metadata: Metadata = {
  title: "Support",
  description: "FinloNexa platform support tickets",
};

export const dynamic = "force-dynamic";

function parsePage(value: string | undefined): number {
  const page = parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; priority?: string; page?: string }>;
}) {
  await requirePlatformPermission("support.view");

  const sp = await searchParams;
  const page = parsePage(sp.page);
  const [result, openCount] = await Promise.all([
    listSupportTickets({
      search: sp.search,
      status: sp.status,
      priority: sp.priority,
      page,
    }),
    getOpenTicketCount(),
  ]);
  const { data: rows, total, pageCount } = result;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sp.search) params.set("search", sp.search);
    if (sp.status && sp.status !== "all") params.set("status", sp.status);
    if (sp.priority && sp.priority !== "all") params.set("priority", sp.priority);
    params.set("page", String(targetPage));
    return `/admin/support?${params.toString()}`;
  };

  const columns: DataColumn<PlatformSupportTicket>[] = [
    {
      header: "Ticket",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">{row.ticketNumber ?? "—"}</span>
      ),
    },
    {
      header: "Organization",
      className: "min-w-[180px]",
      cell: (row) => <span className="font-medium text-ink">{row.organizationName}</span>,
    },
    {
      header: "Subject",
      className: "min-w-[240px]",
      cell: (row) => <span className="text-ink">{row.subject}</span>,
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      header: "Priority",
      cell: (row) => <PriorityBadge value={row.priority} />,
    },
    {
      header: "Assigned To",
      cell: (row) => <span className="text-ink">{row.assignedTo ?? "—"}</span>,
    },
    {
      header: "Created",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Support"
        description="Tickets raised by organizations across the platform."
      >
        <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
          <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
          {openCount} open
        </span>
      </PageHeader>

      <AdminFilters
        placeholder="Search subject or ticket number…"
        initialSearch={sp.search}
        selects={[
          {
            name: "status",
            label: "Status",
            defaultValue: sp.status,
            options: [
              { value: "New", label: "New" },
              { value: "Open", label: "Open" },
              { value: "In Progress", label: "In Progress" },
              { value: "Pending", label: "Pending" },
              { value: "Resolved", label: "Resolved" },
              { value: "Closed", label: "Closed" },
            ],
          },
          {
            name: "priority",
            label: "Priority",
            defaultValue: sp.priority,
            options: [
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
              { value: "Urgent", label: "Urgent" },
              { value: "Critical", label: "Critical" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        empty={
          <EmptyState
            icon={Headphones}
            title="No tickets found"
            description="Try adjusting the search or filters."
            compact
          />
        }
      />

      <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />
    </div>
  );
}