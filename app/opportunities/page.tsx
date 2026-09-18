import { getDeals } from "@/lib/crm/deals";
import { OpportunitiesPageClient } from "@/components/opportunities/opportunities-page-client";

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ archive?: string }> }) {
  const params = await searchParams;
  const archiveFilter = params.archive === "archived" || params.archive === "all" ? params.archive : "active";
  const result = await getDeals({ pageSize: 1000, archiveFilter });
  return <OpportunitiesPageClient initialDeals={result.rows} archiveFilter={archiveFilter} />;
}
