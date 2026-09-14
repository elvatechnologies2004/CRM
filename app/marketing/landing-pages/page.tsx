import { MarketingLandingPagesPageClient } from "@/components/marketing/landing-pages-page-client";
import { marketingPageMocks } from "@/lib/mock-marketing-pages";

export default function MarketingLandingPagesPage() {
  return <MarketingLandingPagesPageClient initialPages={marketingPageMocks} />;
}