import { QuotesPageClient } from "@/components/quotes/quotes-page-client";
import { quoteMocks } from "@/lib/mock-quotes";

export default function QuotesPage() {
  return <QuotesPageClient initialQuotes={quoteMocks} />;
}