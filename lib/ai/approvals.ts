/**
 * AI Approval system.
 * Manages approval requests for consequential AI actions.
 * Server-only.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";
import { AIApprovalRequestSchema } from "@/lib/ai/schemas";
import type { AIApprovalRequest } from "@/lib/ai/schemas";

export interface CreateApprovalRequestParams {
  agentId?: string;
  actionType: string;
  recordType: string;
  recordId: string;
  proposedPayload: Record<string, unknown>;
  reasonSummary: string;
  riskLevel: "Low" | "Medium" | "High";
}

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  agent_id: string | null;
  action_type: string;
  record_type: string;
  record_id: string;
  proposed_payload: Record<string, unknown>;
  reason_summary: string;
  risk_level: "Low" | "Medium" | "High";
  status: "pending" | "approved" | "rejected" | "cancelled" | "executed" | "failed";
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

/**
 * Create an AI approval request.
 * Returns the approval record ID.
 */
export async function createApprovalRequest(
  params: CreateApprovalRequestParams
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  // Validate the request
  const validated = AIApprovalRequestSchema.parse({
    actionType: params.actionType,
    recordType: params.recordType,
    recordId: params.recordId,
    proposedPayload: params.proposedPayload,
    reasonSummary: params.reasonSummary,
    riskLevel: params.riskLevel,
  });

  const { data, error } = await supabase
    .from("ai_approvals")
    .insert({
      organization_id: orgId,
      agent_id: params.agentId || null,
      action_type: validated.actionType,
      record_type: validated.recordType,
      record_id: validated.recordId,
      proposed_payload: validated.proposedPayload,
      reason_summary: validated.reasonSummary,
      risk_level: validated.riskLevel,
      status: "pending",
      requested_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create approval request: ${error.message}`);
  }

  return data.id;
}

/**
 * Get all pending approval requests for the current organization.
 */
export async function getPendingApprovals(): Promise<ApprovalRequest[]> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return [];
  }

  const { data, error } = await supabase
    .from("ai_approvals")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch approvals:", error);
    return [];
  }

  return (data || []) as ApprovalRequest[];
}

/**
 * Approve an AI approval request.
 * Returns the approval record.
 */
export async function approveApproval(
  approvalId: string,
  reviewedBy: string
): Promise<ApprovalRequest> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  const { data, error } = await supabase
    .from("ai_approvals")
    .update({
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approvalId)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to approve: ${error.message}`);
  }

  return data as ApprovalRequest;
}

/**
 * Reject an AI approval request.
 */
export async function rejectApproval(
  approvalId: string,
  reviewedBy: string
): Promise<ApprovalRequest> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  const { data, error } = await supabase
    .from("ai_approvals")
    .update({
      status: "rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approvalId)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to reject: ${error.message}`);
  }

  return data as ApprovalRequest;
}

/**
 * Mark an approval as executed.
 */
export async function markApprovalExecuted(approvalId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  await supabase
    .from("ai_approvals")
    .update({ status: "executed" })
    .eq("id", approvalId)
    .eq("organization_id", orgId);
}

/**
 * Mark an approval as failed.
 */
export async function markApprovalFailed(
  approvalId: string,
  errorMessage: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  await supabase
    .from("ai_approvals")
    .update({
      status: "failed",
      proposed_payload: { error: errorMessage },
    })
    .eq("id", approvalId)
    .eq("organization_id", orgId);
}

/**
 * Check if an action requires approval based on the agent's approval mode.
 */
export function requiresApproval(
  actionType: string,
  approvalMode: "Draft Only" | "Ask Before Action" | "Auto-Execute Allowed Actions"
): boolean {
  if (approvalMode === "Draft Only") return true;
  if (approvalMode === "Auto-Execute Allowed Actions") {
    // Safe actions that can auto-execute
    const safeActions = [
      "create_internal_task",
      "add_internal_note",
      "calculate_score",
      "summarize",
      "analyze",
    ];
    return !safeActions.includes(actionType);
  }
  // Default: Ask Before Action
  return true;
}