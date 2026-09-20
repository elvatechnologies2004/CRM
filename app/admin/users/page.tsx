import type { Metadata } from "next";
import { UserX, Users } from "lucide-react";

import { AdminFilters } from "@/components/admin/admin-filters";
import { EmptyState } from "@/components/admin/empty-state";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/section-card";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import { listUsers, type PlatformUser } from "@/lib/admin/users";

export const metadata: Metadata = {
  title: "Users",
  description: "FinloNexa platform users",
};

export const dynamic = "force-dynamic";

function parsePage(value: string | undefined): number {
  const page = parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  await requirePlatformPermission("users.view");

  const sp = await searchParams;
  const page = parsePage(sp.page);
  const result = await listUsers({
    search: sp.search,
    status: sp.status,
    page,
  });
  const { data: rows, total, pageCount } = result;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sp.search) params.set("search", sp.search);
    if (sp.status && sp.status !== "all") params.set("status", sp.status);
    params.set("page", String(targetPage));
    return `/admin/users?${params.toString()}`;
  };

  const columns: DataColumn<PlatformUser>[] = [
    {
      header: "User",
      className: "min-w-[220px]",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {row.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (row.name ?? row.email ?? "U").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.name ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{row.email ?? ""}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Organization",
      className: "min-w-[160px]",
      cell: (row) => (
        <span className="text-ink">{row.organizationName ?? "—"}</span>
      ),
    },
    {
      header: "Role",
      className: "min-w-[140px]",
      cell: (row) => {
        if (row.isPlatformAdmin) {
          return <Badge variant="purple">Platform Admin</Badge>;
        }
        if (row.organizationRoleName && row.organizationRoleName !== "—") {
          return <Badge variant="outline">{row.organizationRoleName}</Badge>;
        }
        return <span className="text-xs text-muted-foreground">User</span>;
      },
    },
    {
      header: "Region",
      className: "min-w-[120px]",
      cell: (row) => (
        <span className="text-muted-foreground">{row.salesRegionName ?? "—"}</span>
      ),
    },
    {
      header: "Reports To",
      className: "min-w-[140px]",
      cell: (row) => (
        <span className="text-ink">{row.reportsToName ?? "—"}</span>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      header: "Orgs",
      cell: (row) => <span className="font-mono text-ink">{formatNumber(row.orgCount)}</span>,
    },
    {
      header: "Created",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Every user account registered on the platform, across all organizations."
      >
        <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {formatNumber(total)} users
        </span>
      </PageHeader>

      <AdminFilters
        placeholder="Search name or email…"
        initialSearch={sp.search}
        selects={[
          {
            name: "status",
            label: "Status",
            defaultValue: sp.status,
            options: [
              { value: "active", label: "Active" },
              { value: "invited", label: "Invited" },
              { value: "suspended", label: "Suspended" },
              { value: "deactivated", label: "Deactivated" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        empty={
          <EmptyState
            icon={UserX}
            title="No users found"
            description="Try adjusting the search or filters."
            compact
          />
        }
      />

      <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />
    </div>
  );
}