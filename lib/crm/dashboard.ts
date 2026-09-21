import "server-only";

import { getActiveOrgId, toIso } from "@/lib/crm/base";
import { formatTimeUTC } from "@/lib/date-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { applyOwnerScope, getSalesAccessScope, type SalesAccessScope } from "@/lib/crm/scope";
import type {
  StatCardData,
  RevenuePoint,
  DealStageOverview,
  Lead,
  Task,
  Meeting,
  DealRisk,
} from "@/lib/types";

export interface DashboardData {
  kpi: StatCardData[];
  revenue: RevenuePoint[];
  dealsByStage: DealStageOverview[];
  recentLeads: Lead[];
  upcomingTasks: Task[];
  todayMeetings: Meeting[];
  dealRisks: DealRisk[];
}

interface DashboardAggregate {
  totalLeads: number;
  activeOpportunities: number;
  wonOpportunities: number;
  closedWonThisMonth: number;
  expectedRevenue: number;
  dealsByStage: Record<string, number>;
  revenueByMonth: Record<string, number>;
}

/**
 * Server-computed dashboard aggregates (Steps 59–60). All SQL-side.
 * Returns null when Supabase is unavailable so pages fall back to mocks.
 */
export async function getDashboardData(): Promise<DashboardData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const scope = await getSalesAccessScope();

  // Phase 2 — owner-scoped feeds (BDO/RSM must not see the whole org feed).
  let recentLeadsQ = supabase
    .from("leads")
    .select("id, full_name, email, company_name, source, score, created_at")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(5);
  recentLeadsQ = applyOwnerScope(recentLeadsQ, scope, "owner_id") as typeof recentLeadsQ;

  let riskDealsQ = supabase
    .from("deals")
    .select("id, value, health_status, companies(name)")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .or("health_status.eq.At Risk,health_status.eq.Critical")
    .limit(10);
  riskDealsQ = applyOwnerScope(riskDealsQ, scope, "owner_id") as typeof riskDealsQ;

  let tasksQ = supabase
    .from("tasks")
    .select("id, title, priority, due_at, status, related_type, related_id")
    .eq("organization_id", organizationId)
    .in("status", ["Open", "In Progress"])
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(6);
  tasksQ = applyOwnerScope(tasksQ, scope, "owner_id") as typeof tasksQ;

  let meetingsQ = supabase
    .from("meetings")
    .select("id, title, start_at, meeting_url, status, related_type, related_id")
    .eq("organization_id", organizationId)
    .in("status", ["scheduled", "in_progress", "rescheduled"])
    .gte("start_at", startOfToday())
    .lt("start_at", startOfTomorrow())
    .order("start_at", { ascending: true })
    .limit(5);
  meetingsQ = applyOwnerScope(meetingsQ, scope, "owner_id") as typeof meetingsQ;

  const [summaryRes, recentLeadsRes, tasksRes, meetingsRes, risksRes] =
    await Promise.all([
      supabase
        .from("crm_dashboard_summary")
        .select("total_leads, active_opportunities, won_opportunities, closed_won_this_month, expected_revenue, deals_by_stage, revenue_by_month")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      recentLeadsQ,
      tasksQ,
      meetingsQ,
      riskDealsQ,
    ]);

  // Phase 2 — org-wide roles use the SQL-based summary view; scoped roles
  // (BDO/RSM) get live owner-scoped aggregates so KPIs never leak org-wide.
  const aggregate = scope && scope.visibleOwnerIds
    ? await getSalesAggregateScoped(supabase, organizationId, scope)
    : summaryRes.data ? {
        totalLeads: summaryRes.data.total_leads,
        activeOpportunities: summaryRes.data.active_opportunities,
        wonOpportunities: summaryRes.data.won_opportunities,
        closedWonThisMonth: summaryRes.data.closed_won_this_month,
        expectedRevenue: Number(summaryRes.data.expected_revenue ?? 0),
        dealsByStage: (summaryRes.data.deals_by_stage ?? {}) as Record<string, number>,
        revenueByMonth: (summaryRes.data.revenue_by_month ?? {}) as Record<string, number>,
      } : await getDashboardAggregateFallback(supabase, organizationId);

  const revenue = buildRevenueSeries(aggregate.revenueByMonth);
  const dealsByStage: DealStageOverview[] = Object.entries(aggregate.dealsByStage).map(([stage, count]) => ({
    stage,
    count,
    percentage: aggregate.activeOpportunities ? Math.round((count / aggregate.activeOpportunities) * 100) : 0,
  }));

  const kpi: StatCardData[] = [
    { id: "kpi-leads", label: "Total Leads", value: String(aggregate.totalLeads), change: "", comparison: "all time" },
    { id: "kpi-deals", label: "Active Deals", value: String(aggregate.activeOpportunities), change: "", comparison: "open" },
    { id: "kpi-revenue", label: "Expected Revenue", value: formatCompact(aggregate.expectedRevenue), change: "", comparison: "weighted" },
    { id: "kpi-won", label: "Won Deals", value: String(aggregate.wonOpportunities), change: aggregate.closedWonThisMonth ? `+${aggregate.closedWonThisMonth}` : "", comparison: "this month" },
  ];

  const recentLeads: Lead[] = (recentLeadsRes.data ?? []).map((l) => ({
    id: l.id,
    name: l.full_name ?? l.email ?? "Lead",
    company: l.company_name ?? "",
    source: (l.source as Lead["source"]) ?? "Other",
    score: l.score ?? 0,
    time: toIso(l.created_at),
    email: l.email ?? undefined,
  }));

  const taskRows = await filterValidTaskRows(
    supabase,
    organizationId,
    (tasksRes.data ?? []) as DashboardTaskRow[],
    scope,
  );
  const meetingRows = await filterValidRelatedRows(
    supabase,
    organizationId,
    (meetingsRes.data ?? []) as DashboardMeetingRow[],
    ["lead", "deal"],
    scope,
  );

  const upcomingTasks: Task[] = taskRows.map((t) => ({
    id: t.id,
    title: t.title,
    time: t.due_at ? toIso(t.due_at) : "",
    subtitle: t.status === "In Progress" ? "In progress" : t.status,
    priority: (t.priority as Task["priority"]) ?? "medium",
    completed: t.status === "Completed",
  }));

  const todayMeetings: Meeting[] = meetingRows.map((m) => ({
    id: m.id,
    title: m.title,
    time: m.start_at ? formatTimeUTC(m.start_at) : "",
    company: "",
    type: m.meeting_url ? "video" : "call",
  }));

  const dealRisks: DealRisk[] = (risksRes.data ?? []).map((r) => ({
    id: r.id,
    company: Array.isArray(r.companies) ? "" : (r.companies as { name: string } | null)?.name ?? "",
    reason: r.health_status === "Critical" ? "Deal health is critical" : r.health_status === "At Risk" ? "Deal needs attention" : "At risk",
    amount: Number(r.value ?? 0),
    status: r.health_status === "Critical" ? "red" : "orange",
  }));

  return { kpi, revenue, dealsByStage, recentLeads, upcomingTasks, todayMeetings, dealRisks };
}

