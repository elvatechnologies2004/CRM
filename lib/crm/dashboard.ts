import "server-only";

import { getActiveOrgId, toIso } from "@/lib/crm/base";
import { formatTimeUTC } from "@/lib/date-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { applyOwnerScope, getSalesAccessScope, isOrgWideRole, type SalesAccessScope } from "@/lib/crm/scope";
import type {
  StatCardData,
  RevenuePoint,
  DealStageOverview,
  Lead,
  Task,
  Meeting,
  DealRisk,
  TeamMemberPerformance,
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

export interface RoleDashboardData extends DashboardData {
  role: SalesAccessScope["role"];
  title: string;
  subtitle: string;
  teamMembers: TeamMemberPerformance[];
  roleDetails?: {
    currentUser?: {
      id: string;
      name: string;
    } | null;
    actionable: {
      upcomingTasks: Array<{ id: string; title: string; dueAt?: string; priority?: string; status?: string; relatedType?: string | null; relatedId?: string | null }>;
      todaysMeetings: Array<{ id: string; title: string; startAt?: string; status?: string; relatedType?: string | null; relatedId?: string | null }>;
      followUpsDue: Array<{ id: string; title: string; dueAt?: string; owner?: string; relatedType?: string | null; relatedId?: string | null }>;
      pendingRsmApprovals: Array<{ id: string; proposalNumber: string; customerName: string; companyName?: string; opportunityName?: string; ownerName: string; value: number; submittedAt?: string }>;
      returnedProposals: Array<{ id: string; proposalNumber: string; customerName: string; companyName?: string; opportunityName?: string; ownerName: string; value: number; rejectedAt?: string; rejectionReason?: string }>;
      pendingHeadCloseApprovals: Array<{ id: string; opportunityName: string; customerName: string; companyName?: string; ownerName: string; region: string; requestedOutcome: string; requestedValue: number; requestedAt?: string }>;
      returnedCloseRequests: Array<{ id: string; opportunityName: string; customerName: string; companyName?: string; ownerName: string; rejectionReason?: string; requestedAt?: string }>;
    };
    funnel: Array<{ stage: string; count: number; percentage: number }>;
    recentActivity: Array<{ id: string; type: string; title: string; description?: string; occurredAt?: string; actor?: string }>;
    regionalComparison?: Array<{ id: string; bdo: string; leads: number; qualified: number; opportunities: number; pipelineValue: number; proposals: number; closedWon: number; closedLost: number; wonRevenue: number }>;
    pendingProposalApprovals?: Array<{ id: string; proposalNumber: string; customerName: string; companyName?: string; opportunityName?: string; ownerName: string; value: number; submittedAt?: string }>;
    regionComparison?: Array<{ id: string; region: string; rsm: string; bdos: number; leads: number; qualified: number; opportunities: number; pipelineValue: number; wonRevenue: number; closedWon: number; closedLost: number }>;
    rsmComparison?: Array<{ id: string; rsm: string; region: string; bdos: number; leads: number; qualified: number; opportunities: number; pipelineValue: number; wonRevenue: number; pendingProposalApprovals: number; pendingCloseApprovals: number }>;
    bdoDrilldown?: Array<{ id: string; region: string; rsm: string; bdo: string; leads: number; opportunities: number }>;
    headPendingCloseApprovals?: Array<{ id: string; opportunityName: string; customerName: string; companyName?: string; ownerName: string; region: string; requestedOutcome: string; requestedValue: number; requestedAt?: string }>;
  };
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

export async function getRoleDashboardData(): Promise<RoleDashboardData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const scope = await getSalesAccessScope();
  const role = scope?.role ?? "other";

  const baseData = await buildRoleDashboardData(supabase, organizationId, scope);
  if (!baseData) return null;

  const title =
    role === "bdo"
      ? "My Sales Dashboard"
      : role === "rsm"
        ? "Regional Sales Dashboard"
        : role === "head_of_sales"
          ? "Sales Overview"
          : "Dashboard";

  const subtitle =
    role === "bdo"
      ? "Your pipeline, task queue and recent activity in scope."
      : role === "rsm"
        ? "Regional team performance and approvals across your authorized sellers."
        : role === "head_of_sales"
          ? "Organization-wide sales oversight and approval queue."
          : "Business overview for your active organization.";

  const teamMembers = await getRoleTeamMembers(supabase, organizationId, scope);
  const roleDetails = await buildRoleDashboardDetails(supabase, organizationId, scope);

  return {
    ...baseData,
    role,
    title,
    subtitle,
    teamMembers,
    roleDetails,
  };
}

async function buildRoleDashboardDetails(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  scope: SalesAccessScope | null,
): Promise<RoleDashboardData["roleDetails"]> {
  const ownerSafeScope = scope && isOrgWideRole(scope.role) ? null : scope;

  const todaysTaskRows = await supabase
    .from("tasks")
    .select("id, title, due_at, priority, status, related_type, related_id, owner_id")
    .eq("organization_id", organizationId)
    .not("status", "eq", "Completed")
    .not("status", "eq", "Cancelled")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(20);

  const todaysMeetingRows = await supabase
    .from("meetings")
    .select("id, title, start_at, status, related_type, related_id, owner_id")
    .eq("organization_id", organizationId)
    .not("status", "eq", "cancelled")
    .gte("start_at", startOfToday())
    .lt("start_at", startOfTomorrow())
    .order("start_at", { ascending: true })
    .limit(20);

  const activityRows = await supabase
    .from("activities")
    .select("id, activity_type, title, description, occurred_at, actor_user_id, organization_id")
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(20);

  const proposalRows = await supabase
    .from("quotes")
    .select("id, quote_number, created_by, approval_status, status, total, deals(name), companies(name), contacts(first_name, last_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  const closeRequests = await supabase
    .from("deal_close_requests")
    .select("id, deal_id, requested_by, status, requested_outcome, final_value, requested_at, rejected_at, rejection_reason, deals(name), companies(name), contacts(first_name, last_name)")
    .eq("organization_id", organizationId)
    .order("requested_at", { ascending: false })
    .limit(50);

  const taskList = (todaysTaskRows.data ?? []).filter((row) => !row.owner_id || (ownerSafeScope ? ownerSafeScope.visibleOwnerIds?.has(row.owner_id) ?? false : true));
  const meetingList = (todaysMeetingRows.data ?? []).filter((row) => !row.owner_id || (ownerSafeScope ? ownerSafeScope.visibleOwnerIds?.has(row.owner_id) ?? false : true));
  const activityList = (activityRows.data ?? []).filter((row) => !row.actor_user_id || (ownerSafeScope ? ownerSafeScope.visibleOwnerIds?.has(row.actor_user_id) ?? false : true));
  const proposalList = (proposalRows.data ?? []).filter((row) => !row.created_by || (ownerSafeScope ? ownerSafeScope.visibleOwnerIds?.has(row.created_by) ?? false : true));
  const closeList = (closeRequests.data ?? []).filter((row) => !row.requested_by || (ownerSafeScope ? ownerSafeScope.visibleOwnerIds?.has(row.requested_by) ?? false : true));

  const funnel = await getRoleFunnel(supabase, organizationId, ownerSafeScope);

  const pendingRsmApprovals = proposalList
    .filter((row) => (row.approval_status ?? "") === "pending_rsm_approval")
    .map((row) => ({
      id: row.id,
      proposalNumber: row.quote_number ?? "—",
      customerName: row.companies?.[0]?.name ?? row.contacts?.[0] ? `${row.contacts[0].first_name ?? ""} ${row.contacts[0].last_name ?? ""}`.trim() : "—",
      companyName: Array.isArray(row.companies) ? row.companies[0]?.name ?? undefined : undefined,
      opportunityName: Array.isArray(row.deals) ? row.deals[0]?.name ?? undefined : undefined,
      ownerName: "—",
      value: Number(row.total ?? 0),
      submittedAt: undefined,
    }));

  const returnedProposals = proposalList
    .filter((row) => (row.approval_status ?? "") === "returned_for_revision")
    .map((row) => ({
      id: row.id,
      proposalNumber: row.quote_number ?? "—",
      customerName: row.companies?.[0]?.name ?? row.contacts?.[0] ? `${row.contacts[0].first_name ?? ""} ${row.contacts[0].last_name ?? ""}`.trim() : "—",
      companyName: Array.isArray(row.companies) ? row.companies[0]?.name ?? undefined : undefined,
      opportunityName: Array.isArray(row.deals) ? row.deals[0]?.name ?? undefined : undefined,
      ownerName: "—",
      value: Number(row.total ?? 0),
      rejectedAt: undefined,
      rejectionReason: undefined,
    }));

  const pendingHeadCloseApprovals = closeList
    .filter((row) => (row.status ?? "") === "pending_head_approval")
    .map((row) => ({
      id: row.id,
      opportunityName: Array.isArray(row.deals) ? row.deals[0]?.name ?? "Opportunity" : "Opportunity",
      customerName: Array.isArray(row.companies) ? row.companies[0]?.name ?? "—" : "—",
      companyName: Array.isArray(row.companies) ? row.companies[0]?.name ?? undefined : undefined,
      ownerName: "—",
      region: "—",
      requestedOutcome: row.requested_outcome ?? "won",
      requestedValue: Number(row.final_value ?? 0),
      requestedAt: row.requested_at ?? undefined,
    }));

  const returnedCloseRequests = closeList
    .filter((row) => (row.status ?? "") === "rejected")
    .map((row) => ({
      id: row.id,
      opportunityName: Array.isArray(row.deals) ? row.deals[0]?.name ?? "Opportunity" : "Opportunity",
      customerName: Array.isArray(row.companies) ? row.companies[0]?.name ?? "—" : "—",
      companyName: Array.isArray(row.companies) ? row.companies[0]?.name ?? undefined : undefined,
      ownerName: "—",
      rejectionReason: row.rejection_reason ?? undefined,
      requestedAt: row.requested_at ?? undefined,
    }));

  return {
    currentUser: scope ? { id: scope.userId, name: "Current user" } : null,
    actionable: {
      upcomingTasks: taskList.slice(0, 10).map((row) => ({
        id: row.id,
        title: row.title,
        dueAt: row.due_at ?? undefined,
        priority: row.priority ?? undefined,
        status: row.status ?? undefined,
        relatedType: row.related_type ?? undefined,
        relatedId: row.related_id ?? undefined,
      })),
      todaysMeetings: meetingList.slice(0, 10).map((row) => ({
        id: row.id,
        title: row.title,
        startAt: row.start_at ?? undefined,
        status: row.status ?? undefined,
        relatedType: row.related_type ?? undefined,
        relatedId: row.related_id ?? undefined,
      })),
      followUpsDue: taskList
        .filter((row) => row.due_at && new Date(row.due_at).getTime() >= Date.now())
        .slice(0, 10)
        .map((row) => ({
          id: row.id,
          title: row.title,
          dueAt: row.due_at ?? undefined,
          owner: undefined,
          relatedType: row.related_type ?? undefined,
          relatedId: row.related_id ?? undefined,
        })),
      pendingRsmApprovals,
      returnedProposals,
      pendingHeadCloseApprovals,
      returnedCloseRequests,
    },
    funnel,
    recentActivity: activityList.slice(0, 12).map((row) => ({
      id: row.id,
      type: row.activity_type ?? "activity",
      title: row.title ?? row.activity_type ?? "Activity",
      description: row.description ?? undefined,
      occurredAt: row.occurred_at ?? undefined,
      actor: undefined,
    })),
    regionalComparison: undefined,
    pendingProposalApprovals: pendingRsmApprovals,
    regionComparison: undefined,
    rsmComparison: undefined,
    bdoDrilldown: undefined,
    headPendingCloseApprovals: pendingHeadCloseApprovals,
  };
}

async function getRoleFunnel(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  scope: SalesAccessScope | null,
): Promise<Array<{ stage: string; count: number; percentage: number }>> {
  const query = supabase
    .from("deals")
    .select("id, pipeline_stages(name), owner_id, won_at, lost_at")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .is("won_at", null)
    .is("lost_at", null);

  const filtered = applyOwnerScope(query, scope, "owner_id") as typeof query;
  const { data } = await filtered;
  const rows = (data ?? []) as Array<{ pipeline_stages: { name?: string | null } | null }>;
  const counts = new Map<string, number>();
  for (const row of rows) {
    const stage = Array.isArray(row.pipeline_stages) ? "Open" : (row.pipeline_stages?.name ?? "Open");
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((sum, value) => sum + value, 0) || 1;
  return [...counts.entries()].map(([stage, count]) => ({
    stage,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}

async function buildRoleDashboardData(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  scope: SalesAccessScope | null,
): Promise<DashboardData | null> {
  const role = scope?.role ?? "other";
  const recentLeadsQ = supabase
    .from("leads")
    .select("id, full_name, email, company_name, source, score, created_at, owner_id")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const tasksQ = supabase
    .from("tasks")
    .select("id, title, priority, due_at, status, related_type, related_id, owner_id")
    .eq("organization_id", organizationId)
    .in("status", ["Open", "In Progress"])
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(6);

  const meetingsQ = supabase
    .from("meetings")
    .select("id, title, start_at, meeting_url, status, related_type, related_id, owner_id")
    .eq("organization_id", organizationId)
    .in("status", ["scheduled", "in_progress", "rescheduled"])
    .gte("start_at", startOfToday())
    .lt("start_at", startOfTomorrow())
    .order("start_at", { ascending: true })
    .limit(5);

  const riskDealsQ = supabase
    .from("deals")
    .select("id, value, health_status, owner_id, companies(name)")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .or("health_status.eq.At Risk,health_status.eq.Critical")
    .limit(10);

  const [summary, recentLeadsRes, tasksRes, meetingsRes, risksRes] = await Promise.all([
    getRoleAggregate(supabase, organizationId, scope),
    applyOwnerScope(recentLeadsQ, scope, "owner_id") as typeof recentLeadsQ,
    applyOwnerScope(tasksQ, scope, "owner_id") as typeof tasksQ,
    applyOwnerScope(meetingsQ, scope, "owner_id") as typeof meetingsQ,
    applyOwnerScope(riskDealsQ, scope, "owner_id") as typeof riskDealsQ,
  ]);

  const [recentLeadsQuery, taskRows, meetingRows, riskRows] = await Promise.all([
    recentLeadsRes,
    filterValidTaskRows(supabase, organizationId, (tasksRes.data ?? []) as DashboardTaskRow[], scope),
    filterValidRelatedRows(supabase, organizationId, (meetingsRes.data ?? []) as DashboardMeetingRow[], ["lead", "deal"], scope),
    risksRes,
  ]);

  const kpi = buildRoleStatCards(summary, role);
  const revenue = buildRevenueSeries(summary.revenueByMonth);
  const dealsByStage: DealStageOverview[] = Object.entries(summary.dealsByStage).map(([stage, count]) => ({
    stage,
    count,
    percentage: summary.totalOpenDeals ? Math.round((count / summary.totalOpenDeals) * 100) : 0,
  }));

  const recentLeads: Lead[] = (recentLeadsQuery.data ?? []).map((l) => ({
    id: l.id,
    name: l.full_name ?? l.email ?? "Lead",
    company: l.company_name ?? "",
    source: (l.source as Lead["source"]) ?? "Other",
    score: l.score ?? 0,
    time: toIso(l.created_at),
    email: l.email ?? undefined,
  }));

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

  const dealRisks: DealRisk[] = (riskRows.data ?? []).map((r) => ({
    id: r.id,
    company: Array.isArray(r.companies) ? "" : (r.companies as { name: string } | null)?.name ?? "",
    reason: r.health_status === "Critical" ? "Deal health is critical" : "Deal needs attention",
    amount: Number(r.value ?? 0),
    status: r.health_status === "Critical" ? "red" : "orange",
  }));

  return { kpi, revenue, dealsByStage, recentLeads, upcomingTasks, todayMeetings, dealRisks };
}

interface RoleAggregate {
  totalLeads: number;
  qualifiedLeads: number;
  totalOpportunities: number;
  activeOpportunities: number;
  pipelineValue: number;
  proposals: number;
  pendingRsmApproval: number;
  pendingHeadApproval: number;
  closedWon: number;
  closedLost: number;
  wonRevenue: number;
  dealsByStage: Record<string, number>;
  revenueByMonth: Record<string, number>;
  totalOpenDeals: number;
}

async function getRoleAggregate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  scope: SalesAccessScope | null,
): Promise<RoleAggregate> {
  const ownerSafeScope = scope && isOrgWideRole(scope.role) ? null : scope;
  const leadQuery = supabase
    .from("leads")
    .select("id, status, owner_id, expected_value, created_at")
    .eq("organization_id", organizationId)
    .is("archived_at", null);

  const dealQuery = supabase
    .from("deals")
    .select("id, owner_id, value, probability, won_at, lost_at, stage_id, pipeline_stages(name)")
    .eq("organization_id", organizationId)
    .is("archived_at", null);

  const quoteQuery = supabase
    .from("quotes")
    .select("id, created_by, approval_status, status, total")
    .eq("organization_id", organizationId);

  const closeRequestQuery = supabase
    .from("deal_close_requests")
    .select("id, deal_id, organization_id, status, requested_by, requested_at, final_value")
    .eq("organization_id", organizationId)
    .eq("status", "pending_head_approval");

  const [leadRes, dealRes, quoteRes, closeRequestRes] = await Promise.all([
    applyOwnerScope(leadQuery, ownerSafeScope, "owner_id") as typeof leadQuery,
    applyOwnerScope(dealQuery, ownerSafeScope, "owner_id") as typeof dealQuery,
    applyOwnerScope(quoteQuery, ownerSafeScope, "created_by") as typeof quoteQuery,
    applyOwnerScope(closeRequestQuery, ownerSafeScope, "requested_by") as typeof closeRequestQuery,
  ]);

  const leadRows = (leadRes.data ?? []) as Array<{ id: string; status: string | null; owner_id: string | null }>;
  const dealRows = (dealRes.data ?? []) as Array<{ id: string; owner_id: string | null; value: number | null; probability: number | null; won_at: string | null; lost_at: string | null; pipeline_stages: { name?: string | null } | null }>;
  const quoteRows = (quoteRes.data ?? []) as Array<{ id: string; created_by: string | null; approval_status: string | null; status: string | null; total: number | null }>;
  const closeRequests = (closeRequestRes.data ?? []) as Array<{ id: string; requested_by: string | null; final_value: number | null; requested_at: string | null }>;

  const totalLeads = leadRows.length;
  const qualifiedLeads = leadRows.filter((lead) => (lead.status ?? "").toLowerCase() === "qualified").length;
  const openDeals = dealRows.filter((deal) => !deal.won_at && !deal.lost_at);
  const closedWon = dealRows.filter((deal) => !!deal.won_at);
  const closedLost = dealRows.filter((deal) => !!deal.lost_at);
  const dealsByStage: Record<string, number> = {};
  for (const deal of openDeals) {
    const stageName = Array.isArray(deal.pipeline_stages) ? "Open" : (deal.pipeline_stages?.name ?? "Open");
    const key = stageName || "Open";
    dealsByStage[key] = (dealsByStage[key] ?? 0) + 1;
  }
  const revenueByMonth: Record<string, number> = {};
  for (const deal of closedWon) {
    const key = deal.won_at ? new Date(deal.won_at).toISOString().slice(0, 7) : null;
    if (!key) continue;
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + Number(deal.value ?? 0);
  }

  return {
    totalLeads,
    qualifiedLeads,
    totalOpportunities: dealRows.length,
    activeOpportunities: openDeals.length,
    pipelineValue: openDeals.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0),
    proposals: quoteRows.filter((quote) => quote.status && quote.status !== "Draft").length,
    pendingRsmApproval: quoteRows.filter((quote) => (quote.approval_status ?? "") === "pending_rsm_approval").length,
    pendingHeadApproval: closeRequests.length,
    closedWon: closedWon.length,
    closedLost: closedLost.length,
    wonRevenue: closedWon.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0),
    dealsByStage,
    revenueByMonth,
    totalOpenDeals: openDeals.length,
  };
}

function buildRoleStatCards(summary: RoleAggregate, role: SalesAccessScope["role"]): StatCardData[] {
  const labels = {
    bdo: {
      leads: "My Leads",
      qualified: "Qualified Leads",
      opportunities: "My Opportunities",
      active: "Active Opportunities",
      pipeline: "Pipeline Value",
      proposals: "Proposals",
      rsmApproval: "Pending RSM Approval",
      closedWon: "Closed Won",
      closedLost: "Closed Lost",
      wonRevenue: "Won Revenue",
    },
    rsm: {
      leads: "Regional Leads",
      qualified: "Qualified Leads",
      opportunities: "Regional Opportunities",
      active: "Active Opportunities",
      pipeline: "Regional Pipeline Value",
      proposals: "Proposals",
      rsmApproval: "Pending Proposal Approvals",
      closedWon: "Closed Won",
      closedLost: "Closed Lost",
      wonRevenue: "Regional Won Revenue",
    },
    head_of_sales: {
      leads: "Total Leads",
      qualified: "Qualified Leads",
      opportunities: "Total Opportunities",
      active: "Active Opportunities",
      pipeline: "Company Pipeline Value",
      proposals: "Pending Proposal Approvals",
      rsmApproval: "Pending Close Approvals",
      closedWon: "Closed Won",
      closedLost: "Closed Lost",
      wonRevenue: "Won Revenue",
    },
    admin: {
      leads: "Total Leads",
      qualified: "Qualified Leads",
      opportunities: "Total Opportunities",
      active: "Active Opportunities",
      pipeline: "Pipeline Value",
      proposals: "Proposals",
      rsmApproval: "Pending Approvals",
      closedWon: "Closed Won",
      closedLost: "Closed Lost",
      wonRevenue: "Won Revenue",
    },
    other: {
      leads: "Total Leads",
      qualified: "Qualified Leads",
      opportunities: "Opportunities",
      active: "Active Opportunities",
      pipeline: "Pipeline Value",
      proposals: "Proposals",
      rsmApproval: "Pending Approvals",
      closedWon: "Closed Won",
      closedLost: "Closed Lost",
      wonRevenue: "Won Revenue",
    },
  } as const;

  const cfg = labels[role] ?? labels.other;
  const base = [
    { id: "dashboard-leads", label: cfg.leads, value: String(summary.totalLeads), change: "", comparison: "current scope" },
    { id: "dashboard-qualified", label: cfg.qualified, value: String(summary.qualifiedLeads), change: "", comparison: "qualified" },
    { id: "dashboard-opportunities", label: cfg.opportunities, value: String(summary.totalOpportunities), change: "", comparison: "all" },
    { id: "dashboard-active", label: cfg.active, value: String(summary.activeOpportunities), change: "", comparison: "open" },
    { id: "dashboard-pipeline", label: cfg.pipeline, value: formatCompact(summary.pipelineValue), change: "", comparison: "weighted" },
    { id: "dashboard-proposals", label: cfg.proposals, value: String(summary.proposals), change: "", comparison: "total" },
    { id: "dashboard-rsm-approval", label: cfg.rsmApproval, value: String(summary.pendingRsmApproval), change: "", comparison: "approval queue" },
    { id: "dashboard-closed-won", label: cfg.closedWon, value: String(summary.closedWon), change: "", comparison: "won" },
    { id: "dashboard-closed-lost", label: cfg.closedLost, value: String(summary.closedLost), change: "", comparison: "lost" },
    { id: "dashboard-won-revenue", label: cfg.wonRevenue, value: formatCompact(summary.wonRevenue), change: "", comparison: "all time" },
  ];

  return base.slice(0, 4).concat(base.slice(4));
}

async function getRoleTeamMembers(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  scope: SalesAccessScope | null,
): Promise<TeamMemberPerformance[]> {
  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("user_id, profiles(full_name), roles(name)")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const members = (memberRows ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? null : (row.profiles as { full_name?: string | null } | null);
    const role = Array.isArray(row.roles) ? null : (row.roles as { name?: string | null } | null);
    return {
      user_id: row.user_id as string,
      name: profile?.full_name ?? role?.name ?? "Team Member",
    };
  });

  let allowedUsers = members.map((member) => member.user_id);
  if (scope && !isOrgWideRole(scope.role)) {
    if (scope.role === "bdo") {
      allowedUsers = [scope.userId];
    } else if (scope.role === "rsm") {
      allowedUsers = Array.from(scope.visibleOwnerIds ?? new Set([scope.userId]));
    }
  }

  const allowedUserSet = new Set(allowedUsers);
  const visibleMembers = members.filter((member) => allowedUserSet.has(member.user_id));
  if (!visibleMembers.length) return [];

  const { data: leadRows } = await supabase
    .from("leads")
    .select("owner_id")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .in("owner_id", visibleMembers.map((member) => member.user_id));

  const { data: dealRows } = await supabase
    .from("deals")
    .select("owner_id, value, won_at")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .in("owner_id", visibleMembers.map((member) => member.user_id));

  const leadCounts = new Map<string, number>();
  for (const row of leadRows ?? []) {
    if (!row.owner_id) continue;
    leadCounts.set(row.owner_id, (leadCounts.get(row.owner_id) ?? 0) + 1);
  }

  const summary = new Map<string, { revenue: number; dealsWon: number; pipelineValue: number; leads: number }>();
  for (const member of visibleMembers) {
    summary.set(member.user_id, {
      revenue: 0,
      dealsWon: 0,
      pipelineValue: 0,
      leads: leadCounts.get(member.user_id) ?? 0,
    });
  }

  for (const row of dealRows ?? []) {
    if (!row.owner_id) continue;
    const stats = summary.get(row.owner_id) ?? { revenue: 0, dealsWon: 0, pipelineValue: 0, leads: 0 };
    stats.pipelineValue += Number(row.value ?? 0);
    if (row.won_at) {
      stats.revenue += Number(row.value ?? 0);
      stats.dealsWon += 1;
    }
    summary.set(row.owner_id, stats);
  }

  return [...visibleMembers]
    .map((member) => {
      const stats = summary.get(member.user_id) ?? { revenue: 0, dealsWon: 0, pipelineValue: 0, leads: 0 };
      return {
        id: member.user_id,
        name: member.name,
        dealsWon: stats.dealsWon,
        revenue: stats.revenue,
        growth: 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
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