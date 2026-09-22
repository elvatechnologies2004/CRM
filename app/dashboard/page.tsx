import dynamic from "next/dynamic";
import {
  BadgeCheck,
  DollarSign,
  Handshake,
  Users,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { DealRisks } from "@/components/dashboard/deal-risks";
import { MeetingsCard } from "@/components/dashboard/meetings-card";
import { RecentLeads } from "@/components/dashboard/recent-leads";
import { StatCard } from "@/components/dashboard/stat-card";
import { TeamPerformance } from "@/components/dashboard/team-performance";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { getRoleDashboardData } from "@/lib/crm/dashboard";
import { getActivation } from "@/lib/onboarding";
import { TrialBanner } from "@/components/onboarding/trial-banner";
import { ActivationCard } from "@/components/onboarding/activation-card";
import { SectionCard } from "@/section-card";

const DealsStageChart = dynamic(
  () => import("@/components/charts/deals-stage-chart").then((mod) => mod.DealsStageChart),
  {
    loading: () => <div className="h-[280px] animate-pulse rounded-2xl border border-border bg-card/80" />,
  },
);

const RevenueChart = dynamic(
  () => import("@/components/charts/revenue-chart").then((mod) => mod.RevenueChart),
  {
    loading: () => <div className="h-[280px] animate-pulse rounded-2xl border border-border bg-card/80" />,
  },
);

const SalesPerformance = dynamic(
  () => import("@/components/charts/sales-performance").then((mod) => mod.SalesPerformance),
  {
    loading: () => <div className="h-[280px] animate-pulse rounded-2xl border border-border bg-card/80" />,
  },
);

const AIAssistant = dynamic(
  () => import("@/components/dashboard/ai-assistant").then((mod) => mod.AIAssistant),
  {
    loading: () => <div className="h-[280px] animate-pulse rounded-2xl border border-border bg-card/80" />,
  },
);

const kpiIcons = [
  { icon: Users, tone: "indigo" as const },
  { icon: Handshake, tone: "blue" as const },
  { icon: DollarSign, tone: "purple" as const },
  { icon: BadgeCheck, tone: "green" as const },
];

export const revalidate = 3;

const emptyDashboard = {
  kpi: [
    { id: "total-leads", label: "Total Leads", value: "0", change: "", comparison: "all time" },
    { id: "active-deals", label: "Active Deals", value: "0", change: "", comparison: "open" },
    { id: "expected-revenue", label: "Expected Revenue", value: "Rs 0", change: "", comparison: "weighted" },
    { id: "won-deals", label: "Won Deals", value: "0", change: "", comparison: "this month" },
  ],
  revenue: [],
  dealsByStage: [],
  recentLeads: [],
  upcomingTasks: [],
  todayMeetings: [],
  dealRisks: [],
};

export default async function DashboardPage() {
  const dashboard = (await getRoleDashboardData()) ?? {
    ...emptyDashboard,
    role: "other",
    title: "Dashboard",
    subtitle: "Business overview for your active organization.",
    teamMembers: [],
  };
  const activation = await getActivation();
  const kpi = dashboard.kpi;
  const stageData = dashboard.dealsByStage;
  const revenueData = dashboard.revenue;
  const leads = dashboard.recentLeads;
  const tasks = dashboard.upcomingTasks;
  const meetings = dashboard.todayMeetings;
  const risks = dashboard.dealRisks;
  const roleDetails = dashboard.roleDetails;

  const realLeadHrefByName = dashboard.recentLeads.reduce<Record<string, string>>((acc, lead) => {
    acc[lead.name.toLowerCase()] = `/leads/${lead.id}`;
    if (lead.company) acc[lead.company.toLowerCase()] = `/leads/${lead.id}`;
    return acc;
  }, {});
  const realLeadHrefByCompany = dashboard.recentLeads.reduce<Record<string, string>>((acc, lead) => {
    if (lead.company) acc[lead.company.toLowerCase()] = `/leads/${lead.id}`;
    return acc;
  }, {});
  const resolvedHrefsByName = realLeadHrefByName;
  const resolvedHrefsByCompany = realLeadHrefByCompany;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5 pb-10">
      <TrialBanner />
      <DashboardHeader title={dashboard.title} subtitle={dashboard.subtitle} />
      <div className="flex justify-start">
        <DashboardTabs />
      </div>

      <section
        aria-label="Key metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpi.map((stat, index) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            comparison={stat.comparison}
            icon={kpiIcons[index]?.icon ?? Users}
            tone={kpiIcons[index]?.tone ?? "indigo"}
          />
        ))}
      </section>

      <section
        aria-label="Revenue and deals overview"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12"
      >
        <div className="min-w-0 md:col-span-1 xl:col-span-3">
          <DealsStageChart data={stageData} />
        </div>
        <div className="min-w-0 md:col-span-2 xl:col-span-6">
          <RevenueChart data={revenueData} />
        </div>
        <div className="min-w-0 md:col-span-1 xl:col-span-3">
          <AIAssistant />
        </div>
      </section>

      <section
        aria-label="Leads and tasks"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12"
      >
        <div className="min-w-0 md:col-span-2 xl:col-span-8">
          <RecentLeads leads={leads} leadHrefs={resolvedHrefsByName} />
        </div>
        <div className="min-w-0 xl:col-span-4">
          <div className="flex flex-col gap-5">
            <UpcomingTasks tasks={tasks} />
            {activation ? (
              <ActivationCard
                milestones={activation.milestones}
                score={activation.score}
                doneCount={activation.doneCount}
                totalCount={activation.totalCount}
              />
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-label="Sales performance and meetings"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12"
      >
        <div className="min-w-0 md:col-span-2 xl:col-span-8">
          <SalesPerformance />
        </div>
        <div className="min-w-0 xl:col-span-4">
          <MeetingsCard meetings={meetings} leadHrefs={resolvedHrefsByCompany} />
        </div>
      </section>

      <section
        aria-label="Team and deal risks"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12"
      >
        <div className="min-w-0 xl:col-span-6">
          <TeamPerformance members={dashboard.teamMembers} />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <DealRisks risks={risks} />
        </div>
      </section>

      {renderRoleDashboardSections(dashboard.role, roleDetails)}
    </div>
  );
}

