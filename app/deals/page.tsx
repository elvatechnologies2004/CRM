import { DealsPageClient } from "@/components/deals/deals-page-client";
import { getActiveOrgId, fetchOwnerIndex } from "@/lib/crm/base";
import { getDeals } from "@/lib/crm/deals";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dealMocks } from "@/lib/mock-deals";
import { leadOwners } from "@/lib/mock-leads";

export default async function DealsPage() {
  const result = await getDeals();
  let initialDeals = result.rows;
  let owners: string[] = leadOwners.map((o) => o.name);

  if (initialDeals.length > 0 && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const organizationId = await getActiveOrgId(supabase);
    if (organizationId) {
      const index = await fetchOwnerIndex(supabase, organizationId);
      owners = Object.values(index).map(({ name }) => name);
    }
  }

  if (initialDeals.length === 0) initialDeals = dealMocks;

  return (
    <DealsPageClient initialDeals={initialDeals} owners={owners} />
  );
}