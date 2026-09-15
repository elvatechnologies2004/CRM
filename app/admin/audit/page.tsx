import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { AdminFilters } from "@/components/admin/admin-filters";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/section-card";
import { Pagination } from "@/components/admin/pagination";
import { formatDate } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  listPlatformAuditLog,
  type PlatformAuditEntry,
} from "@/lib/admin/audit";

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "FinloNexa platform audit trail",
};

export const dynamic = "force-dynamic";

function parsePage(value: string | undefined): number {
  const page = parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

const KNOWN_ACTIONS = [
  "platform_admin.created",
  "platform_admin.role_changed",
  "platform_admin.status_changed",
  "feature_flag.changed",
];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  await requirePlatformPermission("audit.view");

  const sp = await searchParams;
  const page = parsePage(sp.page);
  const result = await listPlatformAuditLog({
    action: sp.action,
    page,
  });
  const { data: rows, total, pageCount } = result;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sp.action && sp.action !== "all") params.set("action", sp.action);
    params.set("page", String(targetPage));
    return `/admin/audit?${params.toString()}`;
  };

  const columns: DataColumn<PlatformAuditEntry>[] = [
    {
      header: "Time",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
    {
      header: "Admin",
      className: "min-w-[140px]",
      cell: (row) => <span className="font-medium text-ink">{row.adminUser ?? "System"}</span>,
    },
    {
      header: "Action",
      className: "min-w-[180px]",
      cell: (row) => <span className="font-mono text-xs text-ink">{row.action}</span>,
    },
    {
      header: "Target",
      className: "min-w-[200px]",
      cell: (row) => (
        <div>
          <span className="text-ink">{row.targetLabel ?? "—"}</span>
          <p className="text-xs text-muted-foreground">
            {row.targetType ?? "—"}
            {row.targetId ? ` · ${row.targetId.slice(0, 12)}` : ""}
          </p>
        </div>
      ),
    },
    {
      header: "Organization",
      className: "min-w-[160px]",
      cell: (row) => <span className="text-ink">{row.organizationName ?? "—"}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Append-only trail of platform administration actions. Never editable."
      />

      <AdminFilters
        placeholder="Tip: use the Action menu to filter"
        selects={[
          {
            name: "action",
            label: "Action",
            defaultValue: sp.action,
            options: KNOWN_ACTIONS.map((action) => ({ value: action, label: action })),
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        empty={
          <EmptyState
            icon={ScrollText}
            title="No audit entries yet"
            description="Administration actions will be recorded here once the platform_admins migration is applied."
            compact
          />
        }
      />

      <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />
    </div>
  );
}