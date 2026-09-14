"use server";

import {
  addTerritoryMember,
  createTerritory,
  deleteTerritory,
  removeTerritoryMember,
  updateTerritory,
  type CreateTerritoryInput,
} from "@/lib/territories/territories";

export async function createTerritoryAction(input: CreateTerritoryInput): Promise<{ ok: boolean }> {
  return { ok: await createTerritory(input) };
}

export async function updateTerritoryAction(id: string, input: Partial<CreateTerritoryInput>): Promise<{ ok: boolean }> {
  return { ok: await updateTerritory(id, input) };
}

export async function deleteTerritoryAction(id: string): Promise<{ ok: boolean }> {
  return { ok: await deleteTerritory(id) };
}

export async function addTerritoryMemberAction(territoryId: string, userId: string): Promise<{ ok: boolean }> {
  return { ok: await addTerritoryMember(territoryId, userId) };
}

export async function removeTerritoryMemberAction(membershipId: string): Promise<{ ok: boolean }> {
  return { ok: await removeTerritoryMember(membershipId) };
}