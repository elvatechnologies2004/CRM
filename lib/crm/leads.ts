import "server-only";

import { getActiveOrgId, toIso, buildFullName, uuidOrNull, fetchOwnerIndex, ensureOrgForWrite, PAGE_SIZE } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { autoRouteLead, type RouterLead } from "@/lib/routing/routing";
import { dispatchWorkflowEvent } from "@/lib/workflows/dispatch";
import type { LeadRecord, LeadQualification, LeadStatus, LeadSourceOption, LeadNote, LeadActivity } from "@/lib/types";

export interface LeadQuery {
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface LeadListResult {
  rows: LeadRecord[];
  total: number;
}

interface LeadRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  company_id: string | null;
  company_name: string | null;
  job_title: string | null;
  country: string | null;
  city: string | null;
  source: string | null;
  status: string | null;
  score: number | null;
  owner_id: string | null;
  expected_value: number | null;
  currency: string | null;
  budget: string | null;
  interested_product: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  next_follow_up_at: string | null;
  converted_deal_id: string | null;
  tags: string[] | null;
  industry: string | null;
  company_size: string | null;
  account_type: string | null;
  territory_id: string | null;
}

export function mapLeadRow(row: LeadRow, owners: Record<string, { name: string }>): LeadRecord {
  const owner = row.owner_id ? owners[row.owner_id] : undefined;
  const firstName = row.first_name ?? "";
  const lastName = row.last_name ?? "";
  return {
    id: row.id,
    firstName,
    lastName,
    email: row.email ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    companyId: uuidOrNull(row.company_id),
    companyName: row.company_name ?? "",
    jobTitle: row.job_title ?? "",
    country: row.country ?? "",
    city: row.city ?? "",
    source: (row.source as LeadSourceOption) ?? "Other",
    status: (row.status as LeadStatus) ?? "New",
    score: row.score ?? 0,
    ownerId: row.owner_id ?? "",
    ownerName: owner?.name ?? "",
    expectedValue: row.expected_value ? Number(row.expected_value) : 0,
    currency: row.currency ?? "PKR",
    budget: row.budget ?? "Estimated",
    interest: row.interested_product ?? "",
    tags: row.tags ?? [],
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    lastActivityAt: toIso(row.last_activity_at ?? row.created_at),
    nextFollowUpAt: row.next_follow_up_at ? toIso(row.next_follow_up_at) : undefined,
    convertedDealId: uuidOrNull(row.converted_deal_id),
    qualification: {
      budget: (row.budget as LeadQualification["budget"]) ?? "Estimated",
      authority: "Unknown",
      need: "Moderate",
      timeline: "This Quarter",
      score: row.score ?? 0,
    },
  };
}

/**
 * Server-side list with search / filter / sort / pagination (Steps 79–81).
 */
export async function getLeads(query: LeadQuery = {}): Promise<LeadListResult> {
  if (!isSupabaseConfigured()) return { rows: [], total: 0 };

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return { rows: [], total: 0 };

  const owners = await fetchOwnerIndex(supabase, organizationId);

  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let b = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .range(from, to);

  if (query.search) {
    const like = `%${query.search}%`;
    b = b.or(
      `full_name.ilike.${like},email.ilike.${like},company_name.ilike.${like}`,
    ) as typeof b;
  }
  if (query.status) b = b.eq("status", query.status);
  if (query.source) b = b.eq("source", query.source);
  if (query.ownerId) b = b.eq("owner_id", query.ownerId);

  const sortMap: Record<string, string> = {
    name: "full_name",
    createdAt: "created_at",
    created: "created_at",
    score: "score",
    expectedValue: "expected_value",
    lastActivityAt: "last_activity_at",
    status: "status",
  };
  const sortCol = sortMap[query.sortBy ?? "createdAt"] ?? "created_at";
  b = b.order(sortCol, { ascending: (query.sortDir ?? "desc") === "asc" });

  const { data, count, error } = await b;
  if (error) {
    console.error("[leads] list failed", error.message);
    return { rows: [], total: 0 };
  }

  return {
    rows: (data ?? []).map((r) => mapLeadRow(r as unknown as LeadRow, owners)),
    total: count ?? 0,
  };
}

