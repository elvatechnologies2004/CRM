import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, Wallet } from "lucide-react";

import { AdminFilters } from "@/components/admin/admin-filters";
import { EmptyState } from "@/components/admin/empty-state";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/section-card";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency, formatDate } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  getSubscriptionCounts,
  listSubscriptions,
  type PlatformSubscription,
} from "@/lib/admin/subscriptions";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "FinloNexa platform subscriptions",
};

export const dynamic = "force-dynamic";

function parsePage(value: string | undefined): number {
  const page = parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  await requirePlatformPermission("subscriptions.view");

  const sp = await searchParams;
  const page = parsePage(sp.page);
  const [result, counts] = await Promise.all([
    listSubscriptions({
      search: sp.search,
      status: sp.status === "all" ? undefined : sp.status,
      page,
    }),
    getSubscriptionCounts(),
  ]);
  const { data: rows, total, pageCount } = result;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sp.search) params.set("search", sp.search);
    if (sp.status && sp.status !== "all") params.set("status", sp.status);
    params.set("page", String(targetPage));
    return `/admin/subscriptions?${params.toString()}`;
  };

  const columns: DataColumn<PlatformSubscription>[] = [
    {
      header: "Organization",
      className: "min-w-[200px]",
      cell: (row) => (
        <Link
          href={`/admin/organizations/${row.organizationId}`}
          className="font-medium text-ink hover:text-primary hover:underline"
        >
          {row.organizationName}
        </Link>
      ),
    },
    {
      header: "Plan",
      cell: (row) => <span className="font-medium text-ink">{row.planName ?? "—"}</span>,
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      header: "Amount",
      cell: (row) => (
        <span className="font-mono text-ink">
          {row.amount !== null && row.amount !== undefined
            ? formatCurrency(row.amount, row.currency ?? undefined)
            : "—"}
        </span>
      ),
    },
    {
      header: "Cycle",
      cell: (row) => (
        <span className="text-ink">{row.billingCycle ?? "—"}</span>
      ),
    },
    {
      header: "Renewal",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.renewalDate)}</span>,
    },
    {
      header: "Provider",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.provider}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Active and historical subscriptions with plan and renewal details."
      >
        <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          {counts.total ?? 0} total
        </span>
        <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" aria-hidden />
          {counts.Active ?? counts.active ?? 0} active
        </span>
      </PageHeader>

      <AdminFilters
        placeholder="Search plan or status…"
        initialSearch={sp.search}
        selects={[
          {
            name: "status",
            label: "Status",
            defaultValue: sp.status,
            options: [
              { value: "active", label: "Active" },
              { value: "trial", label: "Trial" },
              { value: "past_due", label: "Past due" },
              { value: "cancelled", label: "Cancelled" },
              { value: "expired", label: "Expired" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        empty={
          <EmptyState
            icon={Wallet}
            title="No subscriptions found"
            description="Try adjusting the search or filters."
            compact
          />
        }
      />

      <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />
    </div>
  );
}