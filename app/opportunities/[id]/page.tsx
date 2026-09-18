import { notFound } from "next/navigation";

import { OpportunityDetailClient } from "@/components/opportunities/opportunity-detail-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";
import { getDealById } from "@/lib/crm/deals";

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

  return <OpportunityDetailClient deal={deal} lead={lead} meeting={meeting} activities={activities} />;
}