export async function getLeadById(id: string): Promise<LeadRecord | null> {
  if (!isSupabaseConfigured() || !id) return null;

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return null;
  return mapLeadRow(data as unknown as LeadRow, owners);
}

// ------------------------------------------------------------------
// Mutations
// ------------------------------------------------------------------

export interface LeadCreateInput {
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
  score?: number;
  ownerId?: string;
  expectedValue?: number;
  currency?: string;
  budget?: string;
  interest?: string;
  tags?: string[];
  description?: string;
}

export async function createLead(input: LeadCreateInput): Promise<LeadRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await ensureOrgForWrite(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName = buildFullName(input.firstName, input.lastName);

  const { data } = await supabase
    .from("leads")
    .insert({
      organization_id: organizationId,
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: fullName,
      email: input.email || null,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      company_name: input.companyName || null,
      job_title: input.jobTitle || null,
      country: input.country || null,
      city: input.city || null,
      source: input.source ?? "Manual",
      status: input.status ?? "New",
      score: input.score ?? 0,
      owner_id: input.ownerId || user?.id || null,
      expected_value: input.expectedValue ?? null,
      currency: input.currency ?? "PKR",
      budget: input.budget ?? "Unclear",
      interested_product: input.interest || null,
      tags: input.tags ?? [],
      description: input.description || null,
      created_by: user?.id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!data) {
    console.error("[leads] create failed");
    return null;
  }

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const lead = mapLeadRow(data as unknown as LeadRow, owners);

  // Step 123 — auto-route new leads and fan out workflow events
  // (fire-and-forget so a slow route never blocks the create path).
  void (async () => {
    try {
      const subject: RouterLead = {
        id: data.id,
        organization_id: organizationId,
        source: data.source ?? null,
        country: data.country ?? null,
        city: data.city ?? null,
        industry: data.industry ?? null,
        company_size: data.company_size ?? null,
        account_type: data.account_type ?? null,
        interested_product: data.interested_product ?? null,
        expected_value: data.expected_value ?? null,
        score: data.score ?? null,
        owner_id: data.owner_id ?? null,
        company_name: data.company_name ?? null,
      };
      await dispatchWorkflowEvent("lead.created", {
        subject_type: "leads",
        subject_id: data.id,
        ...subject,
      });
      if (!input.ownerId && data.owner_id) {
        await autoRouteLead(subject);
      }
    } catch {
      // routing/workflows must never break lead creation
    }
  })();

  return lead;
}

export interface LeadUpdateInput extends Partial<LeadCreateInput> {
  id: string;
  score?: number;
  unqualifiedReason?: string;
  unqualifiedNotes?: string;
}

export async function updateLead(input: LeadUpdateInput): Promise<LeadRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await ensureOrgForWrite(supabase);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
  };
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.firstName !== undefined || input.lastName !== undefined) {
    const cur = await getLeadById(input.id);
    patch.full_name = buildFullName(input.firstName ?? cur?.firstName, input.lastName ?? cur?.lastName);
  }
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.whatsapp !== undefined) patch.whatsapp = input.whatsapp || null;
  if (input.companyName !== undefined) patch.company_name = input.companyName || null;
  if (input.jobTitle !== undefined) patch.job_title = input.jobTitle || null;
  if (input.country !== undefined) patch.country = input.country || null;
  if (input.city !== undefined) patch.city = input.city || null;
  if (input.source !== undefined) patch.source = input.source;
  if (input.status !== undefined) patch.status = input.status;
  if (input.score !== undefined) patch.score = input.score;
  if (input.ownerId !== undefined) patch.owner_id = input.ownerId || null;
  if (input.expectedValue !== undefined) patch.expected_value = input.expectedValue ?? null;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.budget !== undefined) patch.budget = input.budget;
  if (input.interest !== undefined) patch.interested_product = input.interest || null;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.unqualifiedReason !== undefined && input.unqualifiedReason !== null) {
    patch.unqualified_reason = input.unqualifiedReason || null;
    patch.unqualified_at = input.unqualifiedReason ? new Date().toISOString() : null;
  }
  if (input.unqualifiedNotes !== undefined && input.unqualifiedNotes !== null) {
    patch.unqualified_notes = input.unqualifiedNotes || null;
  }
  if (input.status === "Unqualified" && !input.unqualifiedReason && input.unqualifiedReason !== undefined) {
    patch.unqualified_reason = null;
    patch.unqualified_at = null;
  }

  const { data } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", input.id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (!data) {
    console.error("[leads] update failed");
    return null;
  }

  const owners = await fetchOwnerIndex(supabase, organizationId);
  return mapLeadRow(data as unknown as LeadRow, owners);
}

