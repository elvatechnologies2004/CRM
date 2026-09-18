import "server-only";

import {
  getActiveOrgId,
  toIso,
  buildFullName,
  uuidOrNull,
  fetchOwnerIndex,
  ensureOrgForWrite,
  PAGE_SIZE,
} from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { ContactRecord } from "@/lib/types";

export interface ContactQuery {
  search?: string;
  lifecycleStage?: string;
  companyId?: string;
  page?: number;
  pageSize?: number;
}

interface ContactRow {
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
  lifecycle_stage: string | null;
  owner_id: string | null;
  source: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  preferred_channel: string | null;
  preferred_language: string | null;
  birthday: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  next_activity_at: string | null;
}
function mapContactRow(row: ContactRow, owners: Record<string, { name: string }>): ContactRecord {
  const owner = row.owner_id ? owners[row.owner_id] : undefined;
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    jobTitle: row.job_title ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    companyId: uuidOrNull(row.company_id),
    companyName: row.company_name ?? "",
    lifecycleStage: (row.lifecycle_stage as ContactRecord["lifecycleStage"]) ?? "Lead",
    ownerId: row.owner_id ?? "",
    ownerName: owner?.name ?? "",
    source: (row.source as ContactRecord["source"]) ?? "Other",
    country: row.country ?? "",
    city: row.city ?? "",
    address: row.address ?? "",
    tags: row.tags ?? [],
    preferredChannel: (row.preferred_channel as ContactRecord["preferredChannel"]) ?? "Email",
    preferredLanguage: row.preferred_language ?? undefined,
    birthday: row.birthday ?? undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    lastActivityAt: toIso(row.last_activity_at ?? row.created_at),
    nextActivityAt: row.next_activity_at ? toIso(row.next_activity_at) : undefined,
  };
}

export async function getContacts(query: ContactQuery = {}) {
  if (!isSupabaseConfigured()) return { rows: [] as ContactRecord[], total: 0 };

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return { rows: [] as ContactRecord[], total: 0 };

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let b = supabase
    .from("contacts")
    .select("*, companies(name)", { count: "exact" })
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .range(from, to);

  if (query.search) {
    const like = `%${query.search}%`;
    b = b.or(`full_name.ilike.${like},email.ilike.${like},companies.name.ilike.${like}`) as typeof b;
  }
  if (query.lifecycleStage) b = b.eq("lifecycle_stage", query.lifecycleStage);
  if (query.companyId) b = b.eq("company_id", query.companyId);

  b = b.order("created_at", { ascending: false });

  const { data, count, error } = await b;
  if (error) {
    console.error("[contacts] list failed", error.message);
    return { rows: [] as ContactRecord[], total: 0 };
  }

  const rows = (data ?? []).map((r) => {
    const row = r as unknown as ContactRow;
    const company = Array.isArray(r.companies) ? null : (r.companies as { name: string } | null);
    return mapContactRow({ ...row, company_name: company?.name ?? null }, owners);
  });

  return { rows, total: count ?? 0 };
}

export async function getContactById(id: string): Promise<ContactRecord | null> {
  if (!isSupabaseConfigured() || !id) return null;

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const { data } = await supabase
    .from("contacts")
    .select("*, companies(name)")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return null;
  const company = Array.isArray(data.companies) ? null : (data.companies as { name: string } | null);
  return mapContactRow({ ...(data as unknown as ContactRow), company_name: company?.name ?? null }, owners);
}

export interface ContactCreateInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  companyId?: string;
  jobTitle?: string;
  lifecycleStage?: string;
  ownerId?: string;
  source?: string;
  country?: string;
  city?: string;
  address?: string;
  preferredChannel?: string;
  tags?: string[];
}

export async function createContact(input: ContactCreateInput): Promise<ContactRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await ensureOrgForWrite(supabase);
  const { data: userData } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("contacts")
    .insert({
      organization_id: organizationId,
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: buildFullName(input.firstName, input.lastName),
      email: input.email ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      company_id: input.companyId ?? null,
      job_title: input.jobTitle ?? null,
      lifecycle_stage: input.lifecycleStage ?? "Lead",
      owner_id: input.ownerId ?? userData.user?.id ?? null,
      source: input.source ?? "Manual",
      country: input.country ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      preferred_channel: input.preferredChannel ?? "Email",
      tags: input.tags ?? [],
      created_by: userData.user?.id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!data) return null;
  const owners = await fetchOwnerIndex(supabase, organizationId);
  return mapContactRow(data as unknown as ContactRow, owners);
}

export interface ContactUpdateInput extends Partial<ContactCreateInput> {
  id: string;
}

export async function updateContact(input: ContactUpdateInput): Promise<ContactRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await ensureOrgForWrite(supabase);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.firstName !== undefined || input.lastName !== undefined) {
    patch.first_name = input.firstName ?? undefined;
    patch.last_name = input.lastName ?? undefined;
    const current = await supabase
      .from("contacts")
      .select("first_name, last_name")
      .eq("id", input.id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    patch.full_name = buildFullName(
      input.firstName ?? (current.data?.first_name as string | null) ?? null,
      input.lastName ?? (current.data?.last_name as string | null) ?? null,
    );
  }
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.whatsapp !== undefined) patch.whatsapp = input.whatsapp || null;
  if (input.companyId !== undefined) patch.company_id = input.companyId || null;
  if (input.jobTitle !== undefined) patch.job_title = input.jobTitle || null;
  if (input.lifecycleStage !== undefined) patch.lifecycle_stage = input.lifecycleStage;
  if (input.ownerId !== undefined) patch.owner_id = input.ownerId || null;
  if (input.source !== undefined) patch.source = input.source;
  if (input.country !== undefined) patch.country = input.country || null;
  if (input.city !== undefined) patch.city = input.city || null;
  if (input.address !== undefined) patch.address = input.address || null;
  if (input.preferredChannel !== undefined) patch.preferred_channel = input.preferredChannel;
  if (input.tags !== undefined) patch.tags = input.tags;

  const { data } = await supabase
    .from("contacts")
    .update(patch)
    .eq("id", input.id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (!data) return null;
  const owners = await fetchOwnerIndex(supabase, organizationId);
  return mapContactRow(data as unknown as ContactRow, owners);
}


