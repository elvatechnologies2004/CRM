import { notFound } from "next/navigation";

import { OpportunityDetailClient } from "@/components/opportunities/opportunity-detail-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";
import { getDealById } from "@/lib/crm/deals";
import { getLatestProposalForDeal } from "@/lib/revenue/quotes";
import { getSalesAccessScope } from "@/lib/crm/scope";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDealById(id);

  if (!deal) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const organizationId = await getActiveOrgId(supabase);

  let lead = null;
  let meeting = null;
  let activities: Array<{ id: string; activity_type: string; title: string; description: string | null; occurred_at: string; actor_user_id?: string | null; metadata?: Record<string, unknown> }> = [];

  if (organizationId) {
    const { data: leadRow } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, phone, company_name, full_name, source, expected_value, owner_id, created_at, last_activity_at")
      .eq("organization_id", organizationId)
      .eq("converted_deal_id", id)
      .maybeSingle();
    lead = leadRow;

    const { data: meetingRow } = await supabase
      .from("meetings")
      .select("id, title, meeting_type, start_at, end_at, owner_id, related_type, related_id, status, notes, outcome, created_at, created_by")
      .eq("organization_id", organizationId)
      .eq("related_type", "deal")
      .eq("related_id", id)
      .order("start_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    meeting = meetingRow;

    const { data: activityRows } = await supabase
      .from("activities")
      .select("id, activity_type, title, description, occurred_at, actor_user_id, metadata")
      .eq("organization_id", organizationId)
      .eq("deal_id", id)
      .order("occurred_at", { ascending: false })
      .limit(20);
    activities = activityRows ?? [];
  }

  // Phase 3 — resume the RSM approval workflow for this opportunity's proposal.
  const { proposal: latestProposal } = await getLatestProposalForDeal(id);

  const scope = await getSalesAccessScope();
  const viewer = scope
    ? {
        userId: scope.userId,
        role: scope.role,
        isRsm: scope.role === "rsm",
        isOrgWide: scope.role === "admin" || scope.role === "head_of_sales",
      }
    : null;

  // An RSM may approve/return on this screen only when they are not the
  // proposal's creator and the proposal is within their Phase-2 scope.
  let canApproveProposal = false;
  if (
    viewer?.isRsm &&
    latestProposal &&
    latestProposal.createdBy !== viewer.userId
  ) {
    canApproveProposal = await (async () => {
      if (scope?.visibleOwnerIds === null) return true;
      const ownerId = latestProposal.createdBy;
      return Boolean(ownerId && scope?.visibleOwnerIds?.has(ownerId));
    })();
  }

  return (
    <OpportunityDetailClient
      deal={deal}
      lead={lead}
      meeting={meeting}
      activities={activities}
      latestProposal={latestProposal}
      viewer={viewer}
      canApproveProposal={canApproveProposal}
    />
  );
}