"use server";

import { revalidatePath } from "next/cache";

import { createLead, updateLead } from "@/lib/crm/leads";
import { parseTags } from "@/lib/lead-form";
import type { LeadRecord } from "@/lib/types";

export interface LeadActionResult {
  lead: LeadRecord | null;
  error: string | null;
}

export interface LeadActionInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  companyName?: string;
  jobTitle?: string;
  country?: string;
  city?: string;
  source?: string;
  status?: string;
  expectedValue?: string;
  interest?: string;
  tags?: string;
  notes?: string;
  ownerId?: string;
}

export async function createLeadAction(input: LeadActionInput): Promise<LeadActionResult> {
  if (!input.firstName.trim() && !input.lastName.trim()) {
    return { lead: null, error: "Lead name is required" };
  }
  const lead = await createLead({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    phone: input.phone || undefined,
    whatsapp: input.whatsapp || undefined,
    companyName: input.companyName?.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    source: input.source || "Website",
    status: input.status || "New",
    expectedValue: input.expectedValue ? Number(input.expectedValue) : undefined,
    interest: input.interest?.trim() || undefined,
    tags: input.tags ? parseTags(input.tags) : [],
    description: input.notes?.trim() || undefined,
    ownerId: input.ownerId || undefined,
  });
  if (!lead) {
    return { lead: null, error: "Failed to create lead" };
  }
  revalidatePath("/leads");
  return { lead, error: null };
}

export async function updateLeadAction(input: LeadActionInput & { id: string }): Promise<LeadActionResult> {
  const lead = await updateLead({
    id: input.id,
    firstName: input.firstName.trim() || undefined,
    lastName: input.lastName.trim() || undefined,
    email: input.email.trim() || undefined,
    phone: input.phone || undefined,
    whatsapp: input.whatsapp || undefined,
    companyName: input.companyName?.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    source: input.source || undefined,
    status: input.status || undefined,
    expectedValue: input.expectedValue ? Number(input.expectedValue) : undefined,
    interest: input.interest?.trim() || undefined,
    tags: input.tags ? parseTags(input.tags) : undefined,
    description: input.notes?.trim() || undefined,
    ownerId: input.ownerId || undefined,
  });
  if (!lead) {
    return { lead: null, error: "Failed to update lead" };
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${input.id}`);
  return { lead, error: null };
}