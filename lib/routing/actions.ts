"use server";

import {
  createRoutingRule,
  deleteRoutingRule,
  reassignLead,
  toggleRoutingRule,
  updateRoutingRule,
  type CreateRoutingRuleInput,
} from "@/lib/routing/routing";

export async function createRoutingRuleAction(input: CreateRoutingRuleInput): Promise<{ ok: boolean }> {
  return { ok: await createRoutingRule(input) };
}

export async function updateRoutingRuleAction(id: string, input: Partial<CreateRoutingRuleInput>): Promise<{ ok: boolean }> {
  return { ok: await updateRoutingRule(id, input) };
}

export async function deleteRoutingRuleAction(id: string): Promise<{ ok: boolean }> {
  return { ok: await deleteRoutingRule(id) };
}

export async function toggleRoutingRuleAction(id: string, isActive: boolean): Promise<{ ok: boolean }> {
  return { ok: await toggleRoutingRule(id, isActive) };
}

export async function reassignLeadAction(leadId: string, userId: string, reason: string): Promise<{ ok: boolean }> {
  return { ok: await reassignLead(leadId, userId, reason) };
}