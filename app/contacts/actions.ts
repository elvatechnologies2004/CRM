"use server";

import { revalidatePath } from "next/cache";

import { createContact, updateContact } from "@/lib/crm/contacts";
import { parseTags } from "@/lib/lead-form";
import type { ContactRecord } from "@/lib/types";

export interface ContactActionResult {
  contact: ContactRecord | null;
  error: string | null;
}

export interface ContactActionInput {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  companyId?: string;
  lifecycleStage?: string;
  ownerId?: string;
  source?: string;
  country?: string;
  city?: string;
  address?: string;
  preferredChannel?: string;
  tags?: string;
}

export async function createContactAction(input: ContactActionInput): Promise<ContactActionResult> {
  if (!input.firstName.trim() && !input.lastName.trim()) {
    return { contact: null, error: "Contact name is required" };
  }
  const contact = await createContact({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    jobTitle: input.jobTitle?.trim() || undefined,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    whatsapp: input.whatsapp?.trim() || undefined,
    companyId: input.companyId || undefined,
    lifecycleStage: input.lifecycleStage || "Lead",
    ownerId: input.ownerId || undefined,
    source: input.source || "Manual",
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    address: input.address?.trim() || undefined,
    preferredChannel: input.preferredChannel || "Email",
    tags: input.tags ? parseTags(input.tags) : [],
  });
  if (!contact) {
    return { contact: null, error: "Failed to create contact" };
  }
  revalidatePath("/contacts");
  return { contact, error: null };
}

export async function updateContactAction(input: ContactActionInput & { id: string }): Promise<ContactActionResult> {
  const contact = await updateContact({
    id: input.id,
    firstName: input.firstName.trim() || undefined,
    lastName: input.lastName.trim() || undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    whatsapp: input.whatsapp?.trim() || undefined,
    companyId: input.companyId || undefined,
    lifecycleStage: input.lifecycleStage || undefined,
    ownerId: input.ownerId || undefined,
    source: input.source || undefined,
    country: input.country?.trim() || undefined,
    city: input.city?.trim() || undefined,
    address: input.address?.trim() || undefined,
    preferredChannel: input.preferredChannel || undefined,
    tags: input.tags ? parseTags(input.tags) : undefined,
  });
  if (!contact) {
    return { contact: null, error: "Failed to update contact" };
  }
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${input.id}`);
  return { contact, error: null };
}