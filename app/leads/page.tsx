import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLeads } from "@/lib/crm/leads";
import { fetchOwnerIndex, getActiveOrgId } from "@/lib/crm/base";
import { LeadsPageClient } from "@/components/leads/leads-page-client";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ archive?: string }> }) {
  const params = await searchParams;
  const archiveFilter = params.archive === "archived" || params.archive === "all" ? params.archive : "active";
  const [initialLeadsResult, supabase] = await Promise.all([
    getLeads({ page: 1, pageSize: 100, archiveFilter }),
    createSupabaseServerClient(),
  ]);

  const organizationId = await getActiveOrgId(supabase);
  const owners = organizationId
    ? Object.entries(await fetchOwnerIndex(supabase, organizationId)).map(([id, value]) => ({
        id,
        name: value.name,
        role: "Member",
        email: value.email ?? "",
        organizationId,
      }))
    : [];

  return <LeadsPageClient initialLeads={initialLeadsResult.rows} owners={owners} archiveFilter={archiveFilter} />;
}
