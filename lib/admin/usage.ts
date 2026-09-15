import "server-only";

import { getAdminDb } from "@/lib/admin/db";
import { getStaticPlans, type Plan } from "@/lib/billing/plans";

export type UsageStatus = "normal" | "approaching" | "reached" | "unknown";

export interface UsageRow {
  organizationId: string;
  organizationName: string;
  planName: string | null;
  planCode: string | null;
  counts: Record<string, number>;
  limitKey: string;
  limitValue: number;
  limitPercent: number;
  status: UsageStatus;
}

export interface UsageSummary {
  totals: Record<string, number>;
  perOrganization: UsageRow[];
}

function usageStatus(percent: number): UsageStatus {
  if (percent >= 100) return "reached";
  if (percent >= 80) return "approaching";
  return "normal";
}

export async function getUsageSummary(): Promise<UsageSummary> {
  try {
    const db = getAdminDb();

    const [{ data: orgs }, { data: subs }, { data: members }, { data: leads }, { data: contacts }, { data: companies }, { data: deals }, { data: runs }] =
      await Promise.all([
        db.from("organizations").select("id, name"),
        db.from("subscriptions").select("organization_id, plan_name, status"),
        db
          .from("organization_members")
          .select("organization_id")
          .eq("status", "active"),
        db.from("leads").select("organization_id"),
        db.from("contacts").select("organization_id"),
        db.from("companies").select("organization_id"),
        db.from("deals").select("organization_id"),
        db.from("automation_runs").select("organization_id"),
      ]);

    const tableCounters: { name: string; rows: { organization_id: string }[] | null }[] = [
      { name: "leads", rows: leads },
      { name: "contacts", rows: contacts },
      { name: "companies", rows: companies },
      { name: "deals", rows: deals },
      { name: "automation_runs", rows: runs },
    ];

    const perOrg = new Map<string, Record<string, number>>();
    for (const org of orgs ?? []) {
      perOrg.set(org.id, {});
    }

    function bump(table: { name: string; rows: { organization_id: string }[] | null }) {
      for (const row of table.rows ?? []) {
        const cur = perOrg.get(row.organization_id);
        if (cur) cur[table.name] = (cur[table.name] ?? 0) + 1;
      }
    }
    for (const table of tableCounters) bump(table);
    for (const m of members ?? []) {
      const cur = perOrg.get(m.organization_id);
      if (cur) cur.users = (cur.users ?? 0) + 1;
    }

    const planByOrg = new Map<string, { plan_name: string | null; status: string | null }>();
    for (const s of subs ?? []) {
      const current = planByOrg.get(s.organization_id);
      if (!current || (s.status ?? "").toLowerCase() !== "cancelled") {
        planByOrg.set(s.organization_id, { plan_name: s.plan_name, status: s.status });
      }
    }

    const totals: Record<string, number> = {};
    for (const table of tableCounters) totals[table.name] = table.rows?.length ?? 0;
    totals.users = members?.length ?? 0;
    totals.organizations = orgs?.length ?? 0;

    const rows: UsageRow[] = (orgs ?? []).map((org) => {
      const planRow = planByOrg.get(org.id);
      const planName = planRow?.plan_name ?? null;
      const code = (planName ?? "").toLowerCase().includes("b")
        ? "business"
        : (planName ?? "").toLowerCase().includes("pro")
          ? "pro"
          : (planName ?? "").toLowerCase().includes("starter")
            ? "starter"
            : "free";

      const plans = getStaticPlans();

      const plan = [
        plans.find((p: Plan) => p.code === code),
        plans.find((p: Plan) => p.code === "free"),
      ].find(Boolean) as Plan | undefined;

      const counts = perOrg.get(org.id) ?? {};
      const limitKey = "contacts";
      const limit = (plan?.limits ?? { contacts: 0 }).contacts ?? 0;
      const used = Number(counts.contacts ?? 0);
      const percent = limit > 0 ? Math.round((used / limit) * 100) : (used > 0 ? 100 : 0);

      return {
        organizationId: org.id,
        organizationName: org.name,
        planName,
        planCode: code,
        counts,
        limitKey,
        limitValue: limit,
        limitPercent: percent,
        status: limit > 0 ? usageStatus(percent) : used > 0 ? "reached" : "unknown",
      };
    });

    rows.sort((a, b) => (b.counts.contacts ?? 0) - (a.counts.contacts ?? 0));

    return { totals, perOrganization: rows };
  } catch {
    return { totals: {}, perOrganization: [] };
  }
}