import type { Metadata } from "next";
import {
  Bot,
  CheckCircle2,
  Clock,
  Cpu,
  Sparkles,
  XCircle,
} from "lucide-react";

import { NotAvailable } from "@/components/admin/empty-state";
import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatNumber } from "@/lib/admin/db";
import { requirePlatformPermission } from "@/lib/admin/auth";
import { getAiOperational } from "@/lib/admin/ai";

export const metadata: Metadata = {
  title: "AI Operations",
  description: "FinloNexa AI operational view",
};

export const dynamic = "force-dynamic";

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, number>;
}) {
  const entries = Object.entries(rows);
  return (
    <SectionCard title={title} description="Distribution by status">
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No records yet</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map(([status, count]) => (
            <li key={status} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground capitalize">{status}</span>
              <span className="font-mono text-sm font-semibold text-ink">{formatNumber(count)}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export default async function AdminAiPage() {
  await requirePlatformPermission("ai.view");

  const ai = await getAiOperational();

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Operations"
        description="Gemini-powered agents, approvals and recommendations across the platform."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total AI Agents" value={formatNumber(ai.totalAgents)} icon={Bot} accent="purple" />
        <StatCard label="Pending Approvals" value={formatNumber(ai.pendingApprovals)} icon={Clock} accent="amber" />
        <StatCard label="Failed / Rejected" value={formatNumber(ai.failedRuns)} icon={XCircle} accent="red" />
        <StatCard label="Provider" value={ai.providerConfigured ? "Gemini" : "Not Configured"} icon={Cpu} accent={ai.providerConfigured ? "green" : "amber"} />
        <StatCard
          label="Token Usage"
          value={<NotAvailable label="Not Available" />}
          icon={Sparkles}
          hint="AI request tables are not yet provisioned"
        />
        <StatCard label="Active Agents" value="Live" icon={CheckCircle2} accent="green" hint="Statuses below" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Breakdown title="Agents by Status" rows={ai.agentsByStatus} />
        <Breakdown title="Approvals by Status" rows={ai.approvalsByStatus} />
        <Breakdown title="Recommendations by Status" rows={ai.recommendationsByStatus} />
      </div>

      <SectionCard
        title="Provider status"
        description="Gemini connectivity is read from live environment configuration."
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge value={ai.providerConfigured ? "connected" : "not configured"} />
          <span className="text-sm text-muted-foreground">
            {ai.providerConfigured
              ? "Gemini API is configured — agent requests will be served."
              : "Add GEMINI_API_KEY (and optionally GEMINI_MODEL) to enable AI features."}
          </span>
        </div>
      </SectionCard>
    </div>
  );
}