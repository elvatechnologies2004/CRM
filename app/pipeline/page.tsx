import { PipelinePageClient } from "@/components/pipeline/pipeline-page-client";
import { dealMocks } from "@/lib/mock-deals";

export default function PipelinePage() {
  return <PipelinePageClient initialDeals={dealMocks} />;
}