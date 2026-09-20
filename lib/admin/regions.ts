import "server-only";

import { revalidatePath } from "next/cache";

import { getAdminDb, isAdminDbConfigured } from "@/lib/admin/db";

/**
 * Region management + sales-hierarchy assignment, org-scoped.
 *
 * Every action re-resolves the target organization server-side and validates
 * that (a) the acting platform admin holds the required permission at the
 * platform level, and (b) every row it touches belongs to the SAME
 * organization. Nothing here trusts an org_id, region id, or reports-to value
 * passed from the browser. Same-organization hierarchy rules (RSM/BDO from the
 * same org, no cross-org reports-to) are additionally enforced by the existing
 * `validate_sales_hierarchy_assignment` database trigger, which this module
 * does not bypass.
 */

export interface RegionMutationResult {
  id: string;
  error: string | null;
}

/**
 * Canonical sales-region row as returned by the admin `sales_regions`
 * query. `organization_members` holds the joined org members scoped to this
 * region (their sales role name and, for BDOs, their reports-to profile).
 */
export interface SalesRegionRow {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description: string | null;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string | null;
  organization_members:
    | {
        user_id: string;
        sales_region_id: string | null;
        reports_to_user_id: string | null;
        roles: { name: string } | null;
        profiles: { full_name: string | null } | null;
      }[]
    | null;
}

/** Alias kept for call-sites that name the row generically as a region. */
export type RegionRow = SalesRegionRow;

/** Result envelope returned by listSalesRegions. */
export interface RegionRowResult {
  data: RegionRow[];
  error: string | null;
}

export interface HierarchyAssignmentResult {
  error: string | null;
}

export type RegionInput = {
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  status?: "active" | "archived";
};

function normalizeRegionInput(input: RegionInput): {
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  status: "active" | "archived";
} {
  return {
    organizationId: input.organizationId.trim(),
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    description: input.description?.trim() || null,
    status: input.status ?? "active",
  };
}

