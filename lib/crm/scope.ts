import "server-only";

import { cache } from "react";

import { getActiveOrgId, type DbClient } from "@/lib/crm/base";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Canonical server-side sales access scope (Phase 2).
 *
 * Resolves the currently signed-in user's role-based data visibility for the
 * active organization:
 *
 *  - Admin / Head of Sales  → org-wide (null visible owner set)
 *  - RSM                    → own + team members in the same sales region
 *  - BDO / other sellers    → own records only (no access to another seller's)
 *
 * Every server-side query, mutation, dashboard aggregate, export and AI
 * insight must be filtered through `applyOwnerScope` / `canAccessRecord`.
 * This is the primary enforcement layer; the Phase-2 RLS migration adds the
 * same rule at the database tier (defense in depth).
 *
 * Nothing here is trusted from browser/client input — role, region and owner
 * sets are resolved from the authenticated membership row on the server.
 */

export type SalesScopeRole = "admin" | "head_of_sales" | "rsm" | "bdo" | "other";

export interface SalesAccessScope {
  organizationId: string;
  userId: string;
  role: SalesScopeRole;
  salesRegionId: string | null;
  /**
   * Owner ids visible to this user. `null` means org-wide visibility
   * (Admin / Head of Sales). For RSM this includes the regional team;
   * for BDO/other sellers it is exactly the caller's own id.
   */
  visibleOwnerIds: Set<string> | null;
}

/** Minimal shape of a row that carries ownership information. */
export interface OwnerScopedRow {
  owner_id?: string | null;
  created_by?: string | null;
}

interface MemberRow {
  user_id: string;
  sales_region_id: string | null;
  reports_to_user_id: string | null;
  role_name: string | null;
}

function normalizeRoleName(name: string | null | undefined): SalesScopeRole {
  const value = (name ?? "").trim().toLowerCase();
  if (!value) return "other";
  if (value === "admin" || value === "owner") return "admin";
  if (value.includes("head of sales")) return "head_of_sales";
  if (value.includes("rsm") || value.includes("regional sales")) return "rsm";
  if (value.includes("bdo") || value.includes("business development")) return "bdo";
  return "other";
}

/** True for roles permitted to see every sales record in the organization. */
export function isOrgWideRole(role: SalesScopeRole): boolean {
  return role === "admin" || role === "head_of_sales";
}

async function fetchMemberRows(
  supabase: DbClient,
  organizationId: string,
): Promise<MemberRow[]> {
  const { data } = await supabase
    .from("organization_members")
    .select("user_id, sales_region_id, reports_to_user_id, roles(name)")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  return (data ?? []).map((row) => {
    const role = Array.isArray(row.roles) ? null : (row.roles as { name?: string | null } | null);
    return {
      user_id: row.user_id as string,
      sales_region_id: (row.sales_region_id as string | null) ?? null,
      reports_to_user_id: (row.reports_to_user_id as string | null) ?? null,
      role_name: role?.name ?? null,
    };
  });
}

async function resolveMembership(
  supabase: DbClient,
  organizationId: string,
  userId: string,
): Promise<MemberRow | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("user_id, sales_region_id, reports_to_user_id, roles(name)")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;
  const role = Array.isArray(data.roles) ? null : (data.roles as { name?: string | null } | null);
  return {
    user_id: data.user_id as string,
    sales_region_id: (data.sales_region_id as string | null) ?? null,
    reports_to_user_id: (data.reports_to_user_id as string | null) ?? null,
    role_name: role?.name ?? null,
  };
}

/**
 * Builds the visible-owner set for an RSM: the RSM itself plus every active
 * member whose sales region matches the RSM's region or who reports to the RSM.
 */
function buildRegionTeam(members: MemberRow[], self: MemberRow): Set<string> {
  const set = new Set<string>();
  set.add(self.user_id);
  for (const member of members) {
    if (member.user_id === self.user_id) continue;
    if (self.sales_region_id && member.sales_region_id === self.sales_region_id) {
      set.add(member.user_id);
    } else if (member.reports_to_user_id === self.user_id) {
      set.add(member.user_id);
    }
  }
  return set;
}

