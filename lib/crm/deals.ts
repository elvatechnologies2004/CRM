import "server-only";

import {
  getActiveOrgId,
  toIso,
  toIsoDate,
  uuidOrNull,
  fetchOwnerIndex,
  getOrgIdOrThrow,
  PAGE_SIZE,
} from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { DealRecord, Pipeline, PipelineStage } from "@/lib/types";

export interface DealQuery {
  search?: string;
  stageId?: string;
  companyId?: string;
  ownerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface DealRow {
  id: string;
  name: string;
  company_id: string | null;
  primary_contact_id: string | null;
  pipeline_id: string | null;
  stage_id: string | null;
  value: number | null;
  currency: string | null;
  probability: number | null;
  expected_revenue: number | null;
  expected_close_date: string | null;
  owner_id: string | null;
  health_score: number | null;
  health_status: string | null;
  source: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  won_at: string | null;
  lost_at: string | null;
  win_reason: string | null;
  lost_reason: string | null;
  competitor: string | null;
}

interface DealEmbed {
  companies?: { name: string } | null;
  contacts?: { full_name: string | null } | null;
  pipelines?: { id: string; name: string } | null;
  pipeline_stages?: { id: string; name: string; position: number } | null;
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86400000));
}

export function mapDealRow(
  row: DealRow,
  embed: DealEmbed,
  owners: Record<string, { name: string }>,
): DealRecord {
  const owner = row.owner_id ? owners[row.owner_id] : undefined;
  const createdAt = new Date(toIso(row.created_at));

  return {
    id: row.id,
    name: row.name,
    companyId: uuidOrNull(row.company_id),
    companyName: embed.companies?.name ?? "",
    primaryContactId: uuidOrNull(row.primary_contact_id),
    primaryContactName: embed.contacts?.full_name ?? "",
    pipelineId: row.pipeline_id ?? "",
    pipelineName: embed.pipelines?.name ?? "Main Sales Pipeline",
    stageId: row.stage_id ?? "",
    stageName: embed.pipeline_stages?.name ?? "New",
    value: row.value ? Number(row.value) : 0,
    currency: row.currency ?? "PKR",
    probability: row.probability ?? 0,
    expectedRevenue: row.expected_revenue ? Number(row.expected_revenue) : row.value ? Number(row.value) * (row.probability ?? 0) / 100 : 0,
    expectedCloseDate: row.expected_close_date ? toIsoDate(row.expected_close_date) : "",
    ownerId: row.owner_id ?? "",
    ownerName: owner?.name ?? "",
    healthScore: row.health_score ?? 0,
    healthStatus: (row.health_status as DealRecord["healthStatus"]) ?? "Healthy",
    source: (row.source as DealRecord["source"]) ?? "Other",
    description: row.description ?? undefined,
    tags: row.tags ?? [],
    products: [],
    contacts: [],
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    lastActivityAt: toIso(row.last_activity_at ?? row.created_at),
    daysOpen: daysBetween(createdAt, new Date()),
    daysInStage: daysBetween(createdAt, new Date()),
    wonDate: row.won_at ? toIso(row.won_at) : undefined,
    lostDate: row.lost_at ? toIso(row.lost_at) : undefined,
    winReason: (row.win_reason as DealRecord["winReason"]) ?? undefined,
    lostReason: (row.lost_reason as DealRecord["lostReason"]) ?? undefined,
    competitor: row.competitor ?? undefined,
  };
}

