import { ContactsPageClient } from "@/components/contacts/contacts-page-client";
import { getActiveOrgId, fetchOwnerIndex } from "@/lib/crm/base";
import { getContacts } from "@/lib/crm/contacts";
import { getCompanies } from "@/lib/crm/companies";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { companyMocks } from "@/lib/mock-companies";
import { contactMocks } from "@/lib/mock-contacts";
import { leadOwners } from "@/lib/mock-leads";
import type { User } from "@/lib/types";

export default async function ContactsPage() {
  const result = await getContacts();
  const companiesResult = await getCompanies();

  let initialContacts = result.rows;
  let companies = companiesResult.rows;
  let owners: User[] = leadOwners;

  if (initialContacts.length > 0 && isSupabaseConfigured()) {
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

  if (initialContacts.length === 0) initialContacts = contactMocks;
  if (companies.length === 0) companies = companyMocks;

  return (
    <ContactsPageClient
      initialContacts={initialContacts}
      owners={owners}
      companies={companies}
    />
  );
}