/**
 * Phase 3 — server-side RSM proposal approval workflow.
 *
 * Canonical authorization for the proposal approval lifecycle. Every action
 * re-verifies, exclusively from server state:
 *
 *   1. the caller is authenticated and the proposal belongs to the active org;
 *   2. Phase-2 scope: the caller may see the proposal (created_by) and the
 *      related Opportunity/owner (`assertRsmCanActOnProposal`);
 *   3. role: only an RSM may approve / return a proposal (Head of Sales is
 *      explicitly NOT an approver in Phase 3; Admin behavior is preserved);
 *   4. region: RSM approval only applies to proposals owned by BDOs in the
 *      RSM's authorized region/team (via the Phase-2 visible-owner set);
 *   5. state machine + idempotency: every transition is conditional on the
 *      current `approval_status`, so double-submit / double-approve /
 *      double-return / approve-after-send cannot occur.
 *
 * Nothing here is trusted from the browser — role, region, proposal owner and
 * organization_id are resolved server-side.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId, type DbClient } from "@/lib/crm/base";
import { canAccessRecord, getSalesAccessScope } from "@/lib/crm/scope";
import { notifyUsers } from "@/lib/notifications";

const ACCESS_DENIED = "This proposal could not be found or access was denied.";

export interface ProposalApprovalResult {
  ok: boolean;
  error?: string;
  message?: string;
  quote?: {
    id: string;
    quote_number: string | null;
    approval_status: string;
    approval_cycle?: number | null;
  } | null;
}

interface ApprovalQuoteRow {
  id: string;
  organization_id: string;
  quote_number: string | null;
  status: string | null;
  deal_id: string | null;
  created_by: string | null;
  approval_status: string | null;
  submitted_for_approval_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  approval_cycle: number | null;
}

interface LoadedProposal {
  supabase: DbClient;
  orgId: string;
  userId: string;
  quote: ApprovalQuoteRow;
  scope: NonNullable<Awaited<ReturnType<typeof getSalesAccessScope>>>;
}

async function loadProposal(quoteId: string): Promise<{ loaded: LoadedProposal } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { error: "No active organization found." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated." };
  }

  const scope = await getSalesAccessScope();
  if (!scope) {
    return { error: ACCESS_DENIED };
  }

  const { data: quote } = (await supabase
    .from("quotes")
    .select(
      "id, organization_id, quote_number, status, deal_id, created_by, approval_status, " +
        "submitted_for_approval_at, submitted_by, approved_at, approved_by, " +
        "rejected_at, rejected_by, rejection_reason, approval_cycle",
    )
    .eq("id", quoteId)
    .eq("organization_id", orgId)
    .maybeSingle()) as { data: ApprovalQuoteRow | null };

  if (!quote) {
    return { error: ACCESS_DENIED };
  }

  return { loaded: { supabase, orgId, userId: user.id, quote, scope } };
}

/** Phase-2 check: can the caller see this proposal (created_by)? */
function canSeeProposal(
  scope: LoadedProposal["scope"],
  quote: ApprovalQuoteRow,
): boolean {
  return canAccessRecord(scope, { owner_id: null, created_by: quote.created_by });
}

/**
 * RSM authorization (approve / return):
 *  - caller must hold the `rsm` role;
 *  - the proposal must be inside the RSM's Phase-2 scope (created_by / owner);
 *  - the related Opportunity must be inside the RSM's Phase-2 scope (region);
 *  - an RSM can never approve/return their own proposal.
 */
async function assertRsmCanActOnProposal(
  loaded: LoadedProposal,
): Promise<string | null> {
  const { scope, quote } = loaded;

  if (scope.role !== "rsm") {
    return "Only an RSM can approve or return proposals in this stage.";
  }

  if (!canSeeProposal(scope, quote)) {
    return ACCESS_DENIED;
  }

  // Phase-2 Region/team gate on the related Opportunity.
  if (quote.deal_id) {
    const { data: deal } = await loaded.supabase
      .from("deals")
      .select("owner_id, created_by")
      .eq("id", quote.deal_id)
      .eq("organization_id", loaded.orgId)
      .maybeSingle();
    if (!deal) {
      return ACCESS_DENIED;
    }
    if (!canAccessRecord(scope, { owner_id: deal.owner_id, created_by: deal.created_by })) {
      return ACCESS_DENIED;
    }
  }

  // Self-approval / self-return is never allowed.
  if (quote.created_by && quote.created_by === scope.userId) {
    return "You cannot approve or return your own proposal.";
  }

  return null;
}