/**
 * Resolve the current user's sales data scope for their active organization.
 *
 * Resolved entirely server-side from the authenticated membership + sales
 * hierarchy. Role, region and resulting owner set never come from the browser.
 */
export const getSalesAccessScope = cache(
  async (): Promise<SalesAccessScope | null> => {
    if (!isSupabaseConfigured()) return null;
    const supabase = await createSupabaseServerClient();
    const organizationId = await getActiveOrgId(supabase);
    if (!organizationId) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const members = await fetchMemberRows(supabase, organizationId);
    const self =
      members.find((m) => m.user_id === user.id) ??
      (await resolveMembership(supabase, organizationId, user.id));

    const role = normalizeRoleName(self?.role_name);

    let visibleOwnerIds: Set<string> | null = null;
    if (!isOrgWideRole(role)) {
      visibleOwnerIds =
        role === "rsm" && self ? buildRegionTeam(members, self) : new Set([user.id]);
    }

    return {
      organizationId,
      userId: user.id,
      role,
      salesRegionId: self?.sales_region_id ?? null,
      visibleOwnerIds,
    };
  },
);

/**
 * Applies the owner-scope filter to a list/aggregate query. When the scope is
 * org-wide (visibleOwnerIds === null) the query is returned untouched — role
 * isolation is then handled by the existing organization_id boundary.
 */
export function applyOwnerScope<T>(
  query: T,
  scope: SalesAccessScope | null | undefined,
  ownerColumn = "owner_id",
): T {
  if (!scope || !scope.visibleOwnerIds || scope.visibleOwnerIds.size === 0) return query;
  const withIn = query as { in: (...args: any[]) => T };
  return withIn.in(ownerColumn, [...scope.visibleOwnerIds]);
}

/**
 * Predicate: may this user read / operate on a record with the given owner?
 *
 * Ownership is `owner_id` first (the authority), then `created_by` as a
 * compatibility fallback so a record the user created (even if it was never
 * assigned) stays inside their scope.
 */
export function canAccessRecord(
  scope: SalesAccessScope | null | undefined,
  record: OwnerScopedRow | null | undefined,
): boolean {
  if (!record) return false;
  if (!scope) return false;
  if (isOrgWideRole(scope.role)) return true;
  const ownerId = record.owner_id ?? record.created_by ?? null;
  if (ownerId && scope.visibleOwnerIds?.has(ownerId)) return true;
  // A record the user created (even if unassigned) belongs to their scope.
  return Boolean(record.created_by && record.created_by === scope.userId);
}

export interface SalesRecordAccess {
  ok: boolean;
  record?: OwnerScopedRow;
}

/** Convenience: scope guard used by lead mutations. */
export async function assertLeadAccess(
  supabase: DbClient,
  scope: SalesAccessScope | null,
  leadId: string,
  organizationId: string,
): Promise<SalesRecordAccess> {
  if (!scope) return { ok: false };
  const { data } = await supabase
    .from("leads")
    .select("owner_id, created_by")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return { ok: false };
  const record: OwnerScopedRow = {
    owner_id: data.owner_id ?? null,
    created_by: data.created_by ?? null,
  };
  return { ok: canAccessRecord(scope, record), record };
}

/** Convenience: scope guard used by opportunity/deal mutations. */
export async function assertDealAccess(
  supabase: DbClient,
  scope: SalesAccessScope | null,
  dealId: string,
  organizationId: string,
): Promise<SalesRecordAccess> {
  if (!scope) return { ok: false };
  const { data } = await supabase
    .from("deals")
    .select("owner_id, created_by")
    .eq("id", dealId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return { ok: false };
  const record: OwnerScopedRow = {
    owner_id: data.owner_id ?? null,
    created_by: data.created_by ?? null,
  };
  return { ok: canAccessRecord(scope, record), record };
}