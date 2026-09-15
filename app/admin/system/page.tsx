import type { Metadata } from "next";
import { Activity, CheckCircle2, Info } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import { getSystemHealth, type SystemHealthItem } from "@/lib/admin/system";

export const metadata: Metadata = {
  title: "System Health",
  description: "FinloNexa platform system health",
};

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  await requirePlatformPermission("system.view");

  const { items, alertCount } = await getSystemHealth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Live platform infrastructure status."
      >
        <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground">
          <Activity className="h-3.5 w-3.5" aria-hidden />
          {alertCount} alert{alertCount === 1 ? "" : "s"}
        </span>
      </PageHeader>

      {alertCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm text-[#92400e]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {alertCount} component{alertCount === 1 ? " is" : "s are"} not fully operational.
            Background jobs, cron and external providers are intentionally left
            &quot;Not Configured&quot; until their environment configuration exists.
          </p>
        </div>
      ) : null}

      <SectionCard
        title="Components"
        description="Checked at render time from live configuration and database probes."
      >
        <ul className="divide-y divide-border">
          {items.map((item: SystemHealthItem) => (
            <li key={item.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {item.status === "Operational" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <Activity className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <div>
                  <p className="font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 pl-7 sm:pl-0">
                {item.lastSuccess ? (
                  <span className="text-xs text-muted-foreground" title={`Checked ${formatDate(item.checkedAt)}`}>
                    OK {formatDate(item.lastSuccess)}
                  </span>
                ) : null}
                <StatusBadge value={item.status} />
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}