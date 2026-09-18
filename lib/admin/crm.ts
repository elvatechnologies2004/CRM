import "server-only";

import { buildPagedResult, getAdminDb, normalizePage } from "@/lib/admin/db";

export interface AdminLeadRow {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  owner: string;
  organization: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface AdminOpportunityRow {
  id: string;
  name: string;
  customer: string;
  company: string;
  owner: string;
  stage: string;
  value: number;
  currency: string;
  organization: string;
  createdAt: string;
  expectedClose: string | null;
  closedAt: string | null;
  archivedAt: string | null;
}

function display(value: unknown) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

interface AdminCrmRow {
  id: string;
  name?: string | null;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: string | null;
  owner_id?: string | null;
  created_at: string;
  archived_at: string | null;
  value?: number | string | null;
  currency?: string | null;
  expected_close_date?: string | null;
  won_at?: string | null;
  lost_at?: string | null;
  organizations?: { name?: string | null } | null;
  companies?: { name?: string | null } | null;
  contacts?: { full_name?: string | null } | null;
  profiles?: { full_name?: string | null; email?: string | null } | null;
  pipeline_stages?: { name?: string | null } | null;
}

export async function listAdminLeads(params: { search?: string; archive?: string; page?: number }) {
  const db = getAdminDb();
  const { page, pageSize, from, to } = normalizePage({ page: params.page }, 25);
  let query = db.from("leads").select("id, full_name, company_name, email, phone, source, status, owner_id, created_at, archived_at, organizations(name), profiles!leads_owner_id_fkey(full_name, email)", { count: "exact" });
  if (params.archive === "archived") query = query.not("archived_at", "is", null);
  else if (params.archive !== "all") query = query.is("archived_at", null);
  if (params.search) query = query.or(`full_name.ilike.%${params.search}%,company_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return buildPagedResult((data ?? []).map((row) => {
    const item = row as unknown as AdminCrmRow;
    return {
      id: item.id,
      name: display(item.full_name),
      company: display(item.company_name),
      email: display(item.email),
      phone: display(item.phone),
      source: display(item.source),
      status: display(item.status),
      owner: display(item.profiles?.full_name ?? item.profiles?.email),
      organization: display(item.organizations?.name),
      createdAt: item.created_at,
      archivedAt: item.archived_at,
    };
  }), count ?? 0, page, pageSize);
}

export async function listAdminOpportunities(params: { search?: string; archive?: string; page?: number }) {
  const db = getAdminDb();
  const { page, pageSize, from, to } = normalizePage({ page: params.page }, 25);
  let query = db.from("deals").select("id, name, value, currency, owner_id, created_at, expected_close_date, won_at, lost_at, archived_at, organizations(name), companies(name), contacts(full_name), profiles!deals_owner_id_fkey(full_name, email), pipeline_stages(name)", { count: "exact" });
  if (params.archive === "archived") query = query.not("archived_at", "is", null);
  else if (params.archive !== "all") query = query.is("archived_at", null);
  if (params.search) query = query.ilike("name", `%${params.search}%`);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return buildPagedResult((data ?? []).map((row) => {
    const item = row as unknown as AdminCrmRow;
    return {
      id: item.id,
      name: display(item.name),
      customer: display(item.contacts?.full_name),
      company: display(item.companies?.name),
      owner: display(item.profiles?.full_name ?? item.profiles?.email),
      stage: display(item.pipeline_stages?.name),
      value: Number(item.value ?? 0),
      currency: item.currency ?? "PKR",
      organization: display(item.organizations?.name),
      createdAt: item.created_at,
      expectedClose: item.expected_close_date ?? null,
      closedAt: item.won_at ?? item.lost_at ?? null,
      archivedAt: item.archived_at,
    };
  }), count ?? 0, page, pageSize);
}