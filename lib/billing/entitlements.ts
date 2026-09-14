import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPlans, type Plan, type PlanCode, type PlanEntitlements, type PlanLimits } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe";

export interface OrgUsage {
  seats: number;
  contacts: number;
  deals: number;
  automations: number;
}

export interface EntitlementResult {
  plan: Plan;
  usage: OrgUsage;
  features: PlanEntitlements;
  limits: PlanLimits;
  /** null in mock mode / no subscription. */
  trialEndsAt: string | null;
  status: "trialing" | "active" | "past_due" | "free" | "canceled";
  withinLimits: boolean;
  overLimitFields: Array<keyof PlanLimits>;
}

const NO_LIMIT = -1;

/**
 * Resolve the effective plan + usage constraints for the current org
 * (Steps 95 / 98). Reads the subscription row directly; when Supabase is
 * not configured it returns the Free plan with zero usage so the mock UI
 * keeps working.
 */
export async function getEntitlements(): Promise<EntitlementResult | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return null;

  const orgId = membership.organization_id as string;
  const plans = await fetchPlans();
  const freePlan = plans.find((p) => p.code === "free") ?? plans[0];

  const { data: sub } = await supabase
    .from("organization_subscriptions")
    .select("plan_id, status, trial_ends_at, plans(code)")
    .eq("organization_id", orgId)
    .maybeSingle();

  let plan = freePlan;
  let trialEndsAt: string | null = null;
  let subStatus: EntitlementResult["status"] = "free";

  if (sub) {
    const code = Array.isArray(sub.plans) ? null : (sub.plans as { code?: string } | null);
    plan =
      plans.find((p) => p.code === (code?.code as PlanCode)) ??
      freePlan;
    trialEndsAt = sub.trial_ends_at ?? null;
    const s = sub.status as string;
    if (s === "active" || s === "trialing" || s === "past_due") subStatus = s as EntitlementResult["status"];
    else if (s === "canceled") subStatus = "canceled";
    else subStatus = "free";
  }

  const usage = await collectUsage(orgId);

  // A subscription is within all limits when no field is over budget.
  const usageKeys = Object.keys(usage) as Array<keyof OrgUsage>;
  const overLimitFields = usageKeys.filter((key) => {
    const limit = plan.limits[key];
    if (typeof limit !== "number" || limit === NO_LIMIT) return false;
    return (usage[key] ?? 0) > limit;
  });

  return {
    plan,
    usage,
    features: plan.entitlements,
    limits: plan.limits,
    trialEndsAt,
    status: subStatus,
    withinLimits: overLimitFields.length === 0,
    overLimitFields: overLimitFields as Array<keyof PlanLimits>,
  };
}

/** Count current rows for the org across the limitable entities. */
async function collectUsage(orgId: string): Promise<OrgUsage> {
  const supabase = await createSupabaseServerClient();
  const tables: Array<{ key: keyof OrgUsage; table: string }> = [
    { key: "contacts", table: "contacts" },
    { key: "deals", table: "deals" },
    { key: "automations", table: "automations" },
  ];

  const counts: Record<string, number> = { seats: 1, contacts: 0, deals: 0, automations: 0 };

  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "active");
  counts.seats = memberRows?.length ?? 1;

  await Promise.all(
    tables.map(async ({ key, table }) => {
      const { count } = await supabase
        .from(table as "contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      counts[key] = count ?? 0;
    }),
  );

  return { seats: counts.seats, contacts: counts.contacts, deals: counts.deals, automations: counts.automations };
}

/**
 * Entitlement check helpers for UI use (Steps 95/98). These are advisory —
 * real enforcement for consequential things should remain in server
 * actions / RLS. Undefined features return false.
 */
export function hasFeature(features: PlanEntitlements, feature: keyof PlanEntitlements): boolean {
  return Boolean(features[feature]);
}

export function isAiEnabled(ent: EntitlementResult): boolean {
  return Boolean(ent.features.ai);
}

export { isStripeConfigured };