interface DashboardTaskRow {
  id: string;
  title: string;
  priority: string | null;
  due_at: string | null;
  status: string;
  related_type: string | null;
  related_id: string | null;
}

interface DashboardMeetingRow {
  id: string;
  title: string;
  start_at: string;
  meeting_url: string | null;
  status: string | null;
  related_type: string | null;
  related_id: string | null;
}

export type DashboardParentType = "lead" | "deal" | "contact" | "company";

async function filterValidTaskRows(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  rows: DashboardTaskRow[],
  scope?: SalesAccessScope | null,
): Promise<DashboardTaskRow[]> {
  return filterValidRelatedRows(supabase, organizationId, rows, ["lead", "deal", "contact", "company"] satisfies DashboardParentType[], scope);
}

export async function filterValidRelatedRows<T extends { related_type: string | null; related_id: string | null }>(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  rows: T[],
  allowedTypes: DashboardParentType[],
  scope?: SalesAccessScope | null,
): Promise<T[]> {
  const idsByType: Record<DashboardParentType, string[]> = {
    lead: [],
    deal: [],
    contact: [],
    company: [],
  };

  for (const row of rows) {
    const type = normalizeTaskParentType(row.related_type);
    if (type && allowedTypes.includes(type) && row.related_id) idsByType[type].push(row.related_id);
  }

  const validParentKeys = new Set<string>();
  const tableByType: Record<DashboardParentType, string> = {
    lead: "leads",
    deal: "deals",
    contact: "contacts",
    company: "companies",
  };

  await Promise.all(
    (Object.entries(idsByType) as Array<[DashboardParentType, string[]]>).map(
      async ([type, ids]) => {
        const uniqueIds = [...new Set(ids)];
        if (!uniqueIds.length) return;

        let query = supabase
          .from(tableByType[type])
          .select("id")
          .eq("organization_id", organizationId)
          .is("archived_at", null)
          .in("id", uniqueIds);

        // Phase 2 — a scoped user must not have their widgets back-filled with
        // rows whose parent lead/opportunity belongs to someone else's scope.
        if (type === "lead" || type === "deal") {
          query = applyOwnerScope(query, scope, "owner_id") as typeof query;
        }

        const { data, error } = await query;

        if (error) {
          console.error(`[dashboard] ${type} task parent lookup failed`, error.message);
          return;
        }

        for (const parent of data ?? []) {
          validParentKeys.add(`${type}:${parent.id}`);
        }
      },
    ),
  );

  return rows.filter((row) => {
    const type = normalizeTaskParentType(row.related_type);
    return Boolean(
      type &&
        allowedTypes.includes(type) &&
        row.related_id &&
        validParentKeys.has(`${type}:${row.related_id}`),
    );
  });
}

