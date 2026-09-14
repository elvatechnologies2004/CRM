import { HelpPageClient } from "@/components/help/help-page-client";
import { faqItems, helpArticles, systemStatusItems } from "@/lib/help-data";

export default function HelpPage() {
  return (
    <HelpPageClient
      articles={helpArticles}
      faqItems={faqItems}
      systemStatusItems={systemStatusItems}
    />
  );
}