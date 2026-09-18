import { notFound } from "next/navigation";

import { DealDetailView } from "@/components/deals/deal-detail-view";
import { getDealById } from "@/lib/crm/deals";
import { fetchOwnerIndex, getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { leadOwners } from "@/lib/mock-leads";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDealById(id);
  if (!deal) notFound();

  let owners = leadOwners;
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const organizationId = await getActiveOrgId(supabase);
    if (organizationId) {
      const index = await fetchOwnerIndex(supabase, organizationId);
      owners = Object.entries(index).map(([userId, { name, email }]) => ({
        id: userId,
        name,
        role: "Member" as const,
        email: email ?? `${userId}@org.local`,
      }));
    }
  }

  return (
    <DealDetailView
      deal={deal}
      owners={owners}
      activities={[]}
      health={undefined}
      quotes={[]}
      proposals={[]}
      wonData={undefined}
      lostData={undefined}
      staleAlerts={[]}
    />
  );
}
