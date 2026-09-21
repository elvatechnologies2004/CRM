"use server";

import { revalidatePath } from "next/cache";

import {
  approveProposal,
  returnProposalForRevision,
  submitProposalForApproval,
  type ProposalApprovalResult,
} from "@/lib/revenue/proposal-approval";
import {
  createQuote,
  getQuoteWithItems,
  updateQuoteContent,
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
    items?: CreateQuoteParams["items"];
  }
): Promise<QuoteActionResult> {
  const items = Array.isArray(input.items) && input.items.length > 0
    ? input.items
    : input.total > 0
      ? [
          {
            name_snapshot: input.dealName
              ? `${input.dealName} — ${input.customerName}`
              : input.customerName,
            quantity: 1,
            unit_price: input.total,
          },
        ]
      : [];

  const result = await createQuote({
    ...input,
    items,
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

/* ------------------------------------------------------------------ */
/* Phase 3 — RSM proposal approval workflow                            */
/* ------------------------------------------------------------------ */

export async function submitProposalForApprovalAction(
  quoteId: string,
): Promise<ProposalApprovalResult> {
  const result = await submitProposalForApproval(quoteId);
  revalidatePath("/quotes");
  return result;
}

export async function approveProposalAction(
  quoteId: string,
): Promise<ProposalApprovalResult> {
  const result = await approveProposal(quoteId);
  revalidatePath("/quotes");
  return result;
}

export async function returnProposalForRevisionAction(
  quoteId: string,
  reason: string,
): Promise<ProposalApprovalResult> {
  const result = await returnProposalForRevision(quoteId, reason);
  revalidatePath("/quotes");
  return result;
}

export async function updateQuoteContentAction(input: {
  quoteId: string;
  terms?: string | null;
  notes?: string | null;
  issue_date?: string;
  expiry_date?: string | null;
  currency?: string;
  items: CreateQuoteParams["items"];
}): Promise<{ ok: boolean; error?: string; message?: string; quote?: { id: string } }> {
  const result = await updateQuoteContent(input);
  if (result.error || !result.quote) {
    return { ok: false, error: result.error || "Unable to save proposal.", message: result.error || "Unable to save proposal." };
  }
  revalidatePath("/quotes");
  return { ok: true, quote: { id: result.quote.id } };
}

/** Load a full proposal (with line items) for the RSM review dialog. */
export async function getQuoteWithItemsAction(quoteId: string) {
  const result = await getQuoteWithItems(quoteId);
  return result;
}