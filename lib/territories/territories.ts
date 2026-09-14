import "server-only";

import { can } from "@/lib/crm/context";
import { getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * STEP 122 — Territory management.
 * Territories group leads by country / region / city / industry /
 * company size / lead source / account type and map them to a pool of
 * sales users. Used for automatic lead/account assignment.
 */

export interface TerritoryRule {
  id: string;
  field: "country" | "region" | "city" | "industry" | "company_size" | "source" | "account_type" | "score";
  operator: "=" | "!=" | "in" | "not in" | ">" | "<" | ">=" | "<=";
  value: string;
}

export interface TerritoryMember {
  id: string;
  user_id: string;
  is_lead: boolean;
  full_name: string | null;
}

export interface TerritoryRecord {
  id: string;
  name: string;
  description: string | null;
  countries: string[];
  regions: string[];
  cities: string[];
  industries: string[];
  lead_sources: string[];
  account_types: string[];
  company_size_min: number | null;
  company_size_max: number | null;
priority: number,
  is_active: boolean;
  members: TerritoryMember[];
  rules: TerritoryRule[];
}

interface TerritoryMemberRow {
  id: string;
  territory_id: string;
  user_id: string;
  is_lead: boolean;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
}

interface TerritoryRuleRow {
  id: string;
  territory_id: string;
  field: string;
  operator: string;
  value: unknown;
}

interface TerritoryTableRow {
  id: string;
  name: string;
  description: string | null;
  countries: string[];
  regions: string[];
  cities: string[];
  industries: string[];
  lead_sources: string[];
  account_types: string[];
  company_size_min: number | null;
  company_size_max: number | null;
priority: number;
  is_active: boolean;
}
export interface TerritoryLike {
  country?: string | null;
  city?: string | null;
  source?: string | null;
  industry?: string | null;
  company_size?: string | null;
  account_type?: string | null;
  score?: number | null;
}

export async function getTerritories(): Promise<TerritoryRecord[] | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const [territories, members, rules] = await Promise.all([
    supabase
      .from("territories")
      .select(
        "id, name, description, countries, regions, cities, industries, lead_sources, account_types, company_size_min, company_size_max, priority, is_active",
      )
      .eq("organization_id", organizationId)
      .order("priority", { ascending: false }),
    supabase
      .from("territory_members")
      .select("id, territory_id, user_id, is_lead, profiles(full_name)")
      .eq("organization_id", organizationId),
    supabase.from("territory_rules").select("id, territory_id, field, operator, value").eq("organization_id", organizationId),
  ]);

  const memberRows = (members.data ?? []) as TerritoryMemberRow[];
  const ruleRows = (rules.data ?? []) as TerritoryRuleRow[];
  const territoryRows = (territories.data ?? []) as TerritoryTableRow[];

  const memberMap = new Map<string, TerritoryMember[]>();
  for (const row of memberRows) {
    const p = Array.isArray(row.profiles) ? null : (row.profiles as { full_name: string | null } | null);
    const key = row.territory_id;
    const entries = memberMap.get(key) ?? [];
    entries.push({
      id: row.id,
      user_id: row.user_id,
      is_lead: row.is_lead,
      full_name: p?.full_name ?? null,
    });
    memberMap.set(key, entries);
  }

  const ruleMap = new Map<string, TerritoryRule[]>();
  for (const row of ruleRows) {
    const r: TerritoryRule = {
      id: row.id,
      field: row.field as TerritoryRule["field"],
      operator: row.operator as TerritoryRule["operator"],
      value: arrayFromJson(row.value).join(","),
    };
    const entries = ruleMap.get(row.territory_id) ?? [];
    entries.push(r);
    ruleMap.set(row.territory_id, entries);
  }

  return territoryRows.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    countries: t.countries ?? [],
    regions: t.regions ?? [],
    cities: t.cities ?? [],
    industries: t.industries ?? [],
    lead_sources: t.lead_sources ?? [],
    account_types: t.account_types ?? [],
    company_size_min: t.company_size_min,
    company_size_max: t.company_size_max,
    priority: t.priority,
    is_active: t.is_active,
    members: memberMap.get(t.id) ?? [],
    rules: ruleMap.get(t.id) ?? [],
  })) as TerritoryRecord[];
}

