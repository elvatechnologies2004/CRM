import { MarketingSourcesPageClient } from "@/components/marketing/sources-page-client";
import { marketingSourceMocks } from "@/lib/mock-marketing-sources";

export default function MarketingSourcesPage() {
  return <MarketingSourcesPageClient initialSources={marketingSourceMocks} />;
}