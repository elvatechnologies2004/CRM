import "server-only";

import { getActiveOrgId, toIso } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
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

/**
 * Server-computed dashboard aggregates (Steps 59–60). All SQL-side.
 * Returns null when Supabase is unavailable so pages fall back to mocks.
 */
export async function getDashboardData(): Promise<DashboardData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const [leadsRes, dealsRes, stageRes, recentLeadsRes, tasksRes, meetingsRes, risksRes] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .is("archived_at", null),
      supabase
        .from("deals")
        .select("won_at, lost_at, value, probability, expected_close_date, name, id")
        .eq("organization_id", organizationId)
        .is("archived_at", null),
      supabase
        .from("deals")
        .select("stage_id, pipeline_stages(name, position)")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .is("won_at", null)
        .is("lost_at", null),
      supabase
        .from("leads")
        .select("id, full_name, email, company_name, source, score, created_at")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("tasks")
        .select("id, title, priority, due_at, status")
        .eq("organization_id", organizationId)
        .in("status", ["Open", "In Progress"])
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(6),
      supabase
        .from("meetings")
        .select("id, title, start_at, meeting_url")
        .eq("organization_id", organizationId)
        .gte("start_at", startOfToday())
        .lt("start_at", startOfTomorrow())
        .order("start_at", { ascending: true })
        .limit(5),
      supabase
        .from("deals")
        .select("id, name, companies(name), value, health_status, last_activity_at, won_at, lost_at")
        .eq("organization_id", organizationId)
        .is("archived_at", null)
        .or("health_status.eq.At Risk,health_status.eq.Critical")
        .limit(10),
    ]);

  const dealRows = (dealsRes.data ?? []) as Array<{
    won_at: string | null;
    lost_at: string | null;
    value: number | null;
    probability: number | null;
  }>;

  const openDeals = dealRows.filter((d) => !d.won_at && !d.lost_at);
  const wonDeals = dealRows.filter((d) => d.won_at);
  const closedThisMonth = wonDeals.filter((d) =>
    sameMonth(d.won_at, new Date()),
  );

  const expectedRevenue = openDeals.reduce(
    (sum, d) => sum + Number(d.value ?? 0) * (Number(d.probability ?? 0) / 100),
    0,
  );

  // Revenue Overview: last 6 completed months from won deals.
  const revenue = buildRevenueSeries(wonDeals.map((d) => d.won_at as string));

  // Deals by stage
  const stages: Record<string, number> = {};
  for (const row of stageRes.data ?? []) {
    const name = Array.isArray(row.pipeline_stages)
      ? null
      : (row.pipeline_stages as { name: string } | null)?.name;
    const key = name ?? "Open";
    stages[key] = (stages[key] ?? 0) + 1;
  }
  const dealsByStage: DealStageOverview[] = Object.entries(stages).map(([stage, count]) => ({
    stage,
    count,
    percentage: openDeals.length ? Math.round((count / openDeals.length) * 100) : 0,
  }));

  const kpi: StatCardData[] = [
    { id: "kpi-leads", label: "Total Leads", value: String(leadsRes.count ?? 0), change: "", comparison: "all time" },
    { id: "kpi-deals", label: "Active Deals", value: String(openDeals.length), change: "", comparison: "open" },
    { id: "kpi-revenue", label: "Expected Revenue", value: formatCompact(expectedRevenue), change: "", comparison: "weighted" },
    { id: "kpi-won", label: "Won Deals", value: String(wonDeals.length), change: closedThisMonth.length ? `+${closedThisMonth.length}` : "", comparison: "this month" },
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

  const upcomingTasks: Task[] = (tasksRes.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    time: t.due_at ? toIso(t.due_at) : "",
    subtitle: t.status === "In Progress" ? "In progress" : t.status,
    priority: (t.priority as Task["priority"]) ?? "medium",
    completed: t.status === "Completed",
  }));

  const todayMeetings: Meeting[] = (meetingsRes.data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    time: m.start_at ? toIso(m.start_at) : "",
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

function sameMonth(iso: string | null, now: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getUTCMonth() === now.getUTCMonth() && d.getUTCFullYear() === now.getUTCFullYear();
}

function buildRevenueSeries(wonAt: string[]): RevenuePoint[] {
  const monthTotals: Record<string, number> = {};
  for (const iso of wonAt) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 7);
    monthTotals[key] = (monthTotals[key] ?? 0) + 1;
  }
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