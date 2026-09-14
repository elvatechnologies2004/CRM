import type { QuoteStatus, QuoteRecord } from "@/lib/types";

export const quoteStatuses: QuoteStatus[] = [
  "Draft",
  "Sent",
  "Viewed",
  "Accepted",
  "Rejected",
  "Expired",
];

export const quoteMocks: QuoteRecord[] = [];

export function getQuoteById(id: string): QuoteRecord | undefined {
  return quoteMocks.find((q) => q.id === id);
}