import type { Metadata } from "next";
import { ShieldCheck, ShieldX } from "lucide-react";

import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { EmptyState, NotAvailable } from "@/components/admin/empty-state";
import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { getAdminDb } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  hasPlatformPermission,
} from "@/lib/admin/permissions";
import {
  BLOCKABLE_FEATURES,
  listOrgControls,
  type OrgControl,
} from "@/lib/admin/controls";
import { OrgControlEditor } from "./org-control-editor";

export const metadata: Metadata = {
  title: "Org Controls",
  description: "Block or limit features per organization",
};

export const dynamic = "force-dynamic";

interface OrgRow {
  id: string;
  name: string;
}

export default async function AdminControlsPage() {
  const ctx = await requirePlatformPermission("platform_settings.manage");
  const canManage = hasPlatformPermission(ctx.role, "platform_settings.manage");

  const [controls, orgs] = await Promise.all([
    listOrgControls(),
    (async () => {
      try {
        const db = getAdminDb();
        const { data } = await db
          .from("organizations")
          .select("id, name")
          .order("created_at", { ascending: false });
        return (data ?? []) as OrgRow[];
      } catch {
        return [];
      }
    })(),
  ]);

  const controlByOrg = new Map(controls.map((c) => [c.organizationId, c]));
  const allOrgs: {
    org: OrgRow;
    control: OrgControl;
  }[] = orgs.map((org) => ({
    org,
    control: controlByOrg.get(org.id) ?? {
      organizationId: org.id,
      organizationName: org.name,
      status: "active",
      blockedFeatures: [],
      reason: null,
      updatedBy: null,
      updatedAt: null,
    },
  }));

  const columns: DataColumn<{ org: OrgRow; control: OrgControl }>[] = [
    {
      header: "Organization",
      className: "min-w-[180px]",
      cell: (row) => (
        <span className="font-medium text-ink">{row.control.organizationName ?? row.org.name}</span>
      ),
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.control.status} />,
    },
    {
      header: "Blocked Features",
      className: "min-w-[200px]",
      cell: (row) =>
        row.control.blockedFeatures.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.control.blockedFeatures.map((key) => {
              const feature = BLOCKABLE_FEATURES.find((f) => f.key === key);
              return (
                <Badge key={key} variant="danger">
                  {feature?.label ?? key}
                </Badge>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        ),
    },
    {
      header: "Reason",
      className: "min-w-[140px]",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">{row.control.reason ?? "—"}</span>
      ),
    },
    {
      header: "Updated",
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.control.updatedAt ? new Date(row.control.updatedAt).toISOString().slice(0, 10) : "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (row) =>
        canManage ? (
          <OrgControlEditor
            organizationId={row.org.id}
            organizationName={row.org.name}
            initial={{
              status: row.control.status,
              blockedFeatures: row.control.blockedFeatures,
              reason: row.control.reason,
            }}
          />
        ) : (
          <NotAvailable label="Read only" />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Controls"
        description="Block or limit what each organization can use — AI, automations, integrations, billing and more. Every change is audit-logged."
      />

      <SectionCard
        title={`${allOrgs.length} organizations`}
        description="Set a status and block specific features. Suspended organizations are fully blocked."
      >
        <DataTable
          columns={columns}
          rows={allOrgs}
          empty={
            <EmptyState
              icon={ShieldX}
              title="No organizations"
              description="Organizations will appear here once they exist on the platform."
              compact
            />
          }
        />
      </SectionCard>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
        Controls are stored in <span className="font-mono">platform_org_controls</span> and
        enforced by the platform before features run. Changes are written to the audit log.
      </div>
    </div>
  );
}