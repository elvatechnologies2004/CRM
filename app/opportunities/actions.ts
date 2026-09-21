"use server";

import { revalidatePath } from "next/cache";

import { getActiveOrgId } from "@/lib/crm/base";
import { can } from "@/lib/crm/context";
import { permanentlyDeleteOpportunity } from "@/lib/crm/permanent-delete";
import { assertDealAccess, canAccessRecord, getSalesAccessScope } from "@/lib/crm/scope";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toIsoDateTime(date: string, time: string) {
  const value = `${date}T${time}:00`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid meeting date/time.");
  }
  return parsed.toISOString();
}

export async function createOpportunityMeetingAction(
  dealId: string,
  input: {
    leadId?: string | null;
    customerName?: string | null;
    companyName?: string | null;
    ownerId?: string | null;
    meetingDate: string;
    meetingTime: string;
    durationMinutes: number;
    meetingType: string;
    agenda?: string | null;
    notes?: string | null;
  }
): Promise<{ ok: boolean; meetingId?: string; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated.", message: "Not authenticated." };
  }

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    return { ok: false, error: "No active organization found.", message: "No active organization found." };
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, pipeline_id, owner_id, created_by, company_id, primary_contact_id")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) {
    return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };
  }

  // Phase 2 — scope check before any deal-scoped mutation.
  const salesScope = await getSalesAccessScope();
  if (salesScope && !canAccessRecord(salesScope, deal)) {
    return { ok: false, error: "Opportunity not found or access denied.", message: "Opportunity not found or access denied." };
  }

  if (!input.meetingDate || !input.meetingTime) {
    return { ok: false, error: "Meeting date and time are required.", message: "Meeting date and time are required." };
  }

  const durationMinutes = Math.max(15, Math.round(Number(input.durationMinutes || 30)));
  const startAt = toIsoDateTime(input.meetingDate, input.meetingTime);
  const endAt = new Date(new Date(startAt).getTime() + durationMinutes * 60000).toISOString();

  const { data: existingMeeting } = await supabase
    .from("meetings")
    .select("id")
    .eq("organization_id", orgId)
    .eq("related_type", "deal")
    .eq("related_id", dealId)
    .in("status", ["scheduled", "in_progress"])
    .limit(1)
    .maybeSingle();

  if (existingMeeting) {
    return {
      ok: false,
      error: "A scheduled meeting already exists for this opportunity.",
      message: "A scheduled meeting already exists for this opportunity.",
    };
  }

  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({
      organization_id: orgId,
      title: `${deal.name} — ${input.meetingType || "Meeting"}`,
      meeting_type: input.meetingType || "Discovery",
      start_at: startAt,
      end_at: endAt,
      owner_id: input.ownerId || deal.owner_id || user.id,
      related_type: "deal",
      related_id: dealId,
      status: "scheduled",
      notes: input.agenda || input.notes || null,
      outcome: null,
      created_by: user.id,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !meeting) {
    return { ok: false, error: error?.message ?? "Unable to create meeting.", message: error?.message ?? "Unable to create meeting." };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "meeting_scheduled",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    lead_id: input.leadId ?? null,
    title: "Meeting scheduled",
    description: `Meeting scheduled for ${input.customerName || deal.name} (${input.meetingType || "Meeting"}).`,
    metadata: {
      meeting_id: meeting.id,
      meeting_type: input.meetingType || "Discovery",
      date: input.meetingDate,
      time: input.meetingTime,
      duration_minutes: durationMinutes,
    },
    occurred_at: new Date().toISOString(),
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  return { ok: true, meetingId: meeting.id, message: "Meeting scheduled successfully." };
}

export async function createOpportunityFollowUpAction(
  dealId: string,
  input: {
    leadId?: string | null;
    customerName?: string | null;
    companyName?: string | null;
    ownerId?: string | null;
    proposalTitle?: string | null;
    proposalSentDate?: string | null;
    proposalTotal?: number | null;
    method: string;
    followUpDate: string;
    followUpTime?: string | null;
    response: string;
    notes?: string | null;
    nextFollowUpDate?: string | null;
  }
): Promise<{ ok: boolean; taskId?: string; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated.", message: "Not authenticated." };
  }

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    return { ok: false, error: "No active organization found.", message: "No active organization found." };
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, owner_id, created_by, pipeline_id, stage_id")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) {
    return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };
  }

  // Phase 2 — scope check before any deal-scoped mutation.
  const salesScope = await getSalesAccessScope();
  if (salesScope && !canAccessRecord(salesScope, deal)) {
    return { ok: false, error: "Opportunity not found or access denied.", message: "Opportunity not found or access denied." };
  }

  if (!input.method || !input.followUpDate || !input.response) {
    return {
      ok: false,
      error: "Follow-up method, date, and response are required.",
      message: "Follow-up method, date, and response are required.",
    };
  }

  const dueAt = input.followUpTime ? new Date(`${input.followUpDate}T${input.followUpTime}:00`).toISOString() : new Date(`${input.followUpDate}T09:00:00`).toISOString();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      organization_id: orgId,
      title: `Follow-up: ${input.customerName || deal.name}`,
      description: [
        `Method: ${input.method}`,
        `Customer response: ${input.response}`,
        input.notes ? `Notes: ${input.notes}` : null,
      ].filter(Boolean).join("\n"),
      type: "Follow-up",
      priority: input.response === "Not Interested" ? "High" : input.response === "Price Discussion" ? "Urgent" : "Medium",
      status: "Open",
      owner_id: input.ownerId || deal.owner_id || user.id,
      due_at: dueAt,
      related_type: "deal",
      related_id: dealId,
      created_by: user.id,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (taskError || !task) {
    return { ok: false, error: taskError?.message ?? "Unable to save follow-up.", message: taskError?.message ?? "Unable to save follow-up." };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "follow_up_recorded",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    lead_id: input.leadId ?? null,
    title: "Follow-Up recorded",
    description: `${input.method} follow-up recorded. Customer response: ${input.response}${input.notes ? ` — ${input.notes}` : ""}`,
    metadata: {
      method: input.method,
      customer_response: input.response,
      notes: input.notes ?? null,
      follow_up_date: input.followUpDate,
      follow_up_time: input.followUpTime ?? null,
      next_follow_up_date: input.nextFollowUpDate ?? null,
      proposal_title: input.proposalTitle ?? null,
      proposal_sent_date: input.proposalSentDate ?? null,
      proposal_total: input.proposalTotal ?? null,
    },
    occurred_at: new Date().toISOString(),
  });

  if (input.nextFollowUpDate) {
    await supabase.from("tasks").insert({
      organization_id: orgId,
      title: `Follow-up reminder: ${input.customerName || deal.name}`,
      description: `Next follow-up scheduled for ${input.nextFollowUpDate}. Response: ${input.response}`,
      type: "Follow-up",
      priority: "Medium",
      status: "Open",
      owner_id: input.ownerId || deal.owner_id || user.id,
      due_at: new Date(`${input.nextFollowUpDate}T09:00:00`).toISOString(),
      related_type: "deal",
      related_id: dealId,
      created_by: user.id,
      created_at: new Date().toISOString(),
    });
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  return { ok: true, taskId: task.id, message: "Follow-up recorded successfully." };
}

