"use server";

import { revalidatePath } from "next/cache";

import { createDeal, deleteDeal, updateDeal } from "@/lib/crm/deals";
import type { DealRecord } from "@/lib/types";

export interface DealActionResult {
  deal: DealRecord | null;
  error: string | null;
}

export async function createDealAction(input: {
  name: string;
  value: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  stageId?: string;
  ownerId?: string;
  source?: string;
  description?: string;
}): Promise<DealActionResult> {
  if (!input.name.trim()) {
    return { deal: null, error: "Deal name is required" };
  }
  const deal = await createDeal({
    name: input.name.trim(),
    value: input.value,
    currency: input.currency,
    probability: input.probability,
    expectedCloseDate: input.expectedCloseDate,
    stageId: input.stageId,
    ownerId: input.ownerId,
    source: input.source,
    description: input.description,
  });
  if (!deal) {
    return { deal: null, error: "Failed to create deal" };
  }
  revalidatePath("/deals");
  return { deal, error: null };
}

export async function updateDealAction(input: {
  id: string;
  name?: string;
  value?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  stageId?: string;
  ownerId?: string;
  source?: string;
  description?: string;
}): Promise<DealActionResult> {
  const deal = await updateDeal(input);
  if (!deal) {
    return { deal: null, error: "Failed to update deal" };
  }
  revalidatePath("/deals");
  revalidatePath(`/deals/${input.id}`);
  return { deal, error: null };
}

export async function deleteDealAction(id: string): Promise<{ ok: boolean; error: string | null }> {
  const ok = await deleteDeal(id);
  if (!ok) {
    return { ok: false, error: "Failed to delete deal" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return { ok: true, error: null };
}