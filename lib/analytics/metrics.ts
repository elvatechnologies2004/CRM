import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";
import { getCurrentUser, can } from "@/lib/crm/context";

export interface ActivitySeriesPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface UsageAggregate {
  leads: number;
  contacts: number;
  companies: number;
  deals: number;
  tasks: number;
  emails: number;
  automations: number;
  quotes: number;
}

export interface AnalyticsSnapshot {
  events: ActivitySeriesPoint[];
  topEvents: { event_name: string; count: number }[];
  lastEvent: { event_name: string; created_at: string } | null;
  usage: UsageAggregate;
}

const ACTIVITY_TABLES: { key: keyof UsageAggregate; table: string }[] = [
  { key: "leads", table: "leads" },
  { key: "contacts", table: "contacts" },
  { key: "companies", table: "companies" },
  { key: "deals", table: "deals" },
  { key: "tasks", table: "tasks" },
  { key: "emails", table: "emails" },
  { key: "automations", table: "automations" },
  { key: "quotes", table: "quotes" },
];

/**
 * Org-scoped usage + product analytics (Step 99).
 * Requires a workspace and the `analytics.view` (or admin `*`) permission.
 * Returns null when the caller isn't authorized or has no org.
 */
export async function getOrgAnalytics(): Promise<AnalyticsSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);
  if (!orgId) return null;

  // Permission gate: allow platform admins and users with analytics/view
  // or settings management.
  const allowed = (await can("admin")) || (await can("analytics.view")) || (await can("settings.manage"));
  if (!allowed) return null;

  void (await getCurrentUser());

  // ---- Usage counts ----
  const usage: UsageAggregate = {
    leads: 0,
    contacts: 0,
    companies: 0,
    deals: 0,
    tasks: 0,
    emails: 0,
    automations: 0,
    quotes: 0,
  };
  await Promise.all(
    ACTIVITY_TABLES.map(async ({ key, table }) => {
      const { count } = await supabase
        .from(table as "leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      usage[key] = count ?? 0;
    }),
  );

  // ---- Events for the last 14 days (daily series) ----
  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: rawEvents } = await supabase
    .from("product_events")
    .select("event_name, created_at")
    .eq("organization_id", orgId)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(2000);

  const byDay = new Map<string, number>();
  for (const row of rawEvents ?? []) {
    const day = row.created_at?.slice(0, 10) ?? "unknown";
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const events: ActivitySeriesPoint[] = Array.from(byDay.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // ---- Top events ----
  const eventCounts = new Map<string, number>();
  for (const row of rawEvents ?? []) {
    eventCounts.set(row.event_name, (eventCounts.get(row.event_name) ?? 0) + 1);
  }
  const topEvents = Array.from(eventCounts.entries())
    .map(([event_name, count]) => ({ event_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const lastEvent = rawEvents?.[rawEvents.length - 1]?.event_name
    ? {
        event_name: rawEvents[rawEvents.length - 1].event_name,
        created_at: rawEvents[rawEvents.length - 1].created_at ?? "",
      }
    : null;

  return { events, topEvents, lastEvent, usage };
}