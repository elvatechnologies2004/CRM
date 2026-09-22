import "server-only";

import { getActiveOrgId } from "@/lib/crm/base";
import { canAccessRecord, getSalesAccessScope } from "@/lib/crm/scope";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DealCloseOutcome = "won" | "lost";

export interface DealCloseRequestItem {
  id: string;
  dealId: string;
  dealName: string;
  requestedOutcome: DealCloseOutcome;
  currentStage: string;
  requestedByName: string;
  ownerName: string;
  customerName: string;
  companyName?: string;
  finalValue?: number;
  closeDate?: string;
  lostReason?: string;
  notes?: string;
  competitor?: string;
  requestedAt?: string;
  reason?: string;
}

interface DealCloseRequestLookup {
  id: string;
  organization_id: string;
  deal_id: string;
  requested_outcome: DealCloseOutcome;
  status: string;
  requested_by: string | null;
  requested_at: string | null;
  final_value: number | null;
  close_date: string | null;
  lost_reason: string | null;
  competitor: string | null;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

function normalizeOutcome(outcome: DealCloseOutcome | string): DealCloseOutcome {
  return outcome === "lost" ? "lost" : "won";
}

async function resolveStageName(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  orgId: string,
  stageId: string | null,
): Promise<string | null> {
  if (!stageId) return null;
  const { data } = await supabase
    .from("pipeline_stages")
    .select("name")
    .eq("organization_id", orgId)
    .eq("id", stageId)
    .maybeSingle();
  return (data?.name as string | null) ?? null;
}

async function ensureDealVisible(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  orgId: string,
  dealId: string,
) {
  const scope = await getSalesAccessScope();
  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, stage_id, value, owner_id, created_by, won_at, lost_at")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) {
    return { deal: null as null | any, scope, ok: false as const, error: "Opportunity not found." };
  }

  if (scope && !canAccessRecord(scope, deal)) {
    return { deal: null as null | any, scope, ok: false as const, error: "Opportunity not found or access denied." };
  }

  return { deal, scope, ok: true as const, error: null };
}

export async function getPendingDealCloseRequests(): Promise<{ items: DealCloseRequestItem[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);
  if (!orgId) return { items: [], error: "No active organization" };

  const scope = await getSalesAccessScope();
  if (!scope || scope.role !== "head_of_sales") {
    return { items: [], error: null };
  }

  const { data, error } = await supabase
    .from("deal_close_requests")
    .select("id, deal_id, requested_outcome, status, requested_by, requested_at, final_value, close_date, lost_reason, competitor, notes, reviewed_by, reviewed_at, rejection_reason, deals(id, name, stage_id, value, owner_id, created_by, companies(name), contacts(full_name), pipeline_stages(name))")
    .eq("organization_id", orgId)
    .eq("status", "pending_head_approval")
    .order("requested_at", { ascending: false });

  if (error) {
    return { items: [], error: error.message };
  }

  const owners = await (async () => {
    const { data: members } = await supabase.from("organization_members").select("user_id, profiles(full_name)").eq("organization_id", orgId).eq("status", "active");
    const map: Record<string, string> = {};
    for (const row of members ?? []) {
      const profile = Array.isArray(row.profiles) ? null : (row.profiles as { full_name?: string | null } | null);
      if (row.user_id) map[row.user_id as string] = profile?.full_name || "Unknown";
    }
    return map;
  })();

  const items: DealCloseRequestItem[] = (data ?? []).map((row) => {
    const deal = Array.isArray(row.deals) ? null : (row.deals as any | null);
    const customer = Array.isArray(deal?.contacts) ? null : (deal?.contacts as { full_name?: string | null } | null);
    const company = Array.isArray(deal?.companies) ? null : (deal?.companies as { name?: string | null } | null);
    const stage = Array.isArray(deal?.pipeline_stages) ? null : (deal?.pipeline_stages as { name?: string | null } | null);
    return {
      id: row.id,
      dealId: row.deal_id,
      dealName: deal?.name ?? "Opportunity",
      requestedOutcome: normalizeOutcome(row.requested_outcome),
      currentStage: stage?.name ?? "Negotiation",
      requestedByName: owners[row.requested_by as string] ?? "—",
      ownerName: owners[deal?.owner_id as string] ?? "—",
      customerName: customer?.full_name ?? "—",
      companyName: company?.name ?? undefined,
      finalValue: row.final_value ?? undefined,
      closeDate: row.close_date ?? undefined,
      lostReason: row.lost_reason ?? undefined,
      notes: row.notes ?? undefined,
      competitor: row.competitor ?? undefined,
      requestedAt: row.requested_at ?? undefined,
      reason: row.rejection_reason ?? undefined,
    };
  });

  return { items, error: null };
}

