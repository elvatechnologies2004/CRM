import "server-only";

import {
  buildMonthSeries,
  getAdminDb,
  monthLabel,
} from "@/lib/admin/db";

export type GrowthKind = "organizations" | "users" | "subscriptions";

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface PlanDistributionPoint {
  plan: string;
  count: number;
}

export interface RevenueTrendPoint {
  label: string;
  value: number;
}

export interface AnalyticsSnapshot {
  organizationGrowth: SeriesPoint[];
  userGrowth: SeriesPoint[];
  subscriptionGrowth: SeriesPoint[];
  revenueTrend: SeriesPoint[];
  planDistribution: PlanDistributionPoint[];
  trialConversion: { trial: number; paid: number; rate: number | null };
}

async function fetchCreatedAt(table: string): Promise<string[]> {
  try {
    const db = getAdminDb();
    const { data } = await db.from(table).select("created_at");
    return (data ?? []).map((r) => String(r.created_at ?? ""));
  } catch {
    return [];
  }
}

export async function getGrowthSeries(
  kind: GrowthKind,
  months = 12,
): Promise<SeriesPoint[]> {
  const table =
    kind === "organizations"
      ? "organizations"
      : kind === "users"
        ? "profiles"
        : "subscriptions";
  const dates = await fetchCreatedAt(table);
  return buildMonthSeries(dates, months).map((p) => ({
    label: p.label,
    value: p.count,
  }));
}

export async function getRevenueTrend(months = 12): Promise<SeriesPoint[]> {
  try {
    const db = getAdminDb();
    const { data } = await db
      .from("payments")
      .select("amount, paid_at")
      .eq("status", "Completed");

    const buckets = new Map<string, number>();
    for (const p of data ?? []) {
      const month = monthLabel(String(p.paid_at ?? ""));
      buckets.set(month, (buckets.get(month) ?? 0) + Number(p.amount ?? 0));
    }

    const now = new Date();
    const series: SeriesPoint[] = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      series.push({ label, value: Number(buckets.get(label)?.toFixed(0) ?? 0) });
    }
    return series;
  } catch {
    return [];
  }
}

export async function getPlanDistribution(): Promise<PlanDistributionPoint[]> {
  try {
    const db = getAdminDb();
    const { data } = await db.from("subscriptions").select("plan_name, status");
    const counts = new Map<string, number>();
    for (const s of data ?? []) {
      const name = String(s.plan_name ?? "Unspecified");
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

export async function getTrialConversion(): Promise<AnalyticsSnapshot["trialConversion"]> {
  try {
    const db = getAdminDb();
    const { data } = await db.from("subscriptions").select("status");
    const trial = (data ?? []).filter((s) =>
      ["trial", "trialing"].includes(String(s.status).toLowerCase()),
    ).length;
    const paid = (data ?? []).filter((s) => {
      const st = String(s.status).toLowerCase();
      return !["trial", "trialing", "none", "cancelled", "expired", "past_due", "suspended"].includes(st);
    }).length;
    return { trial, paid, rate: paid + trial > 0 ? Math.round((paid / (paid + trial)) * 100) : null };
  } catch {
    return { trial: 0, paid: 0, rate: null };
  }
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const [organizationGrowth, userGrowth, subscriptionGrowth, revenueTrend, planDistribution, trialConversion] =
    await Promise.all([
      getGrowthSeries("organizations"),
      getGrowthSeries("users"),
      getGrowthSeries("subscriptions"),
      getRevenueTrend(12),
      getPlanDistribution(),
      getTrialConversion(),
    ]);
  return {
    organizationGrowth,
    userGrowth,
    subscriptionGrowth,
    revenueTrend,
    planDistribution,
    trialConversion,
  };
}