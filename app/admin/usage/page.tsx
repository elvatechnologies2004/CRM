import type { Metadata } from "next";
import {
  Building2,
  Database,
  Gauge,
  Handshake,
  Inbox,
  Rocket,
  Users,
  Workflow,
} from "lucide-react";

import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatNumber } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import { getUsageSummary, type UsageRow } from "@/lib/admin/usage";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Usage & Limits",
  description: "FinloNexa platform usage and plan limits",
};

export const dynamic = "force-dynamic";

function UsageCell({ row }: { row: UsageRow }) {
  const used = row.counts.contacts ?? 0;
  const limit = row.limitValue;
  if (limit <= 0) {
    return <span className="text-xs text-muted-foreground">No plan limit</span>;
  }
  const percent = Math.min(100, row.limitPercent);
  return (
    <div className="flex min-w-[140px] flex-col gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            percent >= 100 ? "bg-danger" : percent >= 80 ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {formatNumber(used)} / {formatNumber(limit)} contacts ({row.limitPercent}%)
      </p>
    </div>
  );
}

export default async function AdminUsagePage() {
  await requirePlatformPermission("usage.view");

  const summary = await getUsageSummary();

  const columns: DataColumn<UsageRow>[] = [
    {
      header: "Organization",
      className: "min-w-[180px]",
      cell: (row) => <span className="font-medium text-ink">{row.organizationName}</span>,
    },
    {
      header: "Plan",
      cell: (row) => <span className="text-ink">{row.planName ?? "—"}</span>,
    },
    {
      header: "Contact Usage vs Limit",
      className: "min-w-[220px]",
      cell: (row) => <UsageCell row={row} />,
    },
    {
      header: "Leads",
      cell: (row) => <span className="font-mono text-ink">{formatNumber(row.counts.leads ?? 0)}</span>,
    },
    {
      header: "Companies",
      cell: (row) => <span className="font-mono text-ink">{formatNumber(row.counts.companies ?? 0)}</span>,
    },
    {
      header: "Deals",
      cell: (row) => <span className="font-mono text-ink">{formatNumber(row.counts.deals ?? 0)}</span>,
    },
    {
      header: "Users",
      cell: (row) => <span className="font-mono text-ink">{formatNumber(row.counts.users ?? 0)}</span>,
    },
    {
      header: "Automation Runs",
      cell: (row) => (
        <span className="font-mono text-ink">{formatNumber(row.counts.automation_runs ?? 0)}</span>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage & Limits"
        description="Resource consumption per organization against plan limits."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value={formatNumber(summary.totals.organizations ?? 0)} icon={Building2} />
        <StatCard label="Users" value={formatNumber(summary.totals.users ?? 0)} icon={Users} accent="cyan" />
        <StatCard label="Leads" value={formatNumber(summary.totals.leads ?? 0)} icon={Inbox} />
        <StatCard label="Contacts" value={formatNumber(summary.totals.contacts ?? 0)} icon={Database} accent="green" />
        <StatCard label="Companies" value={formatNumber(summary.totals.companies ?? 0)} icon={Building2} accent="purple" />
        <StatCard label="Deals" value={formatNumber(summary.totals.deals ?? 0)} icon={Handshake} accent="amber" />
        <StatCard label="Automation Runs" value={formatNumber(summary.totals.automation_runs ?? 0)} icon={Workflow} accent="cyan" />
        <StatCard label="Limit Basis" value="Plan limits" icon={Gauge} />
      </div>

      <SectionCard
        title="Per-organization usage"
        description="Contact usage vs the plan-seat limit; sorted by contact count."
      >
        <DataTable
          columns={columns}
          rows={summary.perOrganization}
          empty={
            <EmptyState
              icon={Rocket}
              title="No organizations yet"
              description="Usage data will appear here once organizations and subscriptions exist."
              compact
            />
          }
        />
      </SectionCard>
    </div>
  );
}