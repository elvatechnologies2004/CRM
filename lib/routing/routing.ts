import "server-only";

import { can } from "@/lib/crm/context";
import { getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { matchTerritoryForLead } from "@/lib/territories/territories";
import { dispatchWorkflowEvent } from "@/lib/workflows/dispatch";
import type {
  RouterLead,
  RoutingCondition,
  RoutingRuleRecord,
  RoutingStrategy,
} from "./shared";
import { ROUTING_STRATEGIES } from "./shared";

export type {
  RouterLead,
  RoutingCondition,
  RoutingRuleRecord,
  RoutingStrategy,
};
export { ROUTING_STRATEGIES };

/**
 * STEP 123 — Advanced lead routing.
 * Eight strategies: round robin, least loaded, territory, source based,
 * product based, enterprise account, weighted, VIP.
 * Every assignment is tracked (previous owner, assigned_at, reason, rule)
 * and may be manually overridden.
 */

export async function getRoutingRules(): Promise<{ rules: RoutingRuleRecord[]; canManage: boolean } | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const canManage = await can("routing.manage");

  const { data } = await supabase
    .from("routing_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .order("priority", { ascending: false });

  return {
    canManage,
    rules: (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      strategy: r.strategy as RoutingStrategy,
      description: r.description,
      priority: r.priority,
      is_active: r.is_active,
      conditions: Array.isArray(r.conditions) ? (r.conditions as RoutingCondition[]) : [],
      target_type: r.target_type,
      target_id: r.target_id,
      weight: r.weight,
    })),
  };
}

async function requireRoutingManage(): Promise<{ supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; organizationId: string }> {
  if (!(await can("routing.manage"))) {
    throw new Error("You do not have permission to manage routing rules");
  }
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) throw new Error("No active workspace");
  return { supabase, organizationId };
}

export interface CreateRoutingRuleInput {
  name: string;
  strategy: RoutingStrategy;
  description?: string;
  priority?: number;
  isActive?: boolean;
  conditions?: RoutingCondition[];
  targetType: "team" | "user" | "territory" | "all";
  targetId?: string | null;
  weight?: number;
}

export async function createRoutingRule(input: CreateRoutingRuleInput): Promise<boolean> {
  const { supabase, organizationId } = await requireRoutingManage();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("routing_rules").insert({
    organization_id: organizationId,
    name: input.name,
    strategy: input.strategy,
    description: input.description || null,
    priority: input.priority ?? 0,
    is_active: input.isActive ?? true,
    conditions: input.conditions ?? [],
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    weight: input.weight ?? 1,
    created_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export async function updateRoutingRule(id: string, input: Partial<CreateRoutingRuleInput>): Promise<boolean> {
  const { supabase, organizationId } = await requireRoutingManage();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.strategy !== undefined) patch.strategy = input.strategy;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.conditions !== undefined) patch.conditions = input.conditions;
  if (input.targetType !== undefined) patch.target_type = input.targetType;
  if (input.targetId !== undefined) patch.target_id = input.targetId || null;
  if (input.weight !== undefined) patch.weight = input.weight;

  const { error } = await supabase.from("routing_rules").update(patch).eq("id", id).eq("organization_id", organizationId);
  return !error;
}

export async function deleteRoutingRule(id: string): Promise<boolean> {
  const { supabase, organizationId } = await requireRoutingManage();
  const { error } = await supabase.from("routing_rules").delete().eq("id", id).eq("organization_id", organizationId);
  return !error;
}

export async function toggleRoutingRule(id: string, isActive: boolean): Promise<boolean> {
  const { supabase, organizationId } = await requireRoutingManage();
  const { error } = await supabase
    .from("routing_rules")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);
  return !error;
}

// ------------------------------------------------------------------
// Matching
// ------------------------------------------------------------------

function conditionValue(lead: RouterLead, field: string): string {
  switch (field) {
    case "source":
      return lead.source ?? "";
    case "country":
      return lead.country ?? "";
    case "city":
      return lead.city ?? "";
    case "industry":
      return lead.industry ?? "";
    case "product":
      return lead.interested_product ?? "";
    case "account_type":
      return lead.account_type ?? "";
    case "company_size":
      return lead.company_size ?? "";
    case "score":
      return lead.score != null ? String(lead.score) : "";
    case "expected_value":
      return lead.expected_value != null ? String(lead.expected_value) : "";
    default:
      return "";
  }
}

function conditionMatches(lead: RouterLead, c: RoutingCondition): boolean {
  const actual = conditionValue(lead, c.field).trim().toLowerCase();
  const expected = c.value.trim().toLowerCase();

  if (c.operator === "=") return actual === expected;
  if (c.operator === "!=") return actual !== expected;

  if (c.operator === "in" || c.operator === "not in") {
    const items = expected.split(",").map((s) => s.trim()).filter(Boolean);
    const hit = items.includes(actual);
    return c.operator === "in" ? hit : !hit;
  }

  const a = Number(actual);
  const e = Number(expected);
  if (Number.isNaN(a) || Number.isNaN(e)) return false;
  switch (c.operator) {
    case ">":
      return a > e;
    case "<":
      return a < e;
    case ">=":
      return a >= e;
    case "<=":
      return a <= e;
  }
  return false;
}

