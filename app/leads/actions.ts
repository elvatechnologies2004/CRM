"use server";

import { revalidatePath } from "next/cache";

import { createLead, updateLead, getLeadById } from "@/lib/crm/leads";
import type { LeadStatus, LeadSourceOption } from "@/lib/types";

export interface LeadActionResult {
  lead: Awaited<ReturnType<typeof getLeadById>>;
  error: string | null;
}

export async function createLeadAction(input: {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  source?: LeadSourceOption | string;
  ownerId?: string;
  notes?: string;
  tags?: string[];
}): Promise<LeadActionResult> {
  const name = `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();
  if (!name) {
    return { lead: null, error: "Customer name is required." };
  }

  const lead = await createLead({
    firstName: input.firstName.trim(),
    lastName: input.lastName?.trim() || "",
    email: input.email?.trim() || "",
    phone: input.phone?.trim() || "",
    companyName: input.companyName?.trim() || undefined,
    source: (input.source as LeadSourceOption) || "Manual",
    ownerId: input.ownerId,
    description: input.notes?.trim() || undefined,
    tags: input.tags ?? [],
  });

  if (!lead) {
    return { lead: null, error: "Failed to create lead." };
  }

  revalidatePath("/leads");
  return { lead, error: null };
}

export async function updateLeadAction(
  id: string,
  input: {
    status?: LeadStatus;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    source?: LeadSourceOption | string;
    ownerId?: string;
    notes?: string;
    unqualifiedReason?: string;
    unqualifiedNotes?: string;
  }
): Promise<LeadActionResult> {
  const lead = await updateLead({
    id,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    companyName: input.companyName,
    source: input.source as LeadSourceOption | undefined,
    ownerId: input.ownerId,
    description: input.notes,
    status: input.status,
    unqualifiedReason: input.unqualifiedReason,
    unqualifiedNotes: input.unqualifiedNotes,
  });

  if (!lead) {
    return { lead: null, error: "Failed to update lead." };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { lead, error: null };
}

export async function logLeadContactAction(
  id: string,
  details: {
    method: string;
    occurredAt: string;
    outcome: string;
    notes?: string;
  }
): Promise<{ ok: boolean; message?: string }> {
  const supabase = (await import("@/lib/supabase/server")).createSupabaseServerClient;
  const client = await supabase();
  const { data: userData } = await client.auth.getUser();
  const { data: org } = await client.rpc("current_organization_id");
  const organizationId = org as string | null;
  if (!organizationId) return { ok: false, message: "No active organization found." };

  const { error } = await client.from("activities").insert({
    organization_id: organizationId,
    activity_type: "call_logged",
    related_type: "lead",
    related_id: id,
    actor_user_id: userData.user?.id ?? null,
    lead_id: id,
    title: "Customer contact logged",
    description: `${details.method} · ${details.outcome}${details.notes ? ` · ${details.notes}` : ""}`,
    occurred_at: details.occurredAt,
    metadata: { method: details.method, outcome: details.outcome },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  return { ok: true };
}

export async function createLeadActivityAction(
  id: string,
  title: string,
  description: string,
  type: string
): Promise<{ ok: boolean; message?: string }> {
  const supabase = (await import("@/lib/supabase/server")).createSupabaseServerClient;
  const client = await supabase();
  const { data: userData } = await client.auth.getUser();
  const { data: org } = await client.rpc("current_organization_id");
  const organizationId = org as string | null;
  if (!organizationId) return { ok: false, message: "No active organization found." };

  const { error } = await client.from("activities").insert({
    organization_id: organizationId,
    activity_type: type,
    related_type: "lead",
    related_id: id,
    actor_user_id: userData.user?.id ?? null,
    lead_id: id,
    title,
    description,
    occurred_at: new Date().toISOString(),
    metadata: {},
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteLeadAction(leadId: string) {
  const client = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const { data: orgId } = await client.rpc("current_organization_id");
  if (!orgId) return { ok: false, error: "No active organization found." };
  const { data: lead } = await client.from("leads").select("id, converted_deal_id").eq("id", leadId).eq("organization_id", orgId).maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found or access denied." };
  if (lead.converted_deal_id) return { ok: false, error: "Converted leads can only be archived." };
  const { data: deletedRows, error } = await client
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("organization_id", orgId)
    .select("id");
  if (error) {
    console.error("[leads] delete failed", error);
    return { ok: false, deletedId: leadId, error: error.message };
  }
  if (!deletedRows?.length) {
    console.error("[leads] delete affected zero rows", { leadId, orgId });
    return { ok: false, deletedId: leadId, error: "Lead was not deleted. You may not have permission to delete it." };
  }
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, deletedId: leadId };
}

export async function archiveLeadAction(leadId: string) {
  const client = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const { data: orgId } = await client.rpc("current_organization_id");
  if (!orgId) return { ok: false, error: "No active organization found." };
  const { error } = await client.from("leads").update({ archived_at: new Date().toISOString(), archived_by: user.id }).eq("id", leadId).eq("organization_id", orgId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: !error, error: error?.message };
}

export async function restoreLeadAction(leadId: string) {
  const client = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const { data: orgId } = await client.rpc("current_organization_id");
  if (!orgId) return { ok: false, error: "No active organization found." };
  const { error } = await client.from("leads").update({ archived_at: null, archived_by: null }).eq("id", leadId).eq("organization_id", orgId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { ok: !error, error: error?.message };
}

export async function convertLeadAction(
  leadId: string,
  input?: {
    name?: string;
    value?: number;
    expectedCloseDate?: string;
    ownerId?: string;
    description?: string;
  }
): Promise<{ ok: boolean; leadId: string; dealId?: string; dealName?: string; error?: string; message?: string }> {
  const supabaseFactory = (await import("@/lib/supabase/server")).createSupabaseServerClient;
  const supabase = await supabaseFactory();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, leadId, error: "Not authenticated.", message: "Not authenticated." };
  }

  const { data: organizationId } = await supabase.rpc("current_organization_id");
  const orgId = typeof organizationId === "string" ? organizationId : null;
  if (!orgId) {
    return { ok: false, leadId, error: "No active organization found.", message: "No active organization found." };
  }

  const lead = await (await import("@/lib/crm/leads")).getLeadById(leadId);
  if (!lead) {
    return { ok: false, leadId, error: "Lead not found or access denied.", message: "Lead not found or access denied." };
  }

  const leadRecord = await supabase.from("leads").select("id, status, converted_deal_id, organization_id").eq("id", leadId).eq("organization_id", orgId).maybeSingle();
  if (!leadRecord.data) {
    return { ok: false, leadId, error: "Lead not found in this workspace.", message: "Lead not found in this workspace." };
  }

  if (leadRecord.data.status !== "Qualified") {
    return { ok: false, leadId, error: "Only qualified leads can convert to an opportunity.", message: "Only qualified leads can convert to an opportunity." };
  }

  if (leadRecord.data.converted_deal_id) {
    const existing = await (await import("@/lib/crm/deals")).getDealById(leadRecord.data.converted_deal_id);
    return {
      ok: true,
      leadId,
      dealId: leadRecord.data.converted_deal_id,
      dealName: existing?.name ?? "Opportunity",
      message: "This lead has already been converted.",
    };
  }

  const { data: dealId, error } = await supabase.rpc("convert_lead", { p_lead_id: leadId });
  if (error || !dealId) {
    return { ok: false, leadId, error: error?.message ?? "Unable to create opportunity.", message: error?.message ?? "Unable to create opportunity." };
  }

  const normalizedName = (input?.name ?? "").trim();
  const normalizedValue = typeof input?.value === "number" ? input.value : Number(input?.value ?? lead.expectedValue ?? 0);
  const opportunityName = normalizedName || `${lead.companyName || `${lead.firstName} ${lead.lastName}`.trim() || "Customer"}${lead.companyName ? ` - ${`${lead.firstName} ${lead.lastName}`.trim() || "Customer"}` : " Opportunity"}`;
  const parsedCloseDate = input?.expectedCloseDate && input.expectedCloseDate.trim() ? input.expectedCloseDate : null;

  const patch: Record<string, unknown> = {
    name: opportunityName,
    value: Number.isFinite(normalizedValue) ? Math.max(Math.round(normalizedValue), 0) : 0,
    expected_close_date: parsedCloseDate,
    owner_id: input?.ownerId ?? (lead.ownerId || user.id),
    description: input?.description ?? (lead.interest || lead.budget || undefined),
    updated_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
  };

  const { error: patchError } = await supabase.from("deals").update(patch).eq("id", dealId).eq("organization_id", orgId);
  if (patchError) {
    return { ok: false, leadId, error: patchError.message, message: patchError.message };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "lead_converted",
    related_type: "lead",
    related_id: leadId,
    actor_user_id: user.id,
    lead_id: leadId,
    deal_id: dealId,
    title: "Converted to Opportunity",
    description: `Lead converted to opportunity ${opportunityName}`,
    occurred_at: new Date().toISOString(),
  });

  await supabase.from("leads").update({
    converted_deal_id: dealId,
    converted_at: new Date().toISOString(),
    status: "Qualified",
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", leadId).eq("organization_id", orgId);

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/opportunities");
  return { ok: true, leadId, dealId: String(dealId), dealName: opportunityName, message: "Opportunity created successfully." };
}
