import { DataQualityPageClient } from "@/components/data-quality/data-quality-page-client";
import { dataQualityMetrics } from "@/lib/mock-data-quality";

export default function DataQualityPage() {
  return <DataQualityPageClient initialMetrics={dataQualityMetrics} />;
}