/** Soft-delete (archive) a lead (Step 71). */
export async function archiveLead(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await ensureOrgForWrite(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("leads")
    .update({ archived_at: new Date().toISOString(), archived_by: user?.id ?? null })
    .eq("id", id)
    .eq("organization_id", organizationId);

  return !error;
}

/** Permanently remove a lead record from the current organization. */
export async function deleteLead(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await ensureOrgForWrite(supabase);

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  return !error;
}

/** Convert a lead to a deal via the transactional RPC (Steps 52/57). */
export async function convertLead(id: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  await ensureOrgForWrite(supabase);

  const { data, error } = await supabase.rpc("convert_lead", { p_lead_id: id });;
  if (error) {
    console.error("[leads] convert failed", error.message);
    return null;
  }

  void dispatchWorkflowEvent("lead.converted", {
    subject_type: "leads",
    subject_id: id,
    deal_id: data,
  });
  return (data as string) ?? null;
}

// ------------------------------------------------------------------
// Sub-collections
// ------------------------------------------------------------------

/** Real notes for a lead, newest first. */
export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return [];

  const { data } = await supabase
    .from("notes")
    .select("id, body, is_pinned, created_at, created_by, profiles(full_name)")
    .eq("related_type", "lead")
    .eq("related_id", leadId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const author = Array.isArray(row.profiles) ? null : (row.profiles as { full_name: string | null } | null);
    return {
      id: row.id,
      body: row.body,
      author: author?.full_name || "You",
      createdAt: toIso(row.created_at),
      pinned: row.is_pinned,
    };
  });
}

export async function addLeadNote(leadId: string, body: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await ensureOrgForWrite(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("notes")
    .insert({
      organization_id: organizationId,
      related_type: "lead",
      related_id: leadId,
      body,
      created_by: user?.id ?? null,
    });

  if (error) {
    console.error("[leads] addNote failed", error.message);
    return false;
  }
  return true;
}

/** Real activity timeline for a lead. */
export async function getLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return [];

  const { data } = await supabase
    .from("activities")
    .select("id, activity_type, title, description, occurred_at, actor_user_id")
    .eq("related_type", "lead")
    .eq("related_id", leadId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id,
    type: mapActivityType(row.activity_type),
    title: row.title,
    detail: row.description ?? undefined,
    at: toIso(row.occurred_at),
  }));
}

function mapActivityType(type: string): LeadActivity["type"] {
  const map: Record<string, LeadActivity["type"]> = {
    lead_created: "created",
    email_sent: "email-sent",
    email_opened: "email-opened",
    email_replied: "email-replied",
    whatsapp_sent: "whatsapp",
    call_logged: "call",
    meeting_created: "meeting",
    note_added: "note",
    task_completed: "task-completed",
    task_created: "task-completed",
    deal_stage_changed: "status-change",
    lead_stage_changed: "status-change",
    quote_created: "quote",
    deal_created: "created",
    lead_converted: "status-change",
  };
  return map[type] ?? "note";
}

// "use server" style exports so server components import the module safely.
export { isSupabaseConfigured };