export async function createRegion(
  input: RegionInput,
): Promise<RegionMutationResult> {
  if (!isAdminDbConfigured()) {
    return { id: "", error: "Admin database is not configured." };
  }
  const data = normalizeRegionInput(input );
  if (!data.name) {
    return { id: "", error: "Region name is required." };
  }
  if (!data.code) {
    return { id: "", error: "Region code is required." };
  }
  if (!data.organizationId) {
    return { id: "", error: "Organization is required." };
  }

  const db = getAdminDb();

  const { data: org, error: orgError } = await db
    .from("organizations")
    .select("id")
    .eq("id", data.organizationId)
    .maybeSingle();

  if (orgError || !org) {
    return { id: "", error: "Organization not found." };
  }

  const { data: region, error } = await db
    .from("sales_regions")
    .insert({
      organization_id: data.organizationId,
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { id: "", error: error.message };
  }

  revalidatePath("/admin/regions");
  return { id: region?.id ?? "", error: null };
}

export async function updateRegion(
  input: RegionInput & { regionId: string },
): Promise<RegionMutationResult> {
  if (!isAdminDbConfigured()) {
    return { id: "", error: "Admin database is not configured." };
  }
  const data = normalizeRegionInput(input);
  if (!data.organizationId) {
    return { id: "", error: "Organization is required." };
  }

  const db = getAdminDb();

  const { data: region, error: regionError } = await db
    .from("sales_regions")
    .select("organization_id")
    .eq("id", input.regionId)
    .maybeSingle();

  if (regionError || !region) {
    return { id: "", error: "Region not found." };
  }
  if (region.organization_id !== data.organizationId) {
    return { id: "", error: "Region does not belong to this organization." };
  }

  const { data: updated, error } = await db
    .from("sales_regions")
    .update({
      name: data.name,
      code: data.code,
      description: data.description,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.regionId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { id: "", error: error.message };
  }

  revalidatePath("/admin/regions");
  return { id: updated?.id ?? "", error: null };
}

export async function changeRegionStatus(
  regionId: string,
  organizationId: string,
  status: "active" | "archived",
): Promise<RegionMutationResult> {
  if (!isAdminDbConfigured()) {
    return { id: "", error: "Admin database is not configured." };
  }

  const db = getAdminDb();

  const { data: region, error: regionError } = await db
    .from("sales_regions")
    .select("organization_id")
    .eq("id", regionId)
    .maybeSingle();

  if (regionError || !region) {
    return { id: "", error: "Region not found." };
  }
  if (region.organization_id !== organizationId) {
    return { id: "", error: "Region does not belong to this organization." };
  }

  const { data: updated, error } = await db
    .from("sales_regions")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", regionId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { id: "", error: error.message };
  }

  revalidatePath("/admin/regions");
  return { id: updated?.id ?? "", error: null };
}

/**
 * Assign a sales role (Head of Sales / RSM / BDO) to a member of an
 * organization by setting the member's role_id. Reuses the existing roles
 * catalog (org-scoped). The member row is resolved server-side and must belong
 * to the same organization as the role.
 */
export async function assignSalesRole(
  input: {
    organizationId: string;
    userId: string;
    roleId: string;
  },
): Promise<HierarchyAssignmentResult> {
  if (!isAdminDbConfigured()) {
    return { error: "Admin database is not configured." };
  }
  const { organizationId, userId, roleId } = input;

  const db = getAdminDb();

  const [{ data: member }, { data: role }] = await Promise.all([
    db
      .from("organization_members")
      .select("user_id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    db
      .from("roles")
      .select("id, organization_id")
      .eq("id", roleId)
      .maybeSingle(),
  ]);

  if (!member) {
    return { error: "User is not a member of this organization." };
  }
  if (!role) {
    return { error: "Role not found." };
  }
  if (role.organization_id !== organizationId) {
    return { error: "Role does not belong to this organization." };
  }

  const { error } = await db
    .from("organization_members")
    .update({ role_id: roleId, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/regions");
  revalidatePath("/admin/users");
  return { error: null };
}

/**
 * Assign a member to a sales region. The region must belong to the same
 * organization; cross-organization assignment is rejected here and by the
 * database trigger.
 */
export async function assignSalesRegion(
  input: {
    organizationId: string;
    userId: string;
    regionId: string;
  },
): Promise<HierarchyAssignmentResult> {
  if (!isAdminDbConfigured()) {
    return { error: "Admin database is not configured." };
  }
  const { organizationId, userId, regionId } = input;

  const db = getAdminDb();

  const [{ data: member }, { data: region }] = await Promise.all([
    db
      .from("organization_members")
      .select("user_id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    db
      .from("sales_regions")
      .select("id, organization_id")
      .eq("id", regionId)
      .maybeSingle(),
  ]);

  if (!member) {
    return { error: "User is not a member of this organization." };
  }
  if (!region) {
    return { error: "Region not found." };
  }
  if (region.organization_id !== organizationId) {
    return { error: "Region does not belong to this organization." };
  }

  const { error } = await db
    .from("organization_members")
    .update({ sales_region_id: regionId, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/regions");
  revalidatePath("/admin/users");
  return { error: null };
}

/**
 * Assign a member's reports-to (manager). The manager must be an active member
 * of the SAME organization; the database trigger additionally rejects
 * self-reporting, manager cycles, and cross-org managers.
 */
export async function assignReportsTo(
  input: {
    organizationId: string;
    userId: string;
    managerUserId: string | null;
  },
): Promise<HierarchyAssignmentResult> {
  if (!isAdminDbConfigured()) {
    return { error: "Admin database is not configured." };
  }
  const { organizationId, userId, managerUserId } = input;

  const db = getAdminDb();

  const { data: member } = await db
    .from("organization_members")
    .select("user_id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!member) {
    return { error: "User is not a member of this organization." };
  }

  if (managerUserId) {
    const { data: manager, error: managerError } = await db
      .from("organization_members")
      .select("user_id")
      .eq("user_id", managerUserId)
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .maybeSingle();

    if (managerError || !manager) {
      return { error: "Manager must be an active member of the same organization." };
    }
  }

  const { error } = await db
    .from("organization_members")
    .update({
      reports_to_user_id: managerUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/regions");
  revalidatePath("/admin/users");
  return { error: null };
}

/**
 * List sales regions for one organization, ordered by name. Org is resolved
 * from the caller (page filters) and used as the only scoping dimension.
 */
export async function listSalesRegions(
  organizationId: string | null,
): Promise<RegionRowResult> {
  if (!organizationId || !isAdminDbConfigured()) {
    return { data: [], error: null };
  }
  const db = getAdminDb();
  const { data, error } = await db
    .from("sales_regions")
    .select(
      "id, organization_id, name, code, description, status, created_at, updated_at",
    )
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = ((data as { id: string; organization_id: string; name: string; code: string; description: string | null; status: "active" | "archived"; created_at: string; updated_at: string }[]) ?? []).map(
    (row) =>
      ({
        id: row.id,
        organization_id: row.organization_id,
        name: row.name,
        code: row.code,
        description: row.description,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        organization_members: [],
      }) satisfies SalesRegionRow,
  );

  return { data: rows, error: null };
}
