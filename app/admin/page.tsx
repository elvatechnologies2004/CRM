import type { Metadata } from "next";
import {
  Activity,
  Bot,
  Building2,
  CreditCard,
  Headphones,
  Rocket,
  Save,
  TrendingUp,
  Users,
  UsersRound,
  Waypoints,
} from "lucide-react";

import {
  AdminAreaChart,
  AdminBarChart,
  AdminPieChart,
} from "@/components/admin/charts";
import { NotAvailable } from "@/components/admin/empty-state";
import { PageHeader, SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency, formatNumber } from "@/lib/admin/db";
import { getAnalyticsSnapshot } from "@/lib/admin/analytics";
import { requirePlatformPermission } from "@/lib/admin/auth";
import { getPlatformOverview } from "@/lib/admin/overview";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Overview",
  description: "FinloNexa platform overview",
};

export const dynamic = "force-dynamic";

function MetricValue({
  available,
  value,
  format,
}: {
  available: boolean;
  value: number | null;
  format: (v: number) => string;
}) {
  if (!available || value === null || value === 0) return <NotAvailable />;
  return <span className="font-mono text-2xl font-semibold tracking-tight text-ink">{format(value)}</span>;
}

function ChartOrEmpty({
  hasData,
  children,
  label,
}: {
  hasData: boolean;
  children: React.ReactNode;
  label: string;
}) {
  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        No {label} data yet
      </div>
    );
  }
  return <>{children}</>;
}

export default async function AdminOverviewPage() {
  await requirePlatformPermission("platform.dashboard.view");

  const [overview, analytics] = await Promise.all([
    getPlatformOverview(),
    getAnalyticsSnapshot(),
  ]);

  const revenueHasData = analytics.revenueTrend.some((p) => p.value > 0);
  const orgGrowthHasData = analytics.organizationGrowth.some((p) => p.value > 0);
  const userGrowthHasData = analytics.userGrowth.some((p) => p.value > 0);
  const plansHasData = analytics.planDistribution.length > 0;

  const currencyLabel = "PKR";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Real-time FinloNexa SaaS health across every organization."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Organizations"
          value={formatNumber(overview.totalOrganizations)}
          icon={Building2}
        />
        <StatCard
          label="Total Users"
          value={formatNumber(overview.totalUsers)}
          icon={UsersRound}
        />
        <StatCard
          label="Active Subscriptions"
          value={formatNumber(overview.activeSubscriptions)}
          icon={CreditCard}
          accent="cyan"
        />
        <StatCard
          label="Open Support Tickets"
          value={formatNumber(overview.openSupportTickets)}
          icon={Headphones}
          accent="amber"
        />
        <StatCard
          label="Active Organizations"
          value={formatNumber(overview.activeOrganizations)}
          icon={Users}
          accent="green"
        />
        <StatCard
          label="Trial Organizations"
          value={formatNumber(overview.trialOrganizations)}
          icon={Rocket}
          accent="purple"
        />
        <StatCard
          label="Paid Organizations"
          value={formatNumber(overview.paidOrganizations)}
          icon={CreditCard}
          accent="green"
        />
        <StatCard
          label="System Alerts"
          value={formatNumber(overview.systemAlerts)}
          icon={Activity}
          accent={overview.systemAlerts > 0 ? "red" : "green"}
          hint={overview.systemAlerts > 0 ? "Review System Health" : "All systems nominal"}
        />
        <StatCard
          label="MRR"
          value={
            <MetricValue
              available={overview.mrrAvailable}
              value={overview.mrr}
              format={(v) => formatCurrency(v, currencyLabel)}
            />
          }
          icon={TrendingUp}
        />
        <StatCard
          label="ARR"
          value={
            <MetricValue
              available={overview.arrAvailable}
              value={overview.arr}
              format={(v) => formatCurrency(v, currencyLabel)}
            />
          }
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          label="AI Agents"
          value={formatNumber(overview.aiTotalAgents)}
          icon={Bot}
          accent="purple"
          hint={`${overview.aiPendingApprovals} pending approval${overview.aiPendingApprovals === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Automation Runs"
          value={formatNumber(overview.automationRuns)}
          icon={Waypoints}
          accent="cyan"
          hint={
            overview.automationFailed > 0
              ? `${overview.automationFailed} failed`
              : "No failures"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Organization Growth"
          description="New organizations per month (last 12 months)"
        >
          <ChartOrEmpty hasData={orgGrowthHasData} label="organization">
            <AdminAreaChart data={analytics.organizationGrowth} color="#6366f1" />
          </ChartOrEmpty>
        </SectionCard>

        <SectionCard
          title="User Growth"
          description="New users per month (last 12 months)"
        >
          <ChartOrEmpty hasData={userGrowthHasData} label="user">
            <AdminAreaChart data={analytics.userGrowth} color="#0ea5e9" />
          </ChartOrEmpty>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Revenue Trend"
          description="Completed payments per month (last 12 months)"
          contentClassName="lg:col-span-1"
        >
          <ChartOrEmpty hasData={revenueHasData} label="revenue">
            <AdminBarChart data={analytics.revenueTrend} color="#10b981" />
          </ChartOrEmpty>
        </SectionCard>

        <SectionCard
          title="Plan Distribution"
          description="Active subscriptions by plan"
        >
          {plansHasData ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <AdminPieChart data={analytics.planDistribution.map((p) => ({ label: p.plan, value: p.count }))} />
              </div>
              <ul className={cn("flex flex-col gap-2 text-[13px]", "min-w-[160px]")}>
                {analytics.planDistribution.map((p) => (
                  <li key={p.plan} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{p.plan}</span>
                    <span className="font-semibold text-ink">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              No subscription data yet
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Trial Conversion"
          description="Current trial vs paid subscription state"
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">Trialing</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-ink">
                  {formatNumber(analytics.trialConversion.trial)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">Paid</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-ink">
                  {formatNumber(analytics.trialConversion.paid)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Save className="h-4 w-4" aria-hidden />
                Conversion rate
              </span>
              {analytics.trialConversion.rate === null ? (
                <NotAvailable />
              ) : (
                <StatusBadge value={`${analytics.trialConversion.rate}%`} />
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}