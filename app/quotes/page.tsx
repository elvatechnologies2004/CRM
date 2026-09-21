import { QuotesPageClient } from "@/components/quotes/quotes-page-client";
import { getSalesAccessScope } from "@/lib/crm/scope";
import { getAllQuotes, getPendingProposalApprovalQueue } from "@/lib/revenue/quotes";
import type { QuoteRecord } from "@/lib/types";

export const revalidate = 0;

export default async function QuotesPage() {
  const [{ quotes, error }, scope] = await Promise.all([getAllQuotes(), getSalesAccessScope()]);

  const viewerIsRsm = scope?.role === "rsm";
  const viewerId = scope?.userId ?? null;

  // Phase 3 — RSM approval queue is only served to RSMs (and scoped to their
  // regional team server-side).
  let pendingApprovals: Awaited<ReturnType<typeof getPendingProposalApprovalQueue>>["items"] = [];
  let pendingApprovalsError: string | null = null;
  if (viewerIsRsm) {
    const queue = await getPendingProposalApprovalQueue();
    pendingApprovals = queue.items;
    pendingApprovalsError = queue.error;
  }

  let initialQuotes: QuoteRecord[];
  if (error) {
    initialQuotes = [];
  } else {
    initialQuotes = quotes;
  }

  return (
    <QuotesPageClient
      initialQuotes={initialQuotes}
      initialError={error}
      viewerIsRsm={viewerIsRsm}
      viewerId={viewerId}
      pendingApprovals={pendingApprovals}
      pendingApprovalsError={pendingApprovalsError}
    />
  );
}