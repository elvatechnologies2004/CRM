import "server-only";

import {
  getActiveOrgId,
  toIso,
  fetchOwnerIndex,
  getOrgIdOrThrow,
  PAGE_SIZE,
} from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { CompanyRecord } from "@/lib/types";

export interface CompanyQuery {
  search?: string;
  industry?: string;
  accountStatus?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
}

interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  employee_count: number | null;
  annual_revenue: number | null;
  currency: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  account_status: string | null;
  owner_id: string | null;
  source: string | null;
  tags: string[] | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
}

export function mapCompanyRow(row: CompanyRow, owners: Record<string, { name: string }>): CompanyRecord {
  const owner = row.owner_id ? owners[row.owner_id] : undefined;
  return {
    id: row.id,
    name: row.name,
    domain: row.domain ?? "",
    website: row.website ?? "",
    industry: (row.industry as CompanyRecord["industry"]) ?? "Other",
    companySize: row.company_size ?? "",
    employeeCount: row.employee_count ?? 0,
    annualRevenue: row.annual_revenue != null ? String(row.annual_revenue) : "",
    currency: row.currency ?? "USD",
    phone: row.phone ?? "",
    email: row.email ?? "",
    country: row.country ?? "",
    city: row.city ?? "",
    address: row.address ?? "",
    accountStatus: (row.account_status as CompanyRecord["accountStatus"]) ?? "Prospect",
    ownerId: row.owner_id ?? "",
    ownerName: owner?.name ?? "",
    source: (row.source as CompanyRecord["source"]) ?? "Other",
    tags: row.tags ?? [],
    description: row.description ?? "",
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    lastActivityAt: toIso(row.last_activity_at ?? row.created_at),
  };
}

export async function getCompanies(query: CompanyQuery = {}) {
  if (!isSupabaseConfigured()) return { rows: [] as CompanyRecord[], total: 0 };

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return { rows: [] as CompanyRecord[], total: 0 };

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let b = supabase
    .from("companies")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .range(from, to);

  if (query.search) {
    const like = `%${query.search}%`;
    b = b.or(`name.ilike.${like},domain.ilike.${like},email.ilike.${like}`) as typeof b;
  }
  if (query.industry) b = b.eq("industry", query.industry);
  if (query.accountStatus) b = b.eq("account_status", query.accountStatus);
  if (query.ownerId) b = b.eq("owner_id", query.ownerId);

  b = b.order("created_at", { ascending: false });

  const { data, count, error } = await b;
  if (error) {
    console.error("[companies] list failed", error.message);
    return { rows: [] as CompanyRecord[], total: 0 };
  }

  return {
    rows: (data ?? []).map((r) => mapCompanyRow(r as unknown as CompanyRow, owners)),
    total: count ?? 0,
  };
}

export async function getCompanyById(id: string): Promise<CompanyRecord | null> {
  if (!isSupabaseConfigured() || !id) return null;

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return null;
  return mapCompanyRow(data as unknown as CompanyRow, owners);
}

export interface CompanyCreateInput {
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  employeeCount?: number;
  annualRevenue?: number;
  currency?: string;
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  address?: string;
  accountStatus?: string;
  ownerId?: string;
  source?: string;
  tags?: string[];
  description?: string;
}

export async function createCompany(input: CompanyCreateInput): Promise<CompanyRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = getOrgIdOrThrow(await getActiveOrgId(supabase));
  const { data: userData } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("companies")
    .insert({
      organization_id: organizationId,
      name: input.name,
      domain: input.domain ?? null,
      website: input.website ?? null,
      industry: input.industry ?? "Other",
      company_size: input.companySize ?? null,
      employee_count: input.employeeCount ?? null,
      annual_revenue: input.annualRevenue ?? null,
      currency: input.currency ?? "USD",
      phone: input.phone ?? null,
      email: input.email ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      account_status: input.accountStatus ?? "Prospect",
      owner_id: input.ownerId ?? userData.user?.id ?? null,
      source: input.source ?? "Manual",
      tags: input.tags ?? [],
      description: input.description ?? null,
      created_by: userData.user?.id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!data) return null;
  const owners = await fetchOwnerIndex(supabase, organizationId);
  return mapCompanyRow(data as unknown as CompanyRow, owners);
}