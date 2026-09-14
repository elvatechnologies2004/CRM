import { LeadsPageClient } from "@/components/leads/leads-page-client";
import { getActiveOrgId, fetchOwnerIndex } from "@/lib/crm/base";
import { getLeads } from "@/lib/crm/leads";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leadMocks, leadOwners } from "@/lib/mock-leads";
import type { User } from "@/lib/types";

export default async function LeadsPage() {
  const result = await getLeads();
  let leads = result.rows;
  let owners: User[] = leadOwners;

  if (leads.length > 0) {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const organizationId = await getActiveOrgId(supabase);
      if (organizationId) {
        const index = await fetchOwnerIndex(supabase, organizationId);
        owners = Object.entries(index).map(([id, { name, email }]) => ({
          id,
          name,
          role: "Member",
          email: email ?? `${id}@org.local`,
        }));
      }
    }
  } else {
    leads = leadMocks;
  }

  return <LeadsPageClient leads={leads} owners={owners} />;
}