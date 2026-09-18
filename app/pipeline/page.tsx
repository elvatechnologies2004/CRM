import { PipelinePageClient } from "@/components/pipeline/pipeline-page-client";
import { getDeals } from "@/lib/crm/deals";
import { dealMocks } from "@/lib/mock-deals";

export default async function PipelinePage() {
  const result = await getDeals({ pageSize: 1000 });
  const initialDeals = result.rows.length > 0 ? result.rows : dealMocks;

  return <PipelinePageClient initialDeals={initialDeals} />;
}