function renderRoleDashboardSections(
  role: "bdo" | "rsm" | "head_of_sales" | "admin" | "other",
  roleDetails?: {
    actionable?: {
      upcomingTasks?: Array<{ id: string; title: string; dueAt?: string; priority?: string; status?: string; relatedType?: string | null; relatedId?: string | null }>;
      todaysMeetings?: Array<{ id: string; title: string; startAt?: string; status?: string; relatedType?: string | null; relatedId?: string | null }>;
      followUpsDue?: Array<{ id: string; title: string; dueAt?: string; owner?: string; relatedType?: string | null; relatedId?: string | null }>;
      pendingRsmApprovals?: Array<{ id: string; proposalNumber: string; customerName: string; companyName?: string; opportunityName?: string; ownerName: string; value: number; submittedAt?: string }>;
      returnedProposals?: Array<{ id: string; proposalNumber: string; customerName: string; companyName?: string; opportunityName?: string; ownerName: string; value: number; rejectedAt?: string; rejectionReason?: string }>;
      pendingHeadCloseApprovals?: Array<{ id: string; opportunityName: string; customerName: string; companyName?: string; ownerName: string; region: string; requestedOutcome: string; requestedValue: number; requestedAt?: string }>;
      returnedCloseRequests?: Array<{ id: string; opportunityName: string; customerName: string; companyName?: string; ownerName: string; rejectionReason?: string; requestedAt?: string }>;
    };
    funnel?: Array<{ stage: string; count: number; percentage: number }>;
    recentActivity?: Array<{ id: string; type: string; title: string; description?: string; occurredAt?: string; actor?: string }>;
    regionalComparison?: Array<{ id: string; bdo: string; leads: number; qualified: number; opportunities: number; pipelineValue: number; proposals: number; closedWon: number; closedLost: number; wonRevenue: number }>;
    pendingProposalApprovals?: Array<{ id: string; proposalNumber: string; customerName: string; companyName?: string; opportunityName?: string; ownerName: string; value: number; submittedAt?: string }>;
    regionComparison?: Array<{ id: string; region: string; rsm: string; bdos: number; leads: number; qualified: number; opportunities: number; pipelineValue: number; wonRevenue: number; closedWon: number; closedLost: number }>;
    rsmComparison?: Array<{ id: string; rsm: string; region: string; bdos: number; leads: number; qualified: number; opportunities: number; pipelineValue: number; wonRevenue: number; pendingProposalApprovals: number; pendingCloseApprovals: number }>;
    bdoDrilldown?: Array<{ id: string; region: string; rsm: string; bdo: string; leads: number; opportunities: number }>;
    headPendingCloseApprovals?: Array<{ id: string; opportunityName: string; customerName: string; companyName?: string; ownerName: string; region: string; requestedOutcome: string; requestedValue: number; requestedAt?: string }>;
  },
) {
  if (!roleDetails) return null;

  if (role === "bdo") {
    return (
      <>
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <SectionCard title="My Action Queue" description="Follow-ups and meetings in your active pipeline.">
              <div className="space-y-3">
                {roleDetails.actionable?.upcomingTasks?.length ? roleDetails.actionable.upcomingTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-ink">{task.title}</strong>
                      {task.priority ? <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{task.priority}</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {task.dueAt ? new Date(task.dueAt).toLocaleString() : task.status ?? "Open"}
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No tasks require attention.</p>}
              </div>
            </SectionCard>
          </div>
          <div className="xl:col-span-6">
            <SectionCard title="Approval Watch" description="Proposal reviews and corrections in your queue.">
              <div className="space-y-3">
                {roleDetails.actionable?.pendingRsmApprovals?.length ? roleDetails.actionable.pendingRsmApprovals.map((proposal) => (
                  <div key={proposal.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-ink">{proposal.proposalNumber}</strong>
                      <span className="text-xs text-muted-foreground">{formatCurrency(proposal.value)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{proposal.customerName}</div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No pending proposal approvals.</p>}
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <SectionCard title="Pipeline Funnel" description="Current deal mix across the stage pipeline.">
              <div className="space-y-3">
                {roleDetails.funnel?.length ? roleDetails.funnel.map((stage) => (
                  <div key={stage.stage}>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{stage.stage}</span>
                      <span>{stage.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(stage.percentage, 100)}%` }} />
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No open stages in scope.</p>}
              </div>
            </SectionCard>
          </div>
          <div className="xl:col-span-5">
            <SectionCard title="Recent Activity" description="Latest updates from the team in your scope.">
              <div className="space-y-3">
                {roleDetails.recentActivity?.length ? roleDetails.recentActivity.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-sm font-medium text-ink">{item.title}</div>
                    {item.description ? <div className="mt-1 text-xs text-muted-foreground">{item.description}</div> : null}
                    <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{item.type}</div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No recent activity in scope.</p>}
              </div>
            </SectionCard>
          </div>
        </section>
      </>
    );
  }

  if (role === "rsm") {
    return (
      <>
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <SectionCard title="Regional Approval Queue" description="Open proposal approvals for sellers under your region.">
              <div className="space-y-3">
                {roleDetails.actionable?.pendingRsmApprovals?.length ? roleDetails.actionable.pendingRsmApprovals.map((proposal) => (
                  <div key={proposal.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-ink">{proposal.proposalNumber}</strong>
                      <span className="text-xs text-muted-foreground">{formatCurrency(proposal.value)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{proposal.customerName} · {proposal.ownerName || "Unassigned"}</div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No regional proposal approvals pending.</p>}
              </div>
            </SectionCard>
          </div>
          <div className="xl:col-span-6">
            <SectionCard title="Regional Comparison" description="Performance by BDO and region snapshot.">
              <div className="space-y-3">
                {roleDetails.regionalComparison?.length ? roleDetails.regionalComparison.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                    <div>
                      <div className="text-sm font-medium text-ink">{item.bdo}</div>
                      <div className="text-xs text-muted-foreground">{item.opportunities} opportunities · {item.proposals} proposals</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{item.closedWon} won</div>
                      <div>{formatCurrency(item.wonRevenue)}</div>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Regional comparison will populate as sales data arrives.</p>}
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <SectionCard title="Team Funnel" description="Current deal shape across your authorized sellers.">
              <div className="space-y-3">
                {roleDetails.funnel?.length ? roleDetails.funnel.map((stage) => (
                  <div key={stage.stage}>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{stage.stage}</span>
                      <span>{stage.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(stage.percentage, 100)}%` }} />
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No aggregated stage data is available.</p>}
              </div>
            </SectionCard>
          </div>
          <div className="xl:col-span-5">
            <SectionCard title="Regional Activity" description="Latest updates across your region.">
              <div className="space-y-3">
                {roleDetails.recentActivity?.length ? roleDetails.recentActivity.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-sm font-medium text-ink">{item.title}</div>
                    {item.description ? <div className="mt-1 text-xs text-muted-foreground">{item.description}</div> : null}
                    <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{item.type}</div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No recent regional activity.</p>}
              </div>
            </SectionCard>
          </div>
        </section>
      </>
    );
  }

  if (role === "head_of_sales") {
    return (
      <>
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <SectionCard title="Close Approvals" description="Opportunities awaiting Head of Sales sign-off.">
              <div className="space-y-3">
                {roleDetails.actionable?.pendingHeadCloseApprovals?.length ? roleDetails.actionable.pendingHeadCloseApprovals.map((request) => (
                  <div key={request.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-ink">{request.opportunityName}</strong>
                      <span className="text-xs text-muted-foreground">{request.requestedOutcome}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{request.customerName} · {formatCurrency(request.requestedValue)}</div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No close requests are pending approval.</p>}
              </div>
            </SectionCard>
          </div>
          <div className="xl:col-span-6">
            <SectionCard title="Organization Snapshot" description="Regional and RSM performance at a glance.">
              <div className="space-y-3">
                {roleDetails.regionComparison?.length ? roleDetails.regionComparison.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                    <div>
                      <div className="text-sm font-medium text-ink">{item.region}</div>
                      <div className="text-xs text-muted-foreground">{item.rsm}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{item.closedWon} won</div>
                      <div>{formatCurrency(item.wonRevenue)}</div>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Organization comparison data is not yet available.</p>}
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <SectionCard title="Full Funnel" description="Gross pipeline distribution across the org.">
              <div className="space-y-3">
                {roleDetails.funnel?.length ? roleDetails.funnel.map((stage) => (
                  <div key={stage.stage}>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{stage.stage}</span>
                      <span>{stage.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(stage.percentage, 100)}%` }} />
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No pipeline stages are visible.</p>}
              </div>
            </SectionCard>
          </div>
          <div className="xl:col-span-5">
            <SectionCard title="Executive Activity" description="The latest commercial updates across the organization.">
              <div className="space-y-3">
                {roleDetails.recentActivity?.length ? roleDetails.recentActivity.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <div className="text-sm font-medium text-ink">{item.title}</div>
                    {item.description ? <div className="mt-1 text-xs text-muted-foreground">{item.description}</div> : null}
                    <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{item.type}</div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No recent org activity.</p>}
              </div>
            </SectionCard>
          </div>
        </section>
      </>
    );
  }

  return null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}