import { MarketingPageClient } from "@/components/marketing/marketing-page-client";
import { marketingSources } from "@/lib/marketing-data";

export default function MarketingPage() {
  return <MarketingPageClient initialSources={marketingSources} />;
}