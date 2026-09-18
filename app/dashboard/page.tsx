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
import { getDashboardData } from "@/lib/crm/dashboard";
import { getActivation } from "@/lib/onboarding";
import { TrialBanner } from "@/components/onboarding/trial-banner";
import { ActivationCard } from "@/components/onboarding/activation-card";
import {
  dealRisks,
  kpiStats,
  recentLeads,
  teamPerformance,
  todayMeetings,
  upcomingTasks,
} from "@/lib/mock-data";
import { leadMocks } from "@/lib/mock-leads";

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

const leadHrefByCompany: Record<string, string> = {};
const leadHrefByName: Record<string, string> = {};
for (const lead of leadMocks) {
  leadHrefByCompany[lead.companyName.toLowerCase()] = `/leads/${lead.id}`;
  leadHrefByName[`${lead.firstName} ${lead.lastName}`.toLowerCase()] = `/leads/${lead.id}`;
}

export default async function DashboardPage() {
  const dashboard = await getDashboardData();
  const kpi = dashboard?.kpi ?? kpiStats;
  const activation = await getActivation();
  const stageData = dashboard?.dealsByStage;
  const revenueData = dashboard?.revenue;
  const leads = dashboard ? dashboard.recentLeads : recentLeads;
  const tasks = dashboard ? dashboard.upcomingTasks : upcomingTasks;
  const meetings = dashboard ? dashboard.todayMeetings : todayMeetings;
  const risks = dashboard ? dashboard.dealRisks : dealRisks;

  const realLeadHrefByName = (dashboard?.recentLeads ?? []).reduce<Record<string, string>>((acc, lead) => {
    acc[lead.name.toLowerCase()] = `/leads/${lead.id}`;
    if (lead.company) acc[lead.company.toLowerCase()] = `/leads/${lead.id}`;
    return acc;
  }, {});
  const realLeadHrefByCompany = (dashboard?.recentLeads ?? []).reduce<Record<string, string>>((acc, lead) => {
    if (lead.company) acc[lead.company.toLowerCase()] = `/leads/${lead.id}`;
    return acc;
  }, {});
  const resolvedHrefsByName = Object.keys(realLeadHrefByName).length > 0 ? realLeadHrefByName : leadHrefByName;
  const resolvedHrefsByCompany = Object.keys(realLeadHrefByCompany).length > 0 ? realLeadHrefByCompany : leadHrefByCompany;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5 pb-10">
      <TrialBanner />
      <DashboardHeader />
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
          <TeamPerformance members={teamPerformance} />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <DealRisks risks={risks} />
        </div>
      </section>
    </div>
  );
}