function arrayFromJson(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "object" && value !== null) {
    const v = value as { items?: unknown; value?: unknown };
    if (Array.isArray(v.items)) return v.items.map((i) => String(i));
    if (v.value !== undefined) return [String(v.value)];
  }
  return [];
}

async function requireTerritoryManage(): Promise<{ supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; organizationId: string }> {
  if (!(await can("territory.manage"))) {
    throw new Error("You do not have permission to manage territories");
  }
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) throw new Error("No active workspace");
  return { supabase, organizationId };
}

export interface CreateTerritoryInput {
  name: string;
  description?: string;
  countries?: string[];
  regions?: string[];
  cities?: string[];
  industries?: string[];
  leadSources?: string[];
  accountTypes?: string[];
  companySizeMin?: number;
  companySizeMax?: number;
  priority?: number;
  isActive?: boolean;
  memberUserIds?: string[];
}

export async function createTerritory(input: CreateTerritoryInput): Promise<boolean> {
  const { supabase, organizationId } = await requireTerritoryManage();

  const { data, error } = await supabase
    .from("territories")
    .insert({
      organization_id: organizationId,
      name: input.name,
      description: input.description || null,
      countries: input.countries ?? [],
      regions: input.regions ?? [],
      cities: input.cities ?? [],
      industries: input.industries ?? [],
      lead_sources: input.leadSources ?? [],
      account_types: input.accountTypes ?? [],
      company_size_min: input.companySizeMin ?? null,
      company_size_max: input.companySizeMax ?? null,
      priority: input.priority ?? 0,
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return false;

  if (input.memberUserIds?.length) {
    await supabase.from("territory_members").insert(
      input.memberUserIds.map((uid) => ({
        organization_id: organizationId,
        territory_id: data.id,
        user_id: uid,
      })),
    );
  }
  return true;
}

export async function updateTerritory(id: string, input: Partial<CreateTerritoryInput>): Promise<boolean> {
  const { supabase, organizationId } = await requireTerritoryManage();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.countries !== undefined) patch.countries = input.countries;
  if (input.regions !== undefined) patch.regions = input.regions;
  if (input.cities !== undefined) patch.cities = input.cities;
  if (input.industries !== undefined) patch.industries = input.industries;
  if (input.leadSources !== undefined) patch.lead_sources = input.leadSources;
  if (input.accountTypes !== undefined) patch.account_types = input.accountTypes;
  if (input.companySizeMin !== undefined) patch.company_size_min = input.companySizeMin ?? null;
  if (input.companySizeMax !== undefined) patch.company_size_max = input.companySizeMax ?? null;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const { error } = await supabase
    .from("territories")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", organizationId);
  return !error;
}

export async function deleteTerritory(id: string): Promise<boolean> {
  const { supabase, organizationId } = await requireTerritoryManage();
  const { error } = await supabase.from("territories").delete().eq("id", id).eq("organization_id", organizationId);
  return !error;
}

export async function addTerritoryMember(territoryId: string, userId: string, isLead = false): Promise<boolean> {
  const { supabase, organizationId } = await requireTerritoryManage();
  const { error } = await supabase
    .from("territory_members")
    .insert({ organization_id: organizationId, territory_id: territoryId, user_id: userId, is_lead: isLead });
  return !error;
}

export async function removeTerritoryMember(membershipId: string): Promise<boolean> {
  const { supabase, organizationId } = await requireTerritoryManage();
  const { error } = await supabase.from("territory_members").delete().eq("id", membershipId).eq("organization_id", organizationId);
  return !error;
}

// ------------------------------------------------------------------
// Matching (used by routing for automatic assignment)
// ------------------------------------------------------------------

/** Crude "region" derivation from a country name (used by rules). */
function leadRegion(lead: TerritoryLike): string | null {
  return lead.country?.trim() ?? null;
}

function fieldValue(lead: TerritoryLike, field: TerritoryRule["field"]): string | number | null {
  switch (field) {
    case "country":
      return lead.country?.trim().toLowerCase() ?? "";
    case "region":
      return leadRegion(lead)?.toLowerCase() ?? "";
    case "city":
      return lead.city?.trim().toLowerCase() ?? "";
    case "industry":
      return lead.industry?.trim().toLowerCase() ?? "";
    case "source":
      return lead.source?.trim().toLowerCase() ?? "";
    case "company_size":
      return lead.company_size ?? "";
    case "account_type":
      return lead.account_type?.trim().toLowerCase() ?? "";
    case "score":
      return lead.score ?? 0;
  }
}

function evaluateRule(lead: TerritoryLike, rule: TerritoryRule): boolean {
  const actual = fieldValue(lead, rule.field);
  const expected = rule.value.trim().toLowerCase();

  if (rule.operator === "=") return String(actual).toLowerCase() === expected;
  if (rule.operator === "!=") return String(actual).toLowerCase() !== expected;

  if (rule.operator === "in" || rule.operator === "not in") {
    const items = expected
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const hit = items.includes(String(actual).toLowerCase());
    return rule.operator === "in" ? hit : !hit;
  }

  // numeric comparisons
  const actualNum = Number(actual);
  const expectedNum = Number(expected);
  if (Number.isNaN(actualNum) || Number.isNaN(expectedNum)) return false;
  switch (rule.operator) {
    case ">":
      return actualNum > expectedNum;
    case "<":
      return actualNum < expectedNum;
    case ">=":
      return actualNum >= expectedNum;
    case "<=":
      return actualNum <= expectedNum;
  }
  return false;
}

function matchesList(actual: string | null | undefined, list: string[]): boolean {
  if (!list.length) return true;
  const value = actual?.trim().toLowerCase();
  if (!value) return false;
  return list.some((item) => item.trim().toLowerCase() === value);
}

function matchesSizeRange(lead: TerritoryLike, territory: {
  company_size_min: number | null;
  company_size_max: number | null;
}): boolean {
  const size = Number(lead.company_size);
  if (!lead.company_size || Number.isNaN(size)) return true;
  if (territory.company_size_min != null && size < territory.company_size_min) return false;
  if (territory.company_size_max != null && size > territory.company_size_max) return false;
  return true;
}

/** Best active territory for a lead, or null when none matches. */
export async function matchTerritoryForLead(lead: TerritoryLike): Promise<TerritoryRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const { data: territories } = await supabase
    .from("territories")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  const { data: ruleRows } = await supabase
    .from("territory_rules")
    .select("id, territory_id, field, operator, value")
    .eq("organization_id", organizationId);

  const ruleRowsData = (ruleRows ?? []) as TerritoryRuleRow[];
  const territoryRowsData = (territories ?? []) as TerritoryTableRow[];

  const rulesByTerritory = new Map<string, TerritoryRule[]>();
  for (const row of ruleRowsData) {
    const r: TerritoryRule = { id: row.id, field: row.field as TerritoryRule["field"], operator: row.operator as TerritoryRule["operator"], value: arrayFromJson(row.value).join(",") };
    const list = rulesByTerritory.get(row.territory_id) ?? [];
    list.push(r);
    rulesByTerritory.set(row.territory_id, list);
  }

  for (const t of territoryRowsData) {
    if (!matchesList(lead.country, t.countries ?? [])) continue;
    if (!matchesList(lead.city, t.cities ?? [])) continue;
    if (!matchesList(lead.industry, t.industries ?? [])) continue;
    if (!matchesList(lead.source, t.lead_sources ?? [])) continue;
    if (!matchesList(lead.account_type, t.account_types ?? [])) continue;
    if (!matchesSizeRange(lead, { company_size_min: t.company_size_min, company_size_max: t.company_size_max })) continue;

    const rules = rulesByTerritory.get(t.id) ?? [];
    if (!rules.every((rule) => evaluateRule(lead, rule))) continue;

    return {
      id: t.id,
      name: t.name,
      description: null,
      countries: [],
      regions: [],
      cities: [],
      industries: [],
      lead_sources: [],
      account_types: [],
      company_size_min: null,
      company_size_max: null,
      priority: t.priority,
      is_active: true,
      members: [],
      rules: [],
    } satisfies TerritoryRecord;
  }

  return null;
}