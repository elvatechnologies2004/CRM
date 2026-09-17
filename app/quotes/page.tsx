import { QuotesPageClient } from "@/components/quotes/quotes-page-client";
import { getAllQuotes } from "@/lib/revenue/quotes";
import type { QuoteRecord } from "@/lib/types";

export const revalidate = 0;

export default async function QuotesPage() {
  const { quotes, error } = await getAllQuotes();

  let initialQuotes: QuoteRecord[];
  if (error) {
    initialQuotes = [];
  } else {
    initialQuotes = quotes;
  }

  return <QuotesPageClient initialQuotes={initialQuotes} />;
}