export async function requestDealCloseApproval(input: {
  dealId: string;
  outcome: DealCloseOutcome;
  finalValue?: number | null;
  closeDate?: string | null;
  lostReason?: string | null;
  competitor?: string | null;
  notes?: string | null;
}): Promise<{ ok: boolean; error?: string; message?: string; requestId?: string }> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    return { ok: false, error: "No active organization found.", message: "No active organization found." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated.", message: "Not authenticated." };
  }

  const validation = await ensureDealVisible(supabase, orgId, input.dealId);
  if (!validation.ok || !validation.deal) {
    return { ok: false, error: validation.error ?? "Opportunity not found.", message: validation.error ?? "Opportunity not found." };
  }

  const currentStageName = await resolveStageName(supabase, orgId, validation.deal.stage_id);
  if (!currentStageName || !currentStageName.toLowerCase().includes("negotiation")) {
    return { ok: false, error: "Opportunity is not in Negotiation stage.", message: "Opportunity is not in Negotiation stage." };
  }

  if (validation.deal.won_at || validation.deal.lost_at) {
    return { ok: false, error: "This opportunity has already been closed.", message: "This opportunity has already been closed." };
  }

  const normalizedOutcome = normalizeOutcome(input.outcome);
  if (normalizedOutcome === "won") {
    const finalValue = Number(input.finalValue ?? 0);
    const closeDate = input.closeDate ? new Date(input.closeDate) : null;
    if (!Number.isFinite(finalValue) || finalValue <= 0 || !closeDate || Number.isNaN(closeDate.getTime())) {
      return { ok: false, error: "Valid final value and close date are required.", message: "Valid final value and close date are required." };
    }
  } else {
    if (!input.lostReason?.trim()) {
      return { ok: false, error: "Lost Reason Required.", message: "Please select a reason before requesting a closed-lost approval." };
    }
    const closeDate = input.closeDate ? new Date(input.closeDate) : null;
    if (!closeDate || Number.isNaN(closeDate.getTime())) {
      return { ok: false, error: "Close date is invalid.", message: "Close date is invalid." };
    }
  }

  const { data: existingPending } = await supabase
    .from("deal_close_requests")
    .select("id, status")
    .eq("organization_id", orgId)
    .eq("deal_id", input.dealId)
    .eq("status", "pending_head_approval")
    .maybeSingle();

  if (existingPending) {
    return {
      ok: true,
      requestId: existingPending.id,
      message: normalizedOutcome === "won"
        ? "A Closed Won approval request is already pending Head review."
        : "A Closed Lost approval request is already pending Head review.",
    };
  }

  const now = new Date().toISOString();
  const closeDateIso = input.closeDate ? new Date(input.closeDate).toISOString() : null;
  const { data: request, error: requestError } = await supabase
    .from("deal_close_requests")
    .insert({
      organization_id: orgId,
      deal_id: input.dealId,
      requested_outcome: normalizedOutcome,
      requested_by: user.id,
      requested_at: now,
      status: "pending_head_approval",
      final_value: normalizedOutcome === "won" ? Number(input.finalValue ?? 0) : (input.finalValue ?? null),
      close_date: closeDateIso,
      lost_reason: normalizedOutcome === "lost" ? (input.lostReason ?? null) : null,
      competitor: normalizedOutcome === "lost" ? (input.competitor ?? null) : null,
      notes: input.notes ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (requestError || !request) {
    return { ok: false, error: requestError?.message ?? "Unable to create close approval request.", message: requestError?.message ?? "Unable to create close approval request." };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: normalizedOutcome === "won" ? "opportunity_close_won_requested" : "opportunity_close_lost_requested",
    related_type: "deal",
    related_id: input.dealId,
    actor_user_id: user.id,
    deal_id: input.dealId,
    title: normalizedOutcome === "won" ? "Closed Won approval requested" : "Closed Lost approval requested",
    description: normalizedOutcome === "won"
      ? `Head of Sales approval requested for a Closed Won outcome.`
      : `Head of Sales approval requested for a Closed Lost outcome.`,
    metadata: {
      deal_id: input.dealId,
      requested_outcome: normalizedOutcome,
      final_value: normalizedOutcome === "won" ? Number(input.finalValue ?? 0) : input.finalValue ?? null,
      close_date: closeDateIso,
      lost_reason: input.lostReason ?? null,
      competitor: input.competitor ?? null,
      notes: input.notes ?? null,
    },
    occurred_at: now,
  });

  return {
    ok: true,
    requestId: request.id,
    message: normalizedOutcome === "won"
      ? "Closed Won approval requested. Awaiting Head of Sales approval."
      : "Closed Lost approval requested. Awaiting Head of Sales approval.",
  };
}

