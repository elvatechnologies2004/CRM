import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Clock, Waypoints } from "lucide-react";

import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatNumber } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  getAutomationOperational,
  type FailedRun,
} from "@/lib/admin/automations";

export const metadata: Metadata = {
  title: "Automations",
  description: "FinloNexa automation operations",
};

export const dynamic = "force-dynamic";

export default async function AdminAutomationsPage() {
  await requirePlatformPermission("automations.view");

  const data = await getAutomationOperational();

  const columns: DataColumn<FailedRun>[] = [
    {
      header: "Organization",
      className: "min-w-[180px]",
      cell: (row) => <span className="font-medium text-ink">{row.organizationName}</span>,
    },
    {
      header: "Automation",
      className: "min-w-[200px]",
      cell: (row) => <span className="text-ink">{row.automationName ?? "—"}</span>,
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      header: "Error",
      className: "min-w-[280px]",
      cell: (row) => (
        <span className="block max-w-[340px] truncate text-xs text-muted-foreground" title={row.errorMessage ?? undefined}>
          {row.errorMessage ?? "No error message"}
        </span>
      ),
    },
    {
      header: "Started",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.startedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        description="Automation runs and queued jobs across all organizations."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Runs" value={formatNumber(data.totalRuns)} icon={Waypoints} accent="cyan" />
        <StatCard
          label="Success Rate"
          value={data.successRate === null ? "—" : `${data.successRate}%`}
          icon={CheckCircle2}
          accent={data.successRate === null ? "amber" : data.successRate >= 80 ? "green" : "red"}
        />
        <StatCard label="Total Jobs" value={formatNumber(data.totalJobs)} icon={Waypoints} />
        <StatCard label="Pending Jobs" value={formatNumber(data.pendingJobs)} icon={Clock} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Run Status Breakdown" description="All runs grouped by status">
          {Object.keys(data.byStatus).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No runs recorded yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {Object.entries(data.byStatus).map(([status, count]) => (
                <li key={status} className="flex items-center justify-between py-2.5 capitalize">
                  <span className="text-sm text-muted-foreground">{status}</span>
                  <span className="font-mono text-sm font-semibold text-ink">{formatNumber(count)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Failed Runs"
          description="Latest failed or partial automation runs (max 10)"
          action={
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-danger/10 px-2 text-[11px] font-medium text-[#b91c1c]">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              {data.failedJobs} failed jobs
            </span>
          }
        >
          <DataTable
            columns={columns}
            rows={data.recentFailed}
            empty={
              <EmptyState
                icon={CheckCircle2}
                title="No failed runs"
                description="Automation runs are executing without failures."
                compact
              />
            }
          />
        </SectionCard>
      </div>
    </div>
  );
}