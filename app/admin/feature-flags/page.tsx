import type { Metadata } from "next";
import { Flag } from "lucide-react";

import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState, NotAvailable } from "@/components/admin/empty-state";
import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  hasPlatformPermission,
} from "@/lib/admin/permissions";
import { listFeatureFlags, type PlatformFeatureFlag } from "@/lib/admin/feature-flags";
import { FlagToggle } from "./flag-toggle";

export const metadata: Metadata = {
  title: "Feature Flags",
  description: "FinloNexa platform feature flags",
};

export const dynamic = "force-dynamic";

export default async function AdminFeatureFlagsPage() {
  const ctx = await requirePlatformPermission("feature_flags.view");
  const canManage = hasPlatformPermission(ctx.role, "feature_flags.manage");

  const flags = await listFeatureFlags();

  const columns: DataColumn<PlatformFeatureFlag>[] = [
    {
      header: "Flag",
      className: "min-w-[220px]",
      cell: (row) => (
        <div>
          <p className="font-mono text-sm font-semibold text-ink">{row.key}</p>
          <p className="text-xs text-muted-foreground">{row.label ?? row.description ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Scope",
      cell: (row) => <Badge variant="outline">{row.scope}</Badge>,
    },
    {
      header: "Target",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.scope === "plan" ? (row.planCode ?? "—") : row.scope === "organization" ? row.organizationId ?? "—" : "All"}
        </span>
      ),
    },
    {
      header: "Updated By",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.updatedBy?.slice(0, 12) ?? "—"}</span>,
    },
    {
      header: "Updated",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.updatedAt)}</span>,
    },
    {
      header: "Enabled",
      cell: (row) => (
        <StatusBadge value={row.enabled ? "active" : "deactivated"} />
      ),
    },
    {
      header: "Action",
      cell: (row) =>
        canManage ? (
          <FlagToggle flag={row} />
        ) : (
          <NotAvailable label="Read only" />
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Global, plan and organization-scoped capability toggles. Managed actions require the feature_flags.manage permission and are audit-logged."
      />

      <SectionCard
        title={`${flags.length} flags`}
        description="Flags are evaluated by server-side authorization checks."
      >
        <DataTable
          columns={columns}
          rows={flags}
          empty={
            <EmptyState
              icon={Flag}
              title="No feature flags"
              description="Apply the platform_admin migration to seed the default flags."
              compact
            />
          }
        />
      </SectionCard>
    </div>
  );
}