function failure(error: string): ProposalApprovalResult {
  return { ok: false, error, message: error };
}

function success(
  message: string,
  quote: ProposalApprovalResult["quote"],
): ProposalApprovalResult {
  return { ok: true, message, quote };
}

async function recordActivity(
  loaded: LoadedProposal,
  params: { type: string; title: string; description: string; metadata: Record<string, unknown> },
) {
  await loaded.supabase.from("activities").insert({
    organization_id: loaded.orgId,
    activity_type: params.type,
    related_type: "quote",
    related_id: loaded.quote.id,
    actor_user_id: loaded.userId,
    title: params.title,
    description: params.description,
    metadata: { ...params.metadata, quote_id: loaded.quote.id, quote_number: loaded.quote.quote_number },
    occurred_at: new Date().toISOString(),
  });
}

/** Fan out an in-app notice to every active RSM in the organization. */
async function notifyRsmUsers(loaded: LoadedProposal, title: string, message: string) {
  const { data } = await loaded.supabase
    .from("organization_members")
    .select("user_id, roles(name)")
    .eq("organization_id", loaded.orgId)
    .eq("status", "active");

  const rsmIds = (data ?? [])
    .filter((row) => {
      const role = Array.isArray(row.roles) ? null : (row.roles as { name?: string | null } | null);
      return (role?.name ?? "").toLowerCase().includes("rsm");
    })
    .map((row) => row.user_id as string);

  if (rsmIds.length === 0) return;

  await notifyUsers({
    organizationId: loaded.orgId,
    userIds: rsmIds,
    type: "proposal",
    title,
    message,
    relatedType: "quote",
    relatedId: loaded.quote.id,
  });
}

/** Notify the submitting BDO (creator) about an approval decision. */
async function notifyCreator(loaded: LoadedProposal, title: string, message: string) {
  if (!loaded.quote.created_by) return;
  await notifyUsers({
    organizationId: loaded.orgId,
    userIds: [loaded.quote.created_by],
    type: "proposal",
    title,
    message,
    relatedType: "quote",
    relatedId: loaded.quote.id,
  });
}

/**
 * BDO — Submit (or resubmit) a proposal for RSM approval.
 *
 * Transition: not_submitted / returned_for_revision → pending_rsm_approval
 * (idempotent when already pending: a second submission is a no-op success).
 */