export async function getDeals(query: DealQuery = {}) {
  if (!isSupabaseConfigured()) return { rows: [] as DealRecord[], total: 0 };

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return { rows: [] as DealRecord[], total: 0 };

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let b = supabase
    .from("deals")
    .select("*, companies(name), contacts(full_name), pipelines(id, name), pipeline_stages(id, name, position)", {
      count: "exact",
    })
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .range(from, to);

  if (query.search) {
    const like = `%${query.search}%`;
    b = b.or(`name.ilike.${like},companies.name.ilike.${like}`) as typeof b;
  }
  if (query.stageId) b = b.eq("stage_id", query.stageId);
  if (query.companyId) b = b.eq("company_id", query.companyId);
  if (query.ownerId) b = b.eq("owner_id", query.ownerId);
  if (query.status === "won") b = b.not("won_at", "is", null);
  if (query.status === "lost") b = b.not("lost_at", "is", null);
  if (query.status === "open") b = b.is("won_at", null).is("lost_at", null);

  b = b.order("created_at", { ascending: false });

  const { data, count, error } = await b;
  if (error) {
    console.error("[deals] list failed", error.message);
    return { rows: [] as DealRecord[], total: 0 };
  }

  const rows = (data ?? []).map((r) => {
    const row = r as unknown as DealRow;
    const embed: DealEmbed = {
      companies: Array.isArray(r.companies) ? null : (r.companies as { name: string } | null),
      contacts: Array.isArray(r.contacts) ? null : (r.contacts as { full_name: string | null } | null),
      pipelines: Array.isArray(r.pipelines) ? null : (r.pipelines as { id: string; name: string } | null),
      pipeline_stages: Array.isArray(r.pipeline_stages) ? null : (r.pipeline_stages as { id: string; name: string; position: number } | null),
    };
    return mapDealRow(row, embed, owners);
  });

  return { rows, total: count ?? 0 };
}

export async function getDealById(id: string): Promise<DealRecord | null> {
  if (!isSupabaseConfigured() || !id) return null;

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const owners = await fetchOwnerIndex(supabase, organizationId);
  const { data } = await supabase
    .from("deals")
    .select("*, companies(name), contacts(full_name), pipelines(id, name), pipeline_stages(id, name, position)")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return null;
  const row = data as unknown as DealRow;
  const embed: DealEmbed = {
    companies: Array.isArray(data.companies) ? null : (data.companies as { name: string } | null),
    contacts: Array.isArray(data.contacts) ? null : (data.contacts as { full_name: string | null } | null),
    pipelines: Array.isArray(data.pipelines) ? null : (data.pipelines as { id: string; name: string } | null),
    pipeline_stages: Array.isArray(data.pipeline_stages) ? null : (data.pipeline_stages as { id: string; name: string; position: number } | null),
  };
  return mapDealRow(row, embed, owners);
}

/** Stages for the pipeline board, ordered by position. */
export async function getPipelineStages(pipelineId?: string): Promise<Pipeline> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return { id: "", name: "Main Sales Pipeline", stages: [], isDefault: true };

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id, name, description, is_default")
    .eq("organization_id", organizationId)
    .order("is_default", { ascending: false })
    .maybeSingle();

  const pid = pipelineId ?? pipeline?.id;
  if (!pid) return { id: "", name: "Main Sales Pipeline", stages: [], isDefault: true };

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("id, pipeline_id, name, position, default_probability, color, stage_type")
    .eq("pipeline_id", pid)
    .eq("organization_id", organizationId)
    .order("position", { ascending: true });

  return {
    id: pipeline?.id ?? pid,
    name: pipeline?.name ?? "Main Sales Pipeline",
    description: pipeline?.description ?? undefined,
    isDefault: pipeline?.is_default ?? false,
    stages: (stages ?? []).map((s) => ({
      id: s.id,
      pipelineId: s.pipeline_id,
      name: s.name,
      order: s.position,
      defaultProbability: s.default_probability,
      color: s.color,
      type: s.stage_type as PipelineStage["type"],
    })),
  };
}

export interface DealCreateInput {
  name: string;
  companyId?: string;
  primaryContactId?: string;
  pipelineId?: string;
  stageId?: string;
  value?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  ownerId?: string;
  source?: string;
  description?: string;
}

