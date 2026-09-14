import "server-only";

import { getActiveOrgId, toIso } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface ActivityInput {
  activityType: string;
  relatedType?: string;
  relatedId?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  leadId?: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

export interface ActivityRow {
  id: string;
  activityType: string;
  title: string;
  detail?: string;
  at: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Insert an activity event. Prefer this over raw inserts so the unified
 * timeline stays consistent (Steps 61–62).
 */
export async function logActivity(input: ActivityInput) {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("activities")
    .insert({
      organization_id: organizationId,
      activity_type: input.activityType,
      related_type: input.relatedType ?? null,
      related_id: input.relatedId ?? null,
      contact_id: input.contactId ?? null,
      company_id: input.companyId ?? null,
      deal_id: input.dealId ?? null,
      lead_id: input.leadId ?? null,
      actor_user_id: user?.id ?? null,
      title: input.title,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[activity] logActivity failed", error.message);
    return null;
  }
  return data;
}

/**
 * Fetch the unified activity timeline for a record, newest first.
 */
export async function getActivitiesForRecord(
  type: string,
  id: string,
  limit = 30,
): Promise<ActivityRow[]> {
  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);
  if (!organizationId) return [];

  const { data } = await supabase
    .from("activities")
    .select("id, activity_type, title, description, metadata, occurred_at, actor_user_id")
    .eq("related_type", type)
    .eq("related_id", id)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    activityType: row.activity_type,
    title: row.title,
    detail: row.description ?? undefined,
    at: toIso(row.occurred_at),
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
  }));
}

/** Guard used by optional modules. */
export function isActivityEnabled(): boolean {
  return isSupabaseConfigured();
}