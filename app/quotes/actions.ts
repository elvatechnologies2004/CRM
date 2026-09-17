"use server";

import { revalidatePath } from "next/cache";

import {
  createQuote,
  updateQuoteStatus,
  type CreateQuoteParams,
} from "@/lib/revenue/quotes";

export interface QuoteActionResult {
  quote?: {
    id: string;
    number: string;
    customerName: string;
    dealName?: string;
    total: number;
    status: string;
    createdAt: string;
  };
  error: string | null;
}

export async function createQuoteAction(
  input: Omit<CreateQuoteParams, "items"> & {
    customerName: string;
    dealName?: string;
    total: number;
  }
): Promise<QuoteActionResult> {
  const result = await createQuote({
    ...input,
    items:
      input.total > 0
        ? [
            {
              name_snapshot: input.customerName,
              description: input.dealName,
              quantity: 1,
              unit_price: input.total,
            },
          ]
        : [],
  });

  if (result.error || !result.quote) {
    return { error: result.error || "Failed to create quote" };
  }

  revalidatePath("/quotes");

  const { quote } = result;
  return {
    quote: {
      id: quote.id,
      number: quote.quote_number ?? "",
      customerName: input.customerName,
      dealName: input.dealName,
      total: Number(quote.total ?? 0),
      status: quote.status,
      createdAt: quote.created_at,
    },
    error: null,
  };
}

export async function updateQuoteStatusAction(
  quoteId: string,
  status: "Draft" | "Sent" | "Viewed" | "Accepted" | "Rejected" | "Expired"
): Promise<{ error: string | null }> {
  const result = await updateQuoteStatus({ quoteId, status });
  if (result.error) {
    return { error: result.error };
  }
  revalidatePath("/quotes");
  return { error: null };
}