export async function approveOpportunityNegotiationAction(
  dealId: string,
  input?: { followUpTaskId?: string | null }
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated.", message: "Not authenticated." };
  }

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    return { ok: false, error: "No active organization found.", message: "No active organization found." };
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, pipeline_id, stage_id, owner_id, created_by")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) {
    return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };
  }

  // Phase 2 — scope check before any deal-scoped mutation.
  const salesScope = await getSalesAccessScope();
  if (salesScope && !canAccessRecord(salesScope, deal)) {
    return { ok: false, error: "Opportunity not found or access denied.", message: "Opportunity not found or access denied." };
  }

  const { data: currentStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("id", deal.stage_id ?? "")
    .maybeSingle();

  if (!currentStage || !currentStage.name || !currentStage.name.toLowerCase().includes("proposal submitted")) {
    return { ok: false, error: "Opportunity is not in Proposal Submitted stage.", message: "Opportunity is not in Proposal Submitted stage." };
  }

  if (input?.followUpTaskId) {
    const { data: followUpTask } = await supabase
      .from("tasks")
      .select("id")
      .eq("organization_id", orgId)
      .eq("id", input.followUpTaskId)
      .eq("related_type", "deal")
      .eq("related_id", dealId)
      .eq("type", "Follow-up")
      .maybeSingle();

    if (!followUpTask) {
      return { ok: false, error: "Follow-up record not found.", message: "Follow-up record not found." };
    }
  }

  let { data: negotiationStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("pipeline_id", deal.pipeline_id)
    .ilike("name", "%Negotiation%")
    .maybeSingle();

  if (!negotiationStage) {
    const { data: maxStage } = await supabase
      .from("pipeline_stages")
      .select("position")
      .eq("organization_id", orgId)
      .eq("pipeline_id", deal.pipeline_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = Number(maxStage?.position ?? 0) + 1;
    const { data: insertedStage } = await supabase
      .from("pipeline_stages")
      .insert({
        organization_id: orgId,
        pipeline_id: deal.pipeline_id,
        name: "Negotiation",
        position: nextPosition,
        default_probability: 65,
        color: "#f59e0b",
        stage_type: "open",
      })
      .select("id, name")
      .single();

    negotiationStage = insertedStage ?? null;
  }

  if (!negotiationStage) {
    return { ok: false, error: "Unable to resolve Negotiation stage.", message: "Unable to resolve Negotiation stage." };
  }

  const { error: stageError } = await supabase
    .from("deals")
    .update({
      stage_id: negotiationStage.id,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", dealId)
    .eq("organization_id", orgId);

  if (stageError) {
    return { ok: false, error: stageError.message, message: stageError.message };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "deal_stage_changed",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    title: "Opportunity moved to Negotiation",
    description: "The customer response indicates active negotiation and the opportunity advanced to Negotiation.",
    metadata: {
      from_stage: currentStage.id,
      to_stage: negotiationStage.id,
      follow_up_task_id: input?.followUpTaskId ?? null,
    },
    occurred_at: new Date().toISOString(),
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  return { ok: true, message: "Opportunity moved to Negotiation." };
}

export async function recordOpportunityNegotiationAction(
  dealId: string,
  input: {
    negotiationType: string;
    customerRequest: string;
    ourResponse?: string | null;
    proposedValue?: number | null;
    requestedDiscount?: number | null;
    competitor?: string | null;
    decisionStatus: string;
    notes?: string | null;
    nextFollowUpDate?: string | null;
  }
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated.", message: "Not authenticated." };

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) return { ok: false, error: "No active organization found.", message: "No active organization found." };

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, pipeline_id, stage_id, value, owner_id, created_by")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };

  // Phase 2 — scope check before any deal-scoped mutation.
  const salesScope = await getSalesAccessScope();
  if (salesScope && !canAccessRecord(salesScope, deal)) {
    return { ok: false, error: "Opportunity not found or access denied.", message: "Opportunity not found or access denied." };
  }

  const { data: currentStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("id", deal.stage_id ?? "")
    .maybeSingle();

  if (!currentStage || !currentStage.name || !currentStage.name.toLowerCase().includes("negotiation")) {
    return { ok: false, error: "Opportunity is not in Negotiation stage.", message: "Opportunity is not in Negotiation stage." };
  }

  if (!input.negotiationType || !input.customerRequest || !input.decisionStatus) {
    return {
      ok: false,
      error: "Negotiation type, customer request, and decision status are required.",
      message: "Negotiation type, customer request, and decision status are required.",
    };
  }

  const summary = [
    `Negotiation type: ${input.negotiationType}`,
    `Customer request: ${input.customerRequest}`,
    input.ourResponse ? `Our response: ${input.ourResponse}` : null,
    input.decisionStatus ? `Decision status: ${input.decisionStatus}` : null,
    input.competitor ? `Competitor: ${input.competitor}` : null,
    input.nextFollowUpDate ? `Next follow-up: ${input.nextFollowUpDate}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
  ].filter(Boolean).join("; ");

  const { error: activityError } = await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "negotiation_activity_recorded",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    title: "Negotiation Activity Recorded",
    description: summary,
    metadata: {
      negotiation_type: input.negotiationType,
      customer_request: input.customerRequest,
      our_response: input.ourResponse ?? null,
      proposed_value: input.proposedValue ?? null,
      requested_discount: input.requestedDiscount ?? null,
      competitor: input.competitor ?? null,
      decision_status: input.decisionStatus,
      notes: input.notes ?? null,
      next_follow_up_date: input.nextFollowUpDate ?? null,
    },
    occurred_at: new Date().toISOString(),
  });

  if (activityError) {
    return { ok: false, error: activityError.message, message: activityError.message };
  }

  await supabase
    .from("deals")
    .update({
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", dealId)
    .eq("organization_id", orgId);

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  return { ok: true, message: "Negotiation activity recorded successfully." };
}

export async function closeOpportunityWonAction(
  dealId: string,
  input: {
    finalValue: number;
    closeDate: string;
    closingNotes?: string | null;
    customerDecision?: string | null;
  }
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated.", message: "Not authenticated." };

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) return { ok: false, error: "No active organization found.", message: "No active organization found." };

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, pipeline_id, stage_id, value, owner_id, created_by")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };

  // Phase 2 — scope check before any deal-scoped mutation.
  const salesScope = await getSalesAccessScope();
  if (salesScope && !canAccessRecord(salesScope, deal)) {
    return { ok: false, error: "Opportunity not found or access denied.", message: "Opportunity not found or access denied." };
  }

  const { data: currentStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("id", deal.stage_id ?? "")
    .maybeSingle();

  if (!currentStage || !currentStage.name || !currentStage.name.toLowerCase().includes("negotiation")) {
    return { ok: false, error: "Opportunity is not in Negotiation stage.", message: "Opportunity is not in Negotiation stage." };
  }

  const finalValue = Number(input.finalValue ?? 0);
  const closeDate = input.closeDate ? new Date(input.closeDate) : null;
  if (!Number.isFinite(finalValue) || finalValue <= 0 || !closeDate || Number.isNaN(closeDate.getTime())) {
    return { ok: false, error: "Valid final value and close date are required.", message: "Valid final value and close date are required." };
  }

  let { data: wonStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("pipeline_id", deal.pipeline_id)
    .ilike("name", "%closed won%")
    .maybeSingle();

  if (!wonStage) {
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
        name: "Closed Won",
        position: Number(maxStage?.position ?? 0) + 1,
        default_probability: 100,
        color: "#15803d",
        stage_type: "won",
      })
      .select("id, name")
      .single();
    wonStage = insertedStage ?? null;
  }

  if (!wonStage) {
    return { ok: false, error: "Unable to resolve Closed Won stage.", message: "Unable to resolve Closed Won stage." };
  }

  const { error: updateError } = await supabase
    .from("deals")
    .update({
      value: finalValue,
      stage_id: wonStage.id,
      won_at: closeDate.toISOString(),
      lost_at: null,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", dealId)
    .eq("organization_id", orgId);

  if (updateError) {
    return { ok: false, error: updateError.message, message: updateError.message };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "opportunity_closed_won",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    title: "Opportunity Closed Won",
    description: `Opportunity won for ${finalValue}. Close date: ${closeDate.toISOString().slice(0, 10)}${input.customerDecision ? ` — ${input.customerDecision}` : ""}${input.closingNotes ? ` — ${input.closingNotes}` : ""}`,
    metadata: {
      final_value: finalValue,
      close_date: closeDate.toISOString().slice(0, 10),
      customer_decision: input.customerDecision ?? null,
      closing_notes: input.closingNotes ?? null,
    },
    occurred_at: new Date().toISOString(),
  });

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "deal_stage_changed",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    title: "Opportunity moved to Closed Won",
    description: "The opportunity was successfully closed as won.",
    metadata: {
      from_stage: currentStage.id,
      to_stage: wonStage.id,
      final_value: finalValue,
      close_date: closeDate.toISOString().slice(0, 10),
    },
    occurred_at: new Date().toISOString(),
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  return { ok: true, message: "Opportunity closed as won successfully." };
}

export async function closeOpportunityLostAction(
  dealId: string,
  input: {
    lostReason: string;
    competitor?: string | null;
    otherReason?: string | null;
    closeDate: string;
    finalValue?: number | null;
    closingNotes?: string | null;
  }
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated.", message: "Not authenticated." };

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) return { ok: false, error: "No active organization found.", message: "No active organization found." };

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, pipeline_id, stage_id, value, owner_id, created_by")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };

  // Phase 2 — scope check before any deal-scoped mutation.
  const salesScope = await getSalesAccessScope();
  if (salesScope && !canAccessRecord(salesScope, deal)) {
    return { ok: false, error: "Opportunity not found or access denied.", message: "Opportunity not found or access denied." };
  }

  const { data: currentStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("id", deal.stage_id ?? "")
    .maybeSingle();

  if (!currentStage || !currentStage.name || !currentStage.name.toLowerCase().includes("negotiation")) {
    return { ok: false, error: "Opportunity is not in Negotiation stage.", message: "Opportunity is not in Negotiation stage." };
  }

  if (!input.lostReason) {
    return { ok: false, error: "Lost Reason Required", message: "Please select a reason before closing this Opportunity as Lost." };
  }

  if (input.lostReason === "Other" && !input.otherReason?.trim()) {
    return { ok: false, error: "Lost Reason Required", message: "Please provide the other reason before closing this Opportunity as Lost." };
  }

  const closeDate = input.closeDate ? new Date(input.closeDate) : null;
  if (!closeDate || Number.isNaN(closeDate.getTime())) {
    return { ok: false, error: "Close date is invalid.", message: "Close date is invalid." };
  }

  const resolvedLostReason = input.lostReason === "Other" ? input.otherReason?.trim() : input.lostReason;
  const finalValue = input.finalValue != null ? Number(input.finalValue) : Number(deal.value ?? 0);

  let { data: lostStage } = await supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("pipeline_id", deal.pipeline_id)
    .ilike("name", "%closed lost%")
    .maybeSingle();

  if (!lostStage) {
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
        name: "Closed Lost",
        position: Number(maxStage?.position ?? 0) + 1,
        default_probability: 0,
        color: "#dc2626",
        stage_type: "lost",
      })
      .select("id, name")
      .single();
    lostStage = insertedStage ?? null;
  }

  if (!lostStage) {
    return { ok: false, error: "Unable to resolve Closed Lost stage.", message: "Unable to resolve Closed Lost stage." };
  }

  const { error: updateError } = await supabase
    .from("deals")
    .update({
      value: Number.isFinite(finalValue) ? finalValue : deal.value ?? 0,
      stage_id: lostStage.id,
      lost_reason: resolvedLostReason ?? null,
      competitor: input.competitor?.trim() || null,
      lost_at: closeDate.toISOString(),
      won_at: null,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", dealId)
    .eq("organization_id", orgId);

  if (updateError) {
    return { ok: false, error: updateError.message, message: updateError.message };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "opportunity_closed_lost",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    title: "Opportunity Closed Lost",
    description: `Opportunity closed lost due to ${resolvedLostReason}. Close date: ${closeDate.toISOString().slice(0, 10)}${input.competitor ? ` — Competitor: ${input.competitor}` : ""}${input.closingNotes ? ` — ${input.closingNotes}` : ""}`,
    metadata: {
      lost_reason: resolvedLostReason,
      competitor: input.competitor ?? null,
      close_date: closeDate.toISOString().slice(0, 10),
      final_value: finalValue,
      closing_notes: input.closingNotes ?? null,
    },
    occurred_at: new Date().toISOString(),
  });

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "deal_stage_changed",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    title: "Opportunity moved to Closed Lost",
    description: "The opportunity was closed as lost after a final review.",
    metadata: {
      from_stage: currentStage.id,
      to_stage: lostStage.id,
      lost_reason: resolvedLostReason,
      competitor: input.competitor ?? null,
      close_date: closeDate.toISOString().slice(0, 10),
    },
    occurred_at: new Date().toISOString(),
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  return { ok: true, message: "Opportunity closed as lost successfully." };
}

export async function approveOpportunityProposalSubmittedAction(
  dealId: string,
  quoteId?: string | null
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated.", message: "Not authenticated." };
  }

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    return { ok: false, error: "No active organization found.", message: "No active organization found." };
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, pipeline_id, stage_id, owner_id, created_by")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) {
    return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };
  }

  // Phase 2 — scope check before any deal-scoped mutation.
  const salesScope = await getSalesAccessScope();
  if (salesScope && !canAccessRecord(salesScope, deal)) {
    return { ok: false, error: "Opportunity not found or access denied.", message: "Opportunity not found or access denied." };
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, organization_id, status, deal_id")
    .eq("organization_id", orgId)
    .eq("id", quoteId ?? "")
    .maybeSingle();

  const validQuote = quote ?? (await (async () => {
    const { data } = await supabase
      .from("quotes")
      .select("id, organization_id, status, deal_id")
      .eq("organization_id", orgId)
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  })());

  if (!validQuote) {
    return { ok: false, error: "Proposal not found.", message: "Proposal not found." };
  }

  if (validQuote.status !== "Sent") {
    return { ok: false, error: "Proposal must be sent before moving to Proposal Submitted.", message: "Proposal must be sent before moving to Proposal Submitted." };
  }

  let { data: stageRow } = await supabase
    .from("pipeline_stages")
    .select("id, name, position")
    .eq("organization_id", orgId)
    .eq("pipeline_id", deal.pipeline_id)
    .ilike("name", "%Proposal Submitted%")
    .maybeSingle();

  if (!stageRow) {
    const { data: maxStage } = await supabase
      .from("pipeline_stages")
      .select("position")
      .eq("organization_id", orgId)
      .eq("pipeline_id", deal.pipeline_id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = Number(maxStage?.position ?? 0) + 1;
    const { data: insertedStage } = await supabase
      .from("pipeline_stages")
      .insert({
        organization_id: orgId,
        pipeline_id: deal.pipeline_id,
        name: "Proposal Submitted",
        position: nextPosition,
        default_probability: 80,
        color: "#8b5cf6",
        stage_type: "open",
      })
      .select("id, name, position")
      .single();

    stageRow = insertedStage ?? null;
  }

  if (!stageRow) {
    return { ok: false, error: "Unable to resolve Proposal Submitted stage.", message: "Unable to resolve Proposal Submitted stage." };
  }

  const { error: stageError } = await supabase
    .from("deals")
    .update({
      stage_id: stageRow.id,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", dealId)
    .eq("organization_id", orgId);

  if (stageError) {
    return { ok: false, error: stageError.message, message: stageError.message };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "deal_stage_changed",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    title: "Opportunity moved to Proposal Submitted",
    description: "The proposal was sent and the opportunity advanced to Proposal Submitted.",
    metadata: {
      from_stage: deal.stage_id ?? null,
      to_stage: stageRow.id,
      quote_id: validQuote.id,
    },
    occurred_at: new Date().toISOString(),
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  return { ok: true, message: "Opportunity moved to Proposal Submitted." };
}

export async function completeOpportunityMeetingAction(
  dealId: string,
  input: {
    meetingId?: string | null;
    notes?: string | null;
    outcome?: string | null;
    customerRequirements?: string | null;
    objections?: string | null;
    budgetDiscussed?: string | null;
    timeline?: string | null;
    nextActions?: string | null;
    approveStageTransition?: boolean;
    leadId?: string | null;
  }
): Promise<{ ok: boolean; error?: string; message?: string; stageChanged?: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated.", message: "Not authenticated." };
  }

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    return { ok: false, error: "No active organization found.", message: "No active organization found." };
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, organization_id, name, pipeline_id, stage_id, owner_id, created_by")
    .eq("id", dealId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!deal) {
    return { ok: false, error: "Opportunity not found.", message: "Opportunity not found." };
  }

  // Phase 2 — scope check before any deal-scoped mutation.
  const salesScope = await getSalesAccessScope();
  if (salesScope && !canAccessRecord(salesScope, deal)) {
    return { ok: false, error: "Opportunity not found or access denied.", message: "Opportunity not found or access denied." };
  }

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, status, organization_id, related_type, related_id, notes, outcome")
    .eq("organization_id", orgId)
    .eq("id", input.meetingId ?? "")
    .maybeSingle();

  const targetMeeting = meeting ?? await (async () => {
    const { data } = await supabase
      .from("meetings")
      .select("id, status, organization_id, related_type, related_id, notes, outcome")
      .eq("organization_id", orgId)
      .eq("related_type", "deal")
      .eq("related_id", dealId)
      .order("start_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  })();

  if (!targetMeeting) {
    return { ok: false, error: "Meeting not found.", message: "Meeting not found." };
  }

  const nextNotes = [input.notes, input.customerRequirements, input.objections, input.budgetDiscussed, input.timeline, input.nextActions]
    .filter(Boolean)
    .join("\n");

  const { error: updateError } = await supabase
    .from("meetings")
    .update({
      status: "completed",
      notes: nextNotes || targetMeeting.notes || null,
      outcome: input.outcome || targetMeeting.outcome || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetMeeting.id)
    .eq("organization_id", orgId);

  if (updateError) {
    return { ok: false, error: updateError.message, message: updateError.message };
  }

  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "meeting_completed",
    related_type: "deal",
    related_id: dealId,
    actor_user_id: user.id,
    deal_id: dealId,
    lead_id: input.leadId ?? null,
    title: "Meeting completed",
    description: input.outcome || "Customer meeting completed.",
    metadata: {
      meeting_id: targetMeeting.id,
      outcome: input.outcome ?? null,
      customer_requirements: input.customerRequirements ?? null,
      objections: input.objections ?? null,
      budget_discussed: input.budgetDiscussed ?? null,
      timeline: input.timeline ?? null,
      next_actions: input.nextActions ?? null,
    },
    occurred_at: new Date().toISOString(),
  });

  if (input.approveStageTransition) {
    const { data: stageRow } = await supabase
      .from("pipeline_stages")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("pipeline_id", deal.pipeline_id)
      .ilike("name", "%Meeting Done%")
      .maybeSingle();

    if (stageRow) {
      const { error: stageError } = await supabase
        .from("deals")
        .update({
          stage_id: stageRow.id,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", dealId)
        .eq("organization_id", orgId);

      if (stageError) {
        return { ok: false, error: stageError.message, message: stageError.message };
      }

      await supabase.from("activities").insert({
        organization_id: orgId,
        activity_type: "deal_stage_changed",
        related_type: "deal",
        related_id: dealId,
        actor_user_id: user.id,
        deal_id: dealId,
        lead_id: input.leadId ?? null,
        title: "Opportunity moved to Meeting Done",
        description: "The meeting was completed and the opportunity advanced to Meeting Done.",
        metadata: {
          from_stage: deal.stage_id ?? null,
          to_stage: stageRow.id,
        },
        occurred_at: new Date().toISOString(),
      });

      revalidatePath("/opportunities");
      revalidatePath(`/opportunities/${dealId}`);
      return { ok: true, message: "Opportunity moved to Meeting Done.", stageChanged: true };
    }
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  return { ok: true, message: "Meeting completed. Stage not changed.", stageChanged: false };
}

export async function manageOpportunityAction(dealId: string, action: "delete" | "archive" | "restore") {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };
  const { data: orgId } = await supabase.rpc("current_organization_id");
  if (!orgId) return { ok: false, error: "No active organization found." };

  // Phase 2 — only opportunities inside the caller's scope can be managed.
  const salesScope = await getSalesAccessScope();
  const dealAccess = await assertDealAccess(supabase, salesScope, dealId, orgId);
  if (!dealAccess.ok) return { ok: false, error: "Opportunity not found or access denied." };

  if (action === "delete") {
    if (!(await can("deal.delete"))) {
      return { ok: false, error: "You do not have permission to delete opportunities." };
    }

    try {
      await permanentlyDeleteOpportunity(dealId, orgId);
    } catch (error) {
      console.error("[opportunities] permanent delete failed", error);
      return { ok: false, error: error instanceof Error ? error.message : "Opportunity deletion failed." };
    }

    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${dealId}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin/opportunities");
    return { ok: true };
  }

  const { data: deal } = await supabase.from("deals").select("id, archived_at").eq("id", dealId).eq("organization_id", orgId).maybeSingle();
  if (!deal) return { ok: false, error: "Opportunity not found or access denied." };

  if (action === "restore") {
    const { error } = await supabase.from("deals").update({ archived_at: null, archived_by: null }).eq("id", dealId).eq("organization_id", orgId);
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${dealId}`);
    revalidatePath("/dashboard");
    return { ok: !error, error: error?.message };
  }

  // The archive branch is kept only for API compatibility; the
  // opportunity UI no longer offers "Archive Opportunity".
  const { error } = await supabase.from("deals").update({ archived_at: new Date().toISOString(), archived_by: user.id }).eq("id", dealId).eq("organization_id", orgId);
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${dealId}`);
  revalidatePath("/dashboard");
  return { ok: !error, error: error?.message };
}
