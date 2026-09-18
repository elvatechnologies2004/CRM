/**
 * WhatsApp Auto-Linking Helper
 * 
 * Normalizes phone numbers and searches Contacts, Leads, and Companies
 * to auto-link WhatsApp conversations to existing CRM records.
 * 
 * Important: Never silently create duplicate contacts. Always present
 * the user with options when no match is found.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

type ContactMatch = { contact?: unknown };
type LeadMatch = { lead?: unknown };
type CompanyMatch = { company?: unknown };

let supa: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;

async function getSupabase() {
  if (!supa) {
    supa = await createSupabaseServerClient();
  }
  return supa;
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return cleaned.slice(1);
  if (cleaned.length >= 10 && cleaned.length <= 11) return "+" + cleaned;
  return "+" + cleaned;
}

/**
 * Search for a contact by normalized phone number within an organization.
 */
export async function findContactByPhone(
  organizationId: string,
  phoneNumber: string
) {
  const supa = await getSupabase();
  const normalized = normalizePhoneNumber(phoneNumber);

  const { data, error } = await supa
    .from("contacts")
    .select("id, first_name, last_name, full_name, email, phone, whatsapp, company_id, organizations(name)")
    .eq("organization_id", organizationId)
    .or(`phone.eq.${normalized},whatsapp.eq.${normalized}`);

  if (error) {
    console.error("Error finding contact by phone:", error);
    return { contact: null, error: error.message };
  }

  return { contact: data?.[0] || null, error: null };
}

/**
 * Search for a lead by normalized phone number within an organization.
 */
export async function findLeadByPhone(
  organizationId: string,
  phoneNumber: string
) {
  const supa = await getSupabase();
  const normalized = normalizePhoneNumber(phoneNumber);

  const { data, error } = await supa
    .from("leads")
    .select("id, first_name, last_name, full_name, email, phone, whatsapp, expected_value, currency")
    .eq("organization_id", organizationId)
    .or(`phone.eq.${normalized},whatsapp.eq.${normalized}`);

  if (error) {
    console.error("Error finding lead by phone:", error);
    return { lead: null, error: error.message };
  }

  return { lead: data?.[0] || null, error: null };
}

/**
 * Search for a company by normalized phone number within an organization.
 */
export async function findCompanyByPhone(
  organizationId: string,
  phoneNumber: string
) {
  const supa = await getSupabase();
  const normalized = normalizePhoneNumber(phoneNumber);

  const { data: contact, error: contactError } = await supa
    .from("contacts")
    .select("id, company_id, full_name, phone, whatsapp")
    .eq("organization_id", organizationId)
    .or(`phone.eq.${normalized},whatsapp.eq.${normalized}`)
    .single();

  if (contactError || !contact) {
    return { company: null, error: contactError?.message || "No contact found" };
  }

  if (contact.company_id) {
    const { data: company, error: companyError } = await supa
      .from("companies")
      .select("id, name, domain, phone, whatsapp")
      .eq("id", contact.company_id)
      .single();

    if (companyError) {
      return { company: null, error: companyError.message };
    }

    return { company, error: null };
  }

  return { company: null, error: null };
}

/**
 * Auto-link a WhatsApp conversation to CRM records.
 * Priority order: Contact > Lead > Company
 */
export async function autoLinkWhatsAppConversation(
  organizationId: string,
  phoneNumber: string
) {
  await getSupabase();

  // Search in priority order: Contact > Lead > Company
  const { contact, error: contactErr } = await findContactByPhone(
    organizationId,
    phoneNumber
  );

  if (contact && (contact as ContactMatch).contact) {
    return { type: "contact", record: (contact as ContactMatch).contact, match: true };
  }

  const { lead, error: leadErr } = await findLeadByPhone(
    organizationId,
    phoneNumber
  );

  if (lead && (lead as LeadMatch).lead) {
    return { type: "lead", record: (lead as LeadMatch).lead, match: true };
  }

  const { company, error: companyErr } = await findCompanyByPhone(
    organizationId,
    phoneNumber
  );

  if (company && (company as CompanyMatch).company) {
    return { type: "company", record: (company as CompanyMatch).company, match: true };
  }

  return { type: null, record: null, match: false, contactErr, leadErr, companyErr };
}

/**
 * Handle incoming WhatsApp number and attempt auto-linking.
 */
export async function handleIncomingWhatsAppNumber(
  organizationId: string,
  phoneNumber: string
) {
  const result = await autoLinkWhatsAppConversation(organizationId, phoneNumber);

  if (result.match) {
    return { action: "linked", record: result.record, type: result.type };
  }

  return { action: "unknown", record: null, type: null, contactErr: result.contactErr, leadErr: result.leadErr, companyErr: result.companyErr };
}