export async function submitProposalForApproval(quoteId: string): Promise<ProposalApprovalResult> {
  const result = await loadProposal(quoteId);
  if ("error" in result) return failure(result.error);

  const { supabase, orgId, scope, quote } = result.loaded;

  if (!canSeeProposal(scope, quote)) {
    return failure(ACCESS_DENIED);
  }

  if (quote.status === "Sent") {
    return failure("This proposal has already been sent and cannot be submitted for approval.");
  }
  if (quote.approval_status === "approved") {
    return failure("This proposal is already approved and ready to send.");
  }
  if (quote.approval_status === "pending_rsm_approval") {
    return success("Proposal is already awaiting RSM approval.", {
      id: quote.id,
      quote_number: quote.quote_number,
      approval_status: "pending_rsm_approval",
      approval_cycle: quote.approval_cycle,
    });
  }

  const isResubmit = quote.approval_status === "returned_for_revision";
  const previousCycle = Number(quote.approval_cycle ?? 0);

  const { data, error } = await supabase
    .from("quotes")
    .update({
      approval_status: "pending_rsm_approval",
      submitted_for_approval_at: new Date().toISOString(),
      submitted_by: scope.userId,
      approval_cycle: previousCycle + 1,
      // A resubmission starts a fresh approval cycle — stale decision data is
      // cleared (the audit trail lives in `activities`).
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("organization_id", orgId)
    .in("approval_status", ["not_submitted", "returned_for_revision"])
    .select("id, quote_number, approval_status, approval_cycle")
    .single();

  if (error || !data) {
    return failure("This proposal is no longer in a submittable state.");
  }

  await recordActivity(result.loaded, {
    type: isResubmit ? "proposal_resubmitted" : "proposal_submitted_for_approval",
    title: isResubmit
      ? `Proposal resubmitted for RSM approval: ${quote.quote_number}`
      : `Proposal submitted for RSM approval: ${quote.quote_number}`,
    description: isResubmit
      ? "Proposal resubmitted for RSM review after revision."
      : "Proposal submitted for RSM approval.",
    metadata: { approval_cycle: data.approval_cycle },
  });

  await notifyRsmUsers(
    result.loaded,
    `Proposal awaiting RSM approval — ${quote.quote_number}`,
    "A proposal has been submitted for your review.",
  );

  return success(
    isResubmit ? "Proposal resubmitted for RSM approval." : "Proposal submitted for RSM approval.",
    data,
  );
}

/**
 * RSM — Approve a submitted proposal.
 *
 * Transition: pending_rsm_approval → approved. Approval never sends the
 * proposal; sending stays a separate, BDO-initiated step.
 */
export async function approveProposal(quoteId: string): Promise<ProposalApprovalResult> {
  const result = await loadProposal(quoteId);
  if ("error" in result) return failure(result.error);

  const { supabase, orgId, scope, quote } = result.loaded;

  const guard = await assertRsmCanActOnProposal(result.loaded);
  if (guard) return failure(guard);

  if (quote.status === "Sent") {
    return failure("This proposal has already been sent and cannot be approved.");
  }

  const { data, error } = await supabase
    .from("quotes")
    .update({
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: scope.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("organization_id", orgId)
    .eq("approval_status", "pending_rsm_approval")
    .select("id, quote_number, approval_status, approval_cycle")
    .single();

  if (error || !data) {
    return failure("This proposal is no longer pending RSM approval.");
  }

  await recordActivity(result.loaded, {
    type: "proposal_approved",
    title: `RSM approved proposal: ${quote.quote_number}`,
    description: "Proposal approved by RSM — ready to send to the customer.",
    metadata: { approved_by: scope.userId },
  });

  await notifyCreator(
    result.loaded,
    `Proposal approved — ${quote.quote_number}`,
    "Your proposal has been approved by the RSM and is ready to send.",
  );

  return success("Proposal approved.", data);
}

/**
 * RSM — Return a submitted proposal for revision.
 *
 * Transition: pending_rsm_approval → returned_for_revision. The proposal is
 * kept (never deleted) and the BDO can revise and resubmit. Requires a reason.
 */
export async function returnProposalForRevision(
  quoteId: string,
  reason: string,
): Promise<ProposalApprovalResult> {
  const trimmedReason = (reason ?? "").trim();
  if (!trimmedReason) {
    return failure("A reason is required to return the proposal for revision.");
  }
  if (trimmedReason.length > 2000) {
    return failure("The return reason must be 2000 characters or fewer.");
  }

  const result = await loadProposal(quoteId);
  if ("error" in result) return failure(result.error);

  const { supabase, orgId, scope, quote } = result.loaded;

  const guard = await assertRsmCanActOnProposal(result.loaded);
  if (guard) return failure(guard);

  if (quote.status === "Sent") {
    return failure("This proposal has already been sent and cannot be returned.");
  }

  const { data, error } = await supabase
    .from("quotes")
    .update({
      approval_status: "returned_for_revision",
      rejected_at: new Date().toISOString(),
      rejected_by: scope.userId,
      rejection_reason: trimmedReason,
      approved_at: null,
      approved_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("organization_id", orgId)
    .eq("approval_status", "pending_rsm_approval")
    .select("id, quote_number, approval_status, approval_cycle")
    .single();

  if (error || !data) {
    return failure("This proposal is no longer pending RSM approval.");
  }

  await recordActivity(result.loaded, {
    type: "proposal_returned_for_revision",
    title: `RSM returned proposal: ${quote.quote_number}`,
    description: trimmedReason,
    metadata: {
      rejected_by: scope.userId,
      rejection_reason: trimmedReason,
    },
  });

  await notifyCreator(
    result.loaded,
    `Proposal returned for revision — ${quote.quote_number}`,
    `Your proposal was returned for revision: ${trimmedReason}`,
  );

  return success("Proposal returned for revision.", data);
}