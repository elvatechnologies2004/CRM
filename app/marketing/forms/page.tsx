import { MarketingFormsPageClient } from "@/components/marketing/forms-page-client";
import { marketingFormMocks } from "@/lib/mock-marketing-forms";

export default function MarketingFormsPage() {
  return <MarketingFormsPageClient initialForms={marketingFormMocks} />;
}