// ------------------------------------------------------------------
// Candidate pools + strategy selection
// ------------------------------------------------------------------

interface Candidate {
  user_id: string;
  name: string;
}

async function fetchPool(
  supabase: any,
  rule: RoutingRuleRecord,
  organizationId: string,
  matchedTerritoryId: string | null,
): Promise<Candidate[]> {
  const territoryId =
    rule.strategy === "territory" && rule.target_type === "territory"
      ? (rule.target_id ?? matchedTerritoryId)
      : null;

  if (territoryId) {
    const { data } = await supabase
      .from("territory_members")
      .select("user_id, profiles(full_name)")
      .eq("organization_id", organizationId)
      .eq("territory_id", territoryId);
    return (data ?? []).map((r: any) => {
      const p = Array.isArray(r.profiles) ? null : (r.profiles as { full_name: string | null } | null);
      return { user_id: r.user_id, name: p?.full_name ?? r.user_id };
    });
  }

  if (rule.target_type === "user" && rule.target_id) {
    return [{ user_id: rule.target_id, name: rule.target_id }];
  }

  if (rule.target_type === "team" && rule.target_id) {
    const { data } = await supabase
      .from("organization_members")
      .select("user_id, profiles(full_name)")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .eq("team_id", rule.target_id);
    return (data ?? []).map((r: any) => {
      const p = Array.isArray(r.profiles) ? null : (r.profiles as { full_name: string | null } | null);
      return { user_id: r.user_id, name: p?.full_name ?? r.user_id };
    });
  }

  const { data } = await supabase
    .from("organization_members")
    .select("user_id, profiles(full_name)")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  return (data ?? []).map((r: any) => {
    const p = Array.isArray(r.profiles) ? null : (r.profiles as { full_name: string | null } | null);
    return { user_id: r.user_id, name: p?.full_name ?? r.user_id };
  });
}

async function loadCounts(supabase: any, organizationId: string, userIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>(userIds.map((id) => [id, 0]));
  const { data } = await supabase
    .from("leads")
    .select("owner_id")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .in("owner_id", userIds);
  for (const row of data ?? []) counts.set(row.owner_id, (counts.get(row.owner_id) ?? 0) + 1);
  return counts;
}

