import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Building2,
  CheckCircle2,
  FileText,
  FolderKanban,
  Handshake,
  Headphones,
  Inbox,
  ShieldCheck,
  Users,
  Waypoints,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import {
  getOrganizationDetail,
  type OrganizationMemberRow,
} from "@/lib/admin/organizations";

export const metadata: Metadata = {
  title: "Organization Detail",
  description: "FinloNexa organization detail",
};

export const dynamic = "force-dynamic";

function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return "Not Available";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function RecordStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return <StatCard label={label} value={formatNumber(value)} icon={Icon} />;
}

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformPermission("organizations.view");

  const { id } = await params;
  const detail = await getOrganizationDetail(id);
  if (!detail) notFound();

  const { org, members, counts } = detail;

  const memberColumns: DataColumn<OrganizationMemberRow>[] = [
    {
      header: "User",
      className: "min-w-[200px]",
      cell: (row) => (
        <div>
          <span className="font-medium text-ink">{row.name ?? "—"}</span>
          <p className="text-xs text-muted-foreground">{row.email ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (row) => <span className="text-ink">{row.roleName ?? "—"}</span>,
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      header: "Joined",
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.joinedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={org.name}
        description={`Platform record for organization ${org.slug ?? ""}`.trim()}
      >
        <Link href="/admin/organizations">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to organizations
          </Button>
        </Link>
      </PageHeader>

      <SectionCard
        title="Summary"
        description="Core organization record and subscription state"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner</p>
            <p className="font-medium text-ink">{org.ownerName ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{org.ownerEmail ?? ""}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
            <StatusBadge value={org.status} />
            <p className="text-sm text-muted-foreground">
              Plan: {org.planName ?? "—"} · Sub: {org.subscriptionStatus ?? "none"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</p>
            <p className="text-sm text-ink">
              {org.country ?? "Country —"} · {org.timezone ?? "UTC"}
            </p>
            <p className="text-sm text-muted-foreground">
              Currency: {org.default_currency ?? "—"} · Created {formatDate(org.created_at)}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RecordStat label="Leads" value={counts.leads ?? 0} icon={Inbox} />
        <RecordStat label="Contacts" value={counts.contacts ?? 0} icon={Users} />
        <RecordStat label="Companies" value={counts.companies ?? 0} icon={Building2} />
        <RecordStat label="Deals" value={counts.deals ?? 0} icon={Handshake} />
        <RecordStat label="Invoices" value={counts.invoices ?? 0} icon={FileText} />
        <RecordStat label="Projects" value={counts.projects ?? 0} icon={FolderKanban} />
        <RecordStat label="Support Tickets" value={counts.support_tickets ?? 0} icon={Headphones} />
        <RecordStat label="AI Agents" value={counts.ai_agents ?? 0} icon={Bot} />
        <RecordStat label="Automations" value={counts.automations ?? 0} icon={Waypoints} />
        <RecordStat label="Automation Runs" value={counts.automation_runs ?? 0} icon={Zap} />
        <StatCard label="Storage Attachments" value={formatBytes(counts.attachments_bytes)} icon={FolderKanban} />
        <StatCard label="Verified" value="Live" icon={CheckCircle2} accent="green" />
      </div>

      <SectionCard
        title={`Members (${formatNumber(org.memberCount)})`}
        description="Organization membership and roles"
      >
        <DataTable
          columns={memberColumns}
          rows={members}
          empty={
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              No members
            </div>
          }
        />
      </SectionCard>
    </div>
  );
}