function normalizeTaskParentType(value: string | null): DashboardParentType | null {
  const type = value?.toLowerCase();
  if (type === "lead") return "lead";
  if (type === "deal" || type === "opportunity") return "deal";
  if (type === "contact") return "contact";
  if (type === "company") return "company";
  return null;
}

function startOfToday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function getDashboardAggregateFallback(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
): Promise<DashboardAggregate> {
  const [{ count: totalLeads }, { data: deals }, { data: stages }] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("archived_at", null),
    supabase.from("deals").select("won_at, lost_at, value, probability").eq("organization_id", organizationId).is("archived_at", null),
    supabase.from("deals").select("pipeline_stages(name)").eq("organization_id", organizationId).is("archived_at", null).is("won_at", null).is("lost_at", null),
  ]);
  const rows = (deals ?? []) as Array<{ won_at: string | null; lost_at: string | null; value: number | null; probability: number | null }>;
  const open = rows.filter((row) => !row.won_at && !row.lost_at);
  const won = rows.filter((row) => row.won_at);
  const now = new Date();
  const closedWonThisMonth = won.filter((row) => {
    const date = new Date(row.won_at as string);
    return date.getUTCMonth() === now.getUTCMonth() && date.getUTCFullYear() === now.getUTCFullYear();
  }).length;
  const dealsByStage: Record<string, number> = {};
  for (const row of stages ?? []) {
    const name = Array.isArray(row.pipeline_stages) ? null : (row.pipeline_stages as { name: string } | null)?.name;
    const key = name ?? "Open";
    dealsByStage[key] = (dealsByStage[key] ?? 0) + 1;
  }
  const revenueByMonth: Record<string, number> = {};
  for (const row of won) {
    const key = new Date(row.won_at as string).toISOString().slice(0, 7);
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + 1;
  }
  return {
    totalLeads: totalLeads ?? 0,
    activeOpportunities: open.length,
    wonOpportunities: won.length,
    closedWonThisMonth,
    expectedRevenue: open.reduce((sum, row) => sum + Number(row.value ?? 0) * Number(row.probability ?? 0) / 100, 0),
    dealsByStage,
    revenueByMonth,
  };
}

/**
 * Live owner-scoped dashboard KPIs for BDO/RSM roles. These roles never read
 * the org-wide `crm_dashboard_summary` snapshot; every aggregate below is
 * restricted to the caller's visible owner set.
 */
async function getSalesAggregateScoped(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  scope: SalesAccessScope,
): Promise<DashboardAggregate> {
  let leadsQ = supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("archived_at", null);
  leadsQ = applyOwnerScope(leadsQ, scope, "owner_id") as typeof leadsQ;

  let dealsQ = supabase
    .from("deals")
    .select("won_at, lost_at, value, probability")
    .eq("organization_id", organizationId)
    .is("archived_at", null);
  dealsQ = applyOwnerScope(dealsQ, scope, "owner_id") as typeof dealsQ;

  let openQ = supabase
    .from("deals")
    .select("pipeline_stages(name)")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .is("won_at", null)
    .is("lost_at", null);
  openQ = applyOwnerScope(openQ, scope, "owner_id") as typeof openQ;

  const [{ count: totalLeads }, { data: deals }, { data: openRows }] = await Promise.all([
    leadsQ,
    dealsQ,
    openQ,
  ]);

  const rows = (deals ?? []) as Array<{ won_at: string | null; lost_at: string | null; value: number | null; probability: number | null }>;
  const open = rows.filter((row) => !row.won_at && !row.lost_at);
  const won = rows.filter((row) => row.won_at);
  const now = new Date();
  const closedWonThisMonth = won.filter((row) => {
    const date = new Date(row.won_at as string);
    return date.getUTCMonth() === now.getUTCMonth() && date.getUTCFullYear() === now.getUTCFullYear();
  }).length;

  const dealsByStage: Record<string, number> = {};
  for (const row of openRows ?? []) {
    const name = Array.isArray(row.pipeline_stages) ? null : (row.pipeline_stages as { name: string } | null)?.name;
    const key = name ?? "Open";
    dealsByStage[key] = (dealsByStage[key] ?? 0) + 1;
  }

  const revenueByMonth: Record<string, number> = {};
  for (const row of won) {
    const key = new Date(row.won_at as string).toISOString().slice(0, 7);
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + Number(row.value ?? 0);
  }

  return {
    totalLeads: totalLeads ?? 0,
    activeOpportunities: open.length,
    wonOpportunities: won.length,
    closedWonThisMonth,
    expectedRevenue: open.reduce((sum, row) => sum + Number(row.value ?? 0) * Number(row.probability ?? 0) / 100, 0),
    dealsByStage,
    revenueByMonth,
  };
}

function buildRevenueSeries(monthTotals: Record<string, number>): RevenuePoint[] {
  const now = new Date();
  const series: RevenuePoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    series.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      value: monthTotals[key] ?? 0,
    });
  }
  return series;
}

function formatCompact(n: number): string {
  if (n >= 1e6) return `Rs ${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `Rs ${Math.round(n / 1e3)}K`;
  return `Rs ${Math.round(n)}`;
}