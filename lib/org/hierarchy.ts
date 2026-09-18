import "server-only";

import { can } from "@/lib/crm/context";
import { getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * STEP 121 — Enterprise organization hierarchy.
 * Organization -> Region -> Department -> Team -> User, plus
 * organization groups and business units. Every entity is nullable /
 * optional so small organizations keep working unchanged.
 */

export interface OrgGroupRecord {
  id: string;
  name: string;
  description: string | null;
}

interface MemberRow {
  id: string;
  user_id: string;
  full_name: string | null;
  team_id: string | null;
  department_id: string | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
}

interface GroupMemberRow {
  id: string;
  group_id: string;
  member_organization_id: string;
}

export interface BusinessUnitRecord {
  id: string;
  name: string;
  description: string | null;
  head_user_id: string | null;
}
export interface RegionRecord {
  id: string;
  name: string;
  code: string | null;
  parent_region_id: string | null;
}
export interface DepartmentRecord {
  id: string;
  name: string;
  code: string | null;
  business_unit_id: string | null;
  region_id: string | null;
  manager_user_id: string | null;
}
export interface TeamRecord {
  id: string;
  name: string;
  description: string | null;
  manager_user_id: string | null;
  parent_team_id: string | null;
  department_id: string | null;
  business_unit_id: string | null;
  region_id: string | null;
}

export interface OrgHierarchySnapshot {
  groups: OrgGroupRecord[];
  groupMembers: { id: string; group_id: string; member_organization_id: string }[];
  businessUnits: BusinessUnitRecord[];
  regions: RegionRecord[];
  departments: DepartmentRecord[];
  teams: TeamRecord[];
  members: { id: string; user_id: string; full_name: string | null; team_id: string | null; department_id: string | null }[];
  canManage: boolean;
}

/** Full hierarchy snapshot for the active organization (admin UI). */
export async function getOrgHierarchy(): Promise<OrgHierarchySnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const canManage = (await can("org.hierarchy.manage")) || (await can("users.manage"));

  const [groups, groupMembers, businessUnits, regions, departments, teams, members] =
    await Promise.all([
      supabase.from("org_groups").select("id, name, description").eq("organization_id", organizationId).order("name"),
      supabase
        .from("org_group_members")
        .select("id, group_id, member_organization_id")
        .eq("organization_id", organizationId),
      supabase.from("business_units").select("*").eq("organization_id", organizationId).order("name"),
      supabase.from("regions").select("*").eq("organization_id", organizationId).order("name"),
      supabase.from("departments").select("*").eq("organization_id", organizationId).order("name"),
      supabase
        .from("teams")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name"),
      supabase
        .from("organization_members")
        .select("id, user_id, full_name, team_id, department_id, profiles(full_name)")
        .eq("organization_id", organizationId)
        .eq("status", "active"),
    ]);

  const map = <T>(res: { data: T[] | null }): T[] => res.data ?? [];

  return {
    groups: map(groups),
    groupMembers: map<GroupMemberRow>(groupMembers),
    businessUnits: map(businessUnits),
    regions: map(regions),
    departments: map(departments),
    teams: map(teams),
    members: map<MemberRow>(members).map((m) => {
      const p = Array.isArray(m.profiles) ? null : (m.profiles as { full_name: string | null } | null);
      return {
        id: m.id,
        user_id: m.user_id,
        full_name: p?.full_name ?? m.full_name ?? m.user_id,
        team_id: m.team_id ?? null,
        department_id: m.department_id ?? null,
      };
    }),
    canManage,
  };
}

async function requireHierarchyManage(): Promise<{ supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; organizationId: string }> {
  if (!(await can("org.hierarchy.manage")) && !(await can("users.manage"))) {
    throw new Error("You do not have permission to manage the organization hierarchy");
  }
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) throw new Error("No active workspace");
  return { supabase, organizationId };
}

export async function createOrgGroup(name: string, description?: string): Promise<boolean> {
  const { supabase, organizationId } = await requireHierarchyManage();
  const { error } = await supabase
    .from("org_groups")
    .insert({ organization_id: organizationId, name, description: description || null });
  return !error;
}

export async function addOrganizationToGroup(groupId: string, memberOrganizationId: string): Promise<boolean> {
  const { supabase, organizationId } = await requireHierarchyManage();
  const org = await supabase
    .from("organizations")
    .select("id")
    .eq("id", memberOrganizationId)
    .eq("id", memberOrganizationId)
    .maybeSingle();
  if (!org.data) return false;
  const { error } = await supabase
    .from("org_group_members")
    .insert({ organization_id: organizationId, group_id: groupId, member_organization_id: memberOrganizationId });
  return !error;
}

export async function createBusinessUnit(name: string, description?: string, headUserId?: string): Promise<boolean> {
  const { supabase, organizationId } = await requireHierarchyManage();
  const { error } = await supabase
    .from("business_units")
    .insert({ organization_id: organizationId, name, description: description || null, head_user_id: headUserId || null });
  return !error;
}

export async function createRegion(name: string, code?: string, parentRegionId?: string): Promise<boolean> {
  const { supabase, organizationId } = await requireHierarchyManage();
  const { error } = await supabase
    .from("regions")
    .insert({ organization_id: organizationId, name, code: code || null, parent_region_id: parentRegionId || null });
  return !error;
}

export interface CreateDepartmentInput {
  name: string;
  code?: string;
  businessUnitId?: string;
  regionId?: string;
  managerUserId?: string;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<boolean> {
  const { supabase, organizationId } = await requireHierarchyManage();
  const { error } = await supabase.from("departments").insert({
    organization_id: organizationId,
    name: input.name,
    code: input.code || null,
    business_unit_id: input.businessUnitId || null,
    region_id: input.regionId || null,
    manager_user_id: input.managerUserId || null,
  });
  return !error;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  parentTeamId?: string;
  departmentId?: string;
  businessUnitId?: string;
  regionId?: string;
}

export async function createTeam(input: CreateTeamInput): Promise<boolean> {
  const { supabase, organizationId } = await requireHierarchyManage();
  const { error } = await supabase.from("teams").insert({
    organization_id: organizationId,
    name: input.name,
    description: input.description || null,
    parent_team_id: input.parentTeamId || null,
    department_id: input.departmentId || null,
    business_unit_id: input.businessUnitId || null,
    region_id: input.regionId || null,
  });
  return !error;
}

export async function updateTeamHierarchy(
  teamId: string,
  patch: { parentTeamId?: string; departmentId?: string; businessUnitId?: string; regionId?: string },
): Promise<boolean> {
  const { supabase } = await requireHierarchyManage();
  const { error } = await supabase
    .from("teams")
    .update({
      parent_team_id: patch.parentTeamId || null,
      department_id: patch.departmentId || null,
      business_unit_id: patch.businessUnitId || null,
      region_id: patch.regionId || null,
    })
    .eq("id", teamId);
  return !error;
}

export async function setMemberDepartment(membershipId: string, departmentId: string | null): Promise<boolean> {
  const { supabase } = await requireHierarchyManage();
  const { error } = await supabase
    .from("organization_members")
    .update({ department_id: departmentId })
    .eq("id", membershipId);
  return !error;
}

/** Resolve the department a user belongs to in this org (via membership). */
export async function getDepartmentOfUser(userId: string): Promise<DepartmentRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;
  const { data } = await supabase
    .from("organization_members")
    .select("department:departments(*)")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const dept = (data as { department?: { id: string; name: string; code: string | null; business_unit_id: string | null; region_id: string | null; manager_user_id: string | null } | null } | null)?.department;
  return dept ?? null;
}