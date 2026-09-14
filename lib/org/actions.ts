"use server";

import {
  addOrganizationToGroup,
  createBusinessUnit,
  createDepartment,
  createOrgGroup,
  createRegion,
  createTeam,
  setMemberDepartment,
  type CreateDepartmentInput,
  type CreateTeamInput,
} from "@/lib/org/hierarchy";

export async function createOrgGroupAction(name: string, description?: string): Promise<{ ok: boolean }> {
  return { ok: await createOrgGroup(name, description) };
}

export async function addOrganizationToGroupAction(groupId: string, organizationId: string): Promise<{ ok: boolean }> {
  return { ok: await addOrganizationToGroup(groupId, organizationId) };
}

export async function createBusinessUnitAction(name: string, description?: string, headUserId?: string): Promise<{ ok: boolean }> {
  return { ok: await createBusinessUnit(name, description, headUserId) };
}

export async function createRegionAction(name: string, code?: string, parentRegionId?: string): Promise<{ ok: boolean }> {
  return { ok: await createRegion(name, code, parentRegionId) };
}

export async function createDepartmentAction(input: CreateDepartmentInput): Promise<{ ok: boolean }> {
  return { ok: await createDepartment(input) };
}

export async function createTeamAction(input: CreateTeamInput): Promise<{ ok: boolean }> {
  return { ok: await createTeam(input) };
}

export async function setMemberDepartmentAction(membershipId: string, departmentId: string | null): Promise<{ ok: boolean }> {
  return { ok: await setMemberDepartment(membershipId, departmentId) };
}