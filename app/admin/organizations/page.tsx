import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { AdminFilters } from "@/components/admin/admin-filters";
import { EmptyState } from "@/components/admin/empty-state";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/section-card";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatNumber } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  listOrganizations,
  type OrganizationFilters,
} from "@/lib/admin/organizations";
import type { OrgWithMeta } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Organizations",
  description: "FinloNexa platform organizations",
};

export const dynamic = "force-dynamic";

function parsePage(value: string | undefined): number {
  const page = parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  await requirePlatformPermission("organizations.view");

  const sp = await searchParams;
  const filters: OrganizationFilters = {
    search: sp.search,
    status: sp.status === "all" ? undefined : (sp.status as OrganizationFilters["status"]),
    page: parsePage(sp.page),
  };

  const result = await listOrganizations(filters);
  const { data: rows, total, pageCount, page } = result;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sp.search) params.set("search", sp.search);
    if (sp.status && sp.status !== "all") params.set("status", sp.status);
    params.set("page", String(targetPage));
    return `/admin/organizations?${params.toString()}`;
  };

  const columns: DataColumn<OrgWithMeta>[] = [
    {
      header: "Organization",
      className: "min-w-[220px]",
      cell: (row) => (
        <div>
          <Link
            href={`/admin/organizations/${row.id}`}
            className="font-semibold text-ink hover:text-primary hover:underline"
          >
            {row.name}
          </Link>
          <p className="text-xs text-muted-foreground">/{row.slug ?? "no-slug"}</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      header: "Plan",
      cell: (row) => (
        <span className="font-medium text-ink">{row.planName ?? "—"}</span>
      ),
    },
    {
      header: "Owner",
      className: "min-w-[180px]",
      cell: (row) => (
        <div>
          <span className="text-ink">{row.ownerName ?? "—"}</span>
          <p className="text-xs text-muted-foreground">{row.ownerEmail ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Members",
      cell: (row) => (
        <span className="font-mono text-ink">{formatNumber(row.memberCount)}</span>
      ),
    },
    {
      header: "Created",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Every company running on the FinloNexa platform."
      >
        <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" aria-hidden />
          {formatNumber(total)} total
        </span>
      </PageHeader>

      <AdminFilters
        placeholder="Search name, slug, country…"
        initialSearch={sp.search}
        selects={[
          {
            name: "status",
            label: "Status",
            defaultValue: sp.status,
            options: [
              { value: "active", label: "Active" },
              { value: "trial", label: "Trial" },
              { value: "paid", label: "Paid" },
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        empty={
          <EmptyState
            icon={Building2}
            title="No organizations found"
            description="Try adjusting the search or filters."
            compact
          />
        }
      />

      <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />
    </div>
  );
}