import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Plan catalog helpers (Step 95).
 *
 * Plans are queried from the `plans` table when available, falling back
 * to a static catalog when Supabase is not configured so the UI keeps
 * working in mock/localStorage development.
 */

export type PlanCode = "free" | "starter" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export interface PlanEntitlements {
  ai: boolean;
  automations: boolean;
  integrations: boolean;
  apiAccess: boolean;
  sequences: boolean;
  reports: boolean;
  sso?: boolean;
  audit?: boolean;
}

export interface PlanLimits {
  seats: number;
  contacts: number;
  deals: number;
  automations: number;
  storageGb: number;
}

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  billingMode: "free" | "standard" | "contact_sales";
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  sortOrder: number;
  isActive: boolean;
  entitlements: PlanEntitlements;
  limits: PlanLimits;
}

export const DEFAULT_PLAN_CODE: PlanCode = "free";

const STATIC_PLANS: Plan[] = [
  {
    id: "plan-free",
    code: "free",
    name: "Free",
    description: "For individuals getting started",
    billingMode: "free",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    sortOrder: 0,
    isActive: true,
    entitlements: {
      ai: false,
      automations: false,
      integrations: false,
      apiAccess: false,
      sequences: false,
      reports: false,
    },
    limits: { seats: 1, contacts: 50, deals: 10, automations: 0, storageGb: 0.5 },
  },
  {
    id: "plan-starter",
    code: "starter",
    name: "Starter",
    description: "For small teams starting to sell",
    billingMode: "standard",
    monthlyPriceCents: 2900,
    yearlyPriceCents: 29000,
    sortOrder: 1,
    isActive: true,
    entitlements: {
      ai: false,
      automations: true,
      integrations: true,
      apiAccess: false,
      sequences: true,
      reports: false,
    },
    limits: { seats: 3, contacts: 500, deals: 200, automations: 5, storageGb: 5 },
  },
  {
    id: "plan-pro",
    code: "pro",
    name: "Pro",
    description: "Everything your team needs to grow",
    billingMode: "standard",
    monthlyPriceCents: 6900,
    yearlyPriceCents: 69000,
    sortOrder: 2,
    isActive: true,
    entitlements: {
      ai: true,
      automations: true,
      integrations: true,
      apiAccess: true,
      sequences: true,
      reports: true,
    },
    limits: { seats: 10, contacts: 5000, deals: 2000, automations: 50, storageGb: 50 },
  },
  {
    id: "plan-business",
    code: "business",
    name: "Business",
    description: "For organizations that need scale and control",
    billingMode: "contact_sales",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    sortOrder: 3,
    isActive: true,
    entitlements: {
      ai: true,
      automations: true,
      integrations: true,
      apiAccess: true,
      sequences: true,
      reports: true,
      sso: true,
      audit: true,
    },
    limits: { seats: -1, contacts: -1, deals: -1, automations: -1, storageGb: -1 },
  },
];

function normalizeBillingMode(mode: string | null | undefined): Plan["billingMode"] {
  if (mode === "free" || mode === "standard" || mode === "contact_sales") return mode;
  return "standard";
}

function normalizeBoolean(value: boolean | null | undefined): boolean {
  return Boolean(value);
}

function normalizeNumber(value: number | null | undefined): number {
  return typeof value === "number" ? value : 0;
}

/** Normalize a raw plans row (from Supabase) into the typed Plan shape. */
export function normalizePlan(row: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billing_mode: string | null;
  monthly_price_cents: number | null;
  yearly_price_cents: number | null;
  sort_order: number | null;
  is_active: boolean | null;
  entitlements: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
}): Plan {
  const ent = (row.entitlements ?? {}) as Partial<PlanEntitlements>;
  const lim = (row.limits ?? {}) as Partial<PlanLimits>;
  return {
    id: row.id,
    code: (["free", "starter", "pro", "business"].includes(row.code)
      ? row.code
      : "free") as PlanCode,
    name: row.name,
    description: row.description,
    billingMode: normalizeBillingMode(row.billing_mode),
    monthlyPriceCents: normalizeNumber(row.monthly_price_cents),
    yearlyPriceCents: normalizeNumber(row.yearly_price_cents),
    sortOrder: normalizeNumber(row.sort_order),
    isActive: normalizeBoolean(row.is_active),
    entitlements: {
      ai: normalizeBoolean(ent.ai),
      automations: normalizeBoolean(ent.automations),
      integrations: normalizeBoolean(ent.integrations),
      apiAccess: normalizeBoolean(ent.apiAccess),
      sequences: normalizeBoolean(ent.sequences),
      reports: normalizeBoolean(ent.reports),
      sso: normalizeBoolean(ent.sso),
      audit: normalizeBoolean(ent.audit),
    },
    limits: {
      seats: normalizeNumber(lim.seats),
      contacts: normalizeNumber(lim.contacts),
      deals: normalizeNumber(lim.deals),
      automations: normalizeNumber(lim.automations),
      storageGb: normalizeNumber(lim.storageGb),
    },
  };
}

/** Fetch the active plan catalog from the DB, falling back to the static list. */
export async function fetchPlans(): Promise<Plan[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("plans")
      .select(
        "id, code, name, description, billing_mode, monthly_price_cents, yearly_price_cents, sort_order, is_active, entitlements, limits",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return STATIC_PLANS;
    return data.map((row) => normalizePlan(row as Parameters<typeof normalizePlan>[0]));
  } catch {
    return STATIC_PLANS;
  }
}

/** Sync helper for non-config (mock) mode. */
export function getStaticPlans(): Plan[] {
  return STATIC_PLANS;
}

export function findPlan(plans: Plan[], code: PlanCode): Plan | undefined {
  return plans.find((p) => p.code === code);
}