export async function approveDealCloseRequest(requestId: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    return { ok: false, error: "No active organization found.", message: "No active organization found." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated.", message: "Not authenticated." };
  }

  const scope = await getSalesAccessScope();
  if (!scope || scope.role !== "head_of_sales") {
    return { ok: false, error: "Only the Head of Sales can approve close requests.", message: "Only the Head of Sales can approve close requests." };
  }

  const { data: request, error: requestError } = await supabase
    .from("deal_close_requests")
    .select("id, organization_id, deal_id, requested_outcome, status, final_value, close_date, lost_reason, competitor, notes")
    .eq("id", requestId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (requestError || !request) {
    return { ok: false, error: "Close request not found.", message: "Close request not found." };
  }

  if (request.status !== "pending_head_approval") {
    return { ok: false, error: "This close request is no longer pending Head approval.", message: "This close request is no longer pending Head approval." };
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, pipeline_id, stage_id, value, won_at, lost_at, owner_id, created_by")
    .eq("id", request.deal_id)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) {
    return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };
  }

  if (deal.won_at || deal.lost_at) {
    return { ok: false, error: "This opportunity has already been closed.", message: "This opportunity has already been closed." };
  }

  const outcome = normalizeOutcome(request.requested_outcome);
  let { data: targetStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("pipeline_id", deal.pipeline_id)
    .ilike("name", outcome === "won" ? "%closed won%" : "%closed lost%")
    .maybeSingle();

  if (!targetStage) {
    const { data: maxStage } = await supabase
      .from("pipeline_stages")
      .select("position")
      .eq("organization_id", orgId)
      .eq("pipeline_id", deal.pipeline_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: insertedStage } = await supabase
      .from("pipeline_stages")
      .insert({
        organization_id: orgId,
        pipeline_id: deal.pipeline_id,
        name: outcome === "won" ? "Closed Won" : "Closed Lost",
        position: Number(maxStage?.position ?? 0) + 1,
        default_probability: outcome === "won" ? 100 : 0,
        color: outcome === "won" ? "#15803d" : "#dc2626",
        stage_type: outcome === "won" ? "won" : "lost",
      })
      .select("id, name")
      .single();
    targetStage = insertedStage ?? null;
  }

  if (!targetStage) {
    return { ok: false, error: `Unable to resolve ${outcome === "won" ? "Closed Won" : "Closed Lost"} stage.`, message: `Unable to resolve ${outcome === "won" ? "Closed Won" : "Closed Lost"} stage.` };
  }

  const closeDate = request.close_date ? new Date(request.close_date) : new Date();
  const finalValue = typeof request.final_value === "number" ? request.final_value : Number(deal.value ?? 0);

  const { error: updateDealError } = await supabase
    .from("deals")
    .update({
      stage_id: targetStage.id,
      value: finalValue,
      won_at: outcome === "won" ? closeDate.toISOString() : null,
      lost_at: outcome === "lost" ? closeDate.toISOString() : null,
      lost_reason: outcome === "lost" ? (request.lost_reason ?? null) : null,
      competitor: outcome === "lost" ? (request.competitor ?? null) : null,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", request.deal_id)
    .eq("organization_id", orgId)
    .eq("won_at", null)
    .eq("lost_at", null);

  if (updateDealError) {
    return { ok: false, error: updateDealError.message, message: updateDealError.message };
  }

  const { error: updateRequestError } = await supabase
    .from("deal_close_requests")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", requestId)
    .eq("organization_id", orgId)
    .eq("status", "pending_head_approval");

  if (updateRequestError) {
    return { ok: false, error: updateRequestError.message, message: updateRequestError.message };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: outcome === "won" ? "opportunity_close_won_approved" : "opportunity_close_lost_approved",
    related_type: "deal",
    related_id: request.deal_id,
    actor_user_id: user.id,
    deal_id: request.deal_id,
    title: outcome === "won" ? "Closed Won approved by Head of Sales" : "Closed Lost approved by Head of Sales",
    description: outcome === "won"
      ? `Head of Sales approved the Closed Won request for ${finalValue}.`
      : `Head of Sales approved the Closed Lost request for ${request.lost_reason ?? "close"}.`,
    metadata: {
      request_id: requestId,
      final_value: finalValue,
      close_date: closeDate.toISOString().slice(0, 10),
      requested_outcome: outcome,
      lost_reason: request.lost_reason ?? null,
    },
    occurred_at: new Date().toISOString(),
  });

  return {
    ok: true,
    message: outcome === "won" ? "Closed Won was approved by the Head of Sales." : "Closed Lost was approved by the Head of Sales.",
  };
}

export async function rejectDealCloseRequest(requestId: string, reason: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    return { ok: false, error: "No active organization found.", message: "No active organization found." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated.", message: "Not authenticated." };
  }

  const scope = await getSalesAccessScope();
  if (!scope || scope.role !== "head_of_sales") {
    return { ok: false, error: "Only the Head of Sales can reject close requests.", message: "Only the Head of Sales can reject close requests." };
  }

  const trimmedReason = (reason ?? "").trim();
  if (!trimmedReason) {
    return { ok: false, error: "A reason is required to reject the close request.", message: "A reason is required to reject the close request." };
  }

  const { data: request } = await supabase
    .from("deal_close_requests")
    .select("id, organization_id, deal_id, requested_outcome, status")
    .eq("id", requestId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!request) {
    return { ok: false, error: "Close request not found.", message: "Close request not found." };
  }

  if (request.status !== "pending_head_approval") {
    return { ok: false, error: "This close request is no longer pending Head approval.", message: "This close request is no longer pending Head approval." };
  }

  const { error: updateError } = await supabase
    .from("deal_close_requests")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: trimmedReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("organization_id", orgId)
    .eq("status", "pending_head_approval");

  if (updateError) {
    return { ok: false, error: updateError.message, message: updateError.message };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: request.requested_outcome === "won" ? "opportunity_close_won_returned" : "opportunity_close_lost_returned",
    related_type: "deal",
    related_id: request.deal_id,
    actor_user_id: user.id,
    deal_id: request.deal_id,
    title: request.requested_outcome === "won" ? "Closed Won request returned" : "Closed Lost request returned",
    description: trimmedReason,
    metadata: {
      request_id: requestId,
      rejection_reason: trimmedReason,
      requested_outcome: request.requested_outcome,
    },
    occurred_at: new Date().toISOString(),
  });

  return {
    ok: true,
    message: "Close request returned for revision.",
  };
}
