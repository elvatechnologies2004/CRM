import { CompaniesPageClient } from "@/components/companies/companies-page-client";
import { getActiveOrgId, fetchOwnerIndex } from "@/lib/crm/base";
import { getCompanies } from "@/lib/crm/companies";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { companyMocks } from "@/lib/mock-companies";
import { leadOwners } from "@/lib/mock-leads";
import type { User } from "@/lib/types";

export default async function CompaniesPage() {
  const result = await getCompanies();
  let initialCompanies = result.rows;
  let owners: User[] = leadOwners;

  if (initialCompanies.length > 0 && isSupabaseConfigured()) {
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

  if (initialCompanies.length === 0) initialCompanies = companyMocks;

  return (
    <CompaniesPageClient initialCompanies={initialCompanies} owners={owners} />
  );
}