export async function createDeal(input: DealCreateInput): Promise<DealRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = getOrgIdOrThrow(await getActiveOrgId(supabase));
  const { data: userData } = await supabase.auth.getUser();

  // Resolve default pipeline + first open stage when not provided.
  let stageId = input.stageId;
  let pipelineId = input.pipelineId;
  let defaultProbability = input.probability ?? 0;

  if (!stageId || !pipelineId) {
    const { data: pipe } = await supabase
      .from("pipelines")
      .select("id")
      .eq("organization_id", organizationId)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();
    pipelineId = pipe?.id ?? null;
    if (pipelineId) {
      const { data: st } = await supabase
        .from("pipeline_stages")
        .select("id, default_probability")
        .eq("pipeline_id", pipelineId)
        .eq("stage_type", "open")
        .order("position")
        .limit(1)
        .maybeSingle();
      stageId = st?.id ?? null;
      defaultProbability = st?.default_probability ?? input.probability ?? 0;
    }
  }

  const prob = defaultProbability;
  const value = input.value ?? 0;

  const { data } = await supabase
    .from("deals")
    .insert({
      organization_id: organizationId,
      name: input.name,
      company_id: input.companyId ?? null,
      primary_contact_id: input.primaryContactId ?? null,
      pipeline_id: pipelineId,
      stage_id: stageId,
      value,
      currency: input.currency ?? "PKR",
      probability: prob,
      expected_revenue: Math.round(value * prob) / 100,
      expected_close_date: input.expectedCloseDate ?? null,
      owner_id: input.ownerId ?? userData.user?.id ?? null,
      source: input.source ?? "Manual",
      description: input.description ?? null,
      created_by: userData.user?.id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!data) return null;
  return getDealById(data.id);
}

/** Move a deal between stages (atomic RPC, Step 56). */
export async function moveDealStage(id: string, stageId: string, applyProbability = true): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("move_deal_stage", {
    p_deal_id: id,
    p_stage_id: stageId,
    p_apply_probability: applyProbability,
  });
  if (error) {
    console.error("[deals] moveDealStage failed", error.message);
    return false;
  }
  return true;
}

export interface DealUpdateInput {
  id: string;
  name?: string;
  stageId?: string;
  value?: number;
  currency?: string;
  probability?: number;
  expectedCloseDate?: string;
  ownerId?: string;
  source?: string;
  description?: string;
}

/** Update an existing deal. Returns the updated DealRecord, or null. */
export async function updateDeal(input: DealUpdateInput): Promise<DealRecord | null> {
  const supabase = await createSupabaseServerClient();
  const organizationId = getOrgIdOrThrow(await getActiveOrgId(supabase));

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  let probability = input.probability;
  if (input.value !== undefined || input.probability !== undefined || input.stageId !== undefined) {
    if (probability === undefined) {
      if (input.stageId !== undefined) {
        const { data: stage } = await supabase
          .from("pipeline_stages")
          .select("default_probability")
          .eq("id", input.stageId)
          .maybeSingle();
        probability = stage?.default_probability ?? 0;
      } else {
        const { data: current } = await supabase
          .from("deals")
          .select("probability")
          .eq("id", input.id)
          .eq("organization_id", organizationId)
          .maybeSingle();
        probability = current?.probability ?? 0;
      }
    }
    patch.probability = probability;
    if (input.value !== undefined) {
      const finalProbability = probability ?? 0;
      patch.value = input.value;
      patch.expected_revenue = Math.round(input.value * finalProbability) / 100;
    }
  }
  if (input.name !== undefined) patch.name = input.name;
  if (input.stageId !== undefined) patch.stage_id = input.stageId;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.expectedCloseDate !== undefined) patch.expected_close_date = input.expectedCloseDate || null;
  if (input.ownerId !== undefined) patch.owner_id = input.ownerId || null;
  if (input.source !== undefined) patch.source = input.source;
  if (input.description !== undefined) patch.description = input.description;

  const { data } = await supabase
    .from("deals")
    .update(patch)
    .eq("id", input.id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (!data) return null;
  return getDealById(data.id);
}

export async function archiveDeal(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const organizationId = getOrgIdOrThrow(await getActiveOrgId(supabase));
  const { error } = await supabase
    .from("deals")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId);
  return !error;
}