async function pickByRoundRobin(supabase: any, organizationId: string, pool: Candidate[]): Promise<Candidate> {
  const counts = await loadCounts(supabase, organizationId, pool.map((c) => c.user_id));
  let best = pool[0];
  let bestCount = counts.get(best.user_id) ?? 0;
  for (const c of pool) {
    const count = counts.get(c.user_id) ?? 0;
    if (count < bestCount || (count === bestCount && c.user_id < best.user_id)) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

async function pickByLeastLoaded(supabase: any, organizationId: string, pool: Candidate[]): Promise<Candidate> {
  const leadLoad = await loadCounts(supabase, organizationId, pool.map((c) => c.user_id));
  const { data: taskRows } = await supabase
    .from("tasks")
    .select("owner_id")
    .eq("organization_id", organizationId)
    .in("status", ["Open", "In Progress"])
    .in("owner_id", pool.map((c) => c.user_id));
  const taskLoad = new Map<string, number>();
  for (const row of taskRows ?? []) taskLoad.set(row.owner_id, (taskLoad.get(row.owner_id) ?? 0) + 1);

  let best = pool[0];
  let bestLoad = (leadLoad.get(best.user_id) ?? 0) + (taskLoad.get(best.user_id) ?? 0);
  for (const c of pool) {
    const load = (leadLoad.get(c.user_id) ?? 0) + (taskLoad.get(c.user_id) ?? 0);
    if (load < bestLoad || (load === bestLoad && c.user_id > best.user_id)) {
      best = c;
      bestLoad = load;
    }
  }
  return best;
}

function pickByWeighted(rule: RoutingRuleRecord, pool: Candidate[]): Candidate {
  const weights = new Map<string, number>();
  for (const c of pool) weights.set(c.user_id, rule.weight > 0 ? rule.weight : 1);
  // conditions may carry per-user weights: [{field:'weight', operator:'=', value:'userId:4'}]
  for (const c of rule.conditions) {
    if (c.field === "weight" && c.operator === "=") {
      const [uid, w] = c.value.split(":").map((s) => s.trim());
      if (uid && weights.has(uid) && w) weights.set(uid, Number(w) || 1);
    }
  }
  const total = pool.reduce((sum, c) => sum + (weights.get(c.user_id) ?? 1), 0);
  let roll = Math.random() * total;
  for (const c of pool) {
    roll -= weights.get(c.user_id) ?? 1;
    if (roll <= 0) return c;
  }
  return pool[pool.length - 1];
}

// ------------------------------------------------------------------
// Assignment
// ------------------------------------------------------------------

export interface RoutingOutcome {
  assigned: boolean;
  ownerId?: string;
  ownerName?: string;
  reason?: string;
  ruleId?: string;
  ruleName?: string;
  territoryId?: string | null;
}

export async function autoRouteLead(lead: RouterLead): Promise<RoutingOutcome> {
  const supabase = await createSupabaseServerClient();
  const organizationId = lead.organization_id || (await getActiveOrgId(supabase)) || "";
  if (!organizationId) return { assigned: false };

  // 1) Territory match always bumps territory_id and provides a pool.
  let matchedTerritoryId: string | null = null;
  const territory = await matchTerritoryForLead(lead);
  if (territory) {
    matchedTerritoryId = territory.id;
    await supabase.from("leads").update({ territory_id: territory.id }).eq("id", lead.id).eq("organization_id", organizationId);
  }

  // 2) Find best active rule whose conditions match the lead.
  const { data: ruleRows } = await supabase
    .from("routing_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("priority", { ascending: false });
  const rules = (ruleRows ?? []) as any[];

  const rule: any | null = rules.find((r) => {
    if (r.strategy === "territory" && matchedTerritoryId) {
      return r.target_type === "territory" && (!r.target_id || r.target_id === matchedTerritoryId);
    }
    const conditions = (Array.isArray(r.conditions) ? r.conditions : []) as RoutingCondition[];
    return conditions.every((c) => conditionMatches(lead, c));
  }) ?? null;

  const ruleRecord: RoutingRuleRecord | null = rule
    ? {
        id: rule.id,
        name: rule.name,
        strategy: rule.strategy,
        description: rule.description,
        priority: rule.priority,
        is_active: rule.is_active,
        conditions: rule.conditions ?? [],
        target_type: rule.target_type,
        target_id: rule.target_id,
        weight: rule.weight,
      }
    : null;

  const pool = await fetchPool(supabase, ruleRecord ?? { strategy: "all", target_type: "all" } as any, organizationId, matchedTerritoryId);
  if (pool.length === 0) {
    if (matchedTerritoryId) {
      await dispatchWorkflowEvent("lead.assigned", lead as unknown as Record<string, unknown>, "Territory assigned — no owner in territory team");
    }
    return { assigned: false, territoryId: matchedTerritoryId };
  }

  let chosen: Candidate;
  let strategyLabel: string;
  switch (ruleRecord?.strategy ?? "round_robin") {
    case "least_loaded":
      chosen = await pickByLeastLoaded(supabase, organizationId, pool);
      strategyLabel = "Least Loaded";
      break;
    case "weighted":
      chosen = pickByWeighted(ruleRecord as RoutingRuleRecord, pool);
      strategyLabel = "Weighted";
      break;
    default:
      chosen = await pickByRoundRobin(supabase, organizationId, pool);
      strategyLabel = "Round Robin";
  }

  const previousOwner = lead.owner_id && lead.owner_id !== chosen.user_id ? lead.owner_id : null;
  const reason = rule
    ? `Rule "${rule.name}" (${strategyLabel})`
    : matchedTerritoryId
      ? `Territory "${territory?.name}" (${strategyLabel})`
      : `${strategyLabel}`;

  const { error } = await supabase
    .from("leads")
    .update({
      owner_id: chosen.user_id,
      previous_owner_id: previousOwner,
      assigned_at: new Date().toISOString(),
      assignment_reason: reason,
      routing_rule_id: rule?.id ?? null,
      territory_id: matchedTerritoryId,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", lead.id)
    .eq("organization_id", organizationId);

  if (error) return { assigned: false, territoryId: matchedTerritoryId };

  await supabase.from("activities").insert({
    organization_id: organizationId,
    activity_type: "owner_assigned",
    related_type: "lead",
    related_id: lead.id,
    lead_id: lead.id,
    actor_user_id: null,
    title: `Lead routed to ${chosen.name}`,
    description: reason,
    occurred_at: new Date().toISOString(),
  });

  await dispatchWorkflowEvent("lead.assigned", { ...lead, owner_id: chosen.user_id }, reason);

  return {
    assigned: true,
    ownerId: chosen.user_id,
    ownerName: chosen.name,
    reason,
    ruleId: rule?.id,
    ruleName: rule?.name,
    territoryId: matchedTerritoryId,
  };
}

/** Manual override — a user explicitly re-assigns a lead. */
export async function reassignLead(leadId: string, userId: string, reason: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lead } = await supabase
    .from("leads")
    .select("owner_id, source, country, city")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!lead) return false;

  const actor = user?.id ?? "unknown";
  const outcomeReason = reason || `Manual override by ${actor}`;

  const { error } = await supabase
    .from("leads")
    .update({
      owner_id: userId,
      previous_owner_id: lead.owner_id ?? null,
      assigned_at: new Date().toISOString(),
      assignment_reason: outcomeReason,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("organization_id", organizationId);
  if (error) return false;

  await supabase.from("activities").insert({
    organization_id: organizationId,
    activity_type: "owner_assigned",
    related_type: "lead",
    related_id: leadId,
    lead_id: leadId,
    actor_user_id: user?.id ?? null,
    title: "Lead reassigned manually",
    description: outcomeReason,
    occurred_at: new Date().toISOString(),
  });

  await dispatchWorkflowEvent("lead.assigned", { ...lead, id: leadId }, outcomeReason);
  return true;
}