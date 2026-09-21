"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddQuoteDialog } from "@/components/quotes/add-quote-dialog";
import {
  approveProposalAction,
  createQuoteAction,
  getQuoteWithItemsAction,
  returnProposalForRevisionAction,
} from "@/app/quotes/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUOTE_APPROVAL_LABELS, type QuoteApprovalStatus, type QuoteRecord, type QuoteStatus } from "@/lib/types";
import type { PendingApprovalQueueItem } from "@/lib/revenue/quotes";

interface QuotesPageClientProps {
  initialQuotes: QuoteRecord[];
  initialError?: string | null;
  viewerIsRsm?: boolean;
  viewerId?: string | null;
  pendingApprovals?: PendingApprovalQueueItem[];
  pendingApprovalsError?: string | null;
}

interface ReviewQuote {
  id: string;
  quote_number?: string | null;
  status?: string | null;
  deal_id?: string | null;
  currency?: string | null;
  subtotal?: number | null;
  discount_total?: number | null;
  tax_total?: number | null;
  total?: number | null;
  terms?: string | null;
  notes?: string | null;
  companies?: { name?: string | null } | null;
  contacts?: { first_name?: string | null; last_name?: string | null } | null;
  deals?: { name?: string | null } | null;
  items?: Array<{
    description?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    discount_amount?: number | null;
    tax_amount?: number | null;
    line_total?: number | null;
  }>;
}

const approvalTone: Record<QuoteApprovalStatus, "secondary" | "success" | "warning" | "danger"> = {
  not_submitted: "secondary",
  pending_rsm_approval: "warning",
  approved: "success",
  returned_for_revision: "danger",
};

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString()}`;
}

function QuotesPageClient({
  initialQuotes,
  initialError = null,
  viewerIsRsm = false,
  viewerId = null,
  pendingApprovals = [],
  pendingApprovalsError = null,
}: QuotesPageClientProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRecord[]>(initialQuotes);
  const [queue, setQueue] = useState<PendingApprovalQueueItem[]>(pendingApprovals);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewQuote, setReviewQuote] = useState<ReviewQuote | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [acting, setActing] = useState(false);

  const nextNumber = useMemo(() => {
    const sequence = quotes.filter((q) => q.number.startsWith("QT-"));
    const max = sequence.reduce((highest, q) => {
      const numeric = Number(q.number.replace("QT-", ""));
      return Number.isFinite(numeric) && numeric > highest ? numeric : highest;
    }, 0);
    return `QT-${String(max + 1).padStart(4, "0")}`;
  }, [quotes]);

  const statusTone: Record<QuoteStatus, "success" | "warning" | "info" | "danger"> = {
    Draft: "info",
    Sent: "warning",
    Viewed: "info",
    Accepted: "success",
    Rejected: "danger",
    Expired: "danger",
  };

  // Keep the queue in sync when the server re-renders after an approval action.
  useEffect(() => {
    setQueue(pendingApprovals);
  }, [pendingApprovals]);

  const handleCreate = async (data: {
    customerName: string;
    dealName?: string;
    total: number;
    status: QuoteStatus;
    issueDate: string;
    expiryDate?: string;
    notes?: string;
  }) => {
    setBusy(true);
    const result = await createQuoteAction({
      customerName: data.customerName,
      dealName: data.dealName,
      total: data.total,
      status: data.status,
      currency: "USD",
      issue_date: data.issueDate,
      expiry_date: data.expiryDate || undefined,
      notes: data.notes,
    });
    setBusy(false);

    if (result.error || !result.quote) {
      setToast(result.error || "Failed to create quote");
      window.setTimeout(() => setToast(null), 2400);
      return;
    }

    const created: QuoteRecord = {
      id: result.quote.id,
      number: result.quote.number,
      customerName: result.quote.customerName,
      dealName: result.quote.dealName,
      total: result.quote.total,
      status: result.quote.status as QuoteStatus,
      createdAt: result.quote.createdAt,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate ?? "",
      currency: "USD",
      lineItems: [],
      subtotal: data.total,
      discount: 0,
      tax: 0,
      timeline: [],
    };
    setQuotes((prev) => [created, ...prev]);
    setAddOpen(false);
    setToast(`Quote ${created.number} created`);
    window.setTimeout(() => setToast(null), 2000);
  };

  const openReview = async (id: string) => {
    setSelectedId(id);
    setReviewOpen(true);
    setReviewLoading(true);
    setReviewError(null);
    setReturnOpen(false);
    setReturnReason("");
    const result = await getQuoteWithItemsAction(id);
    setReviewLoading(false);
    if (result.error || !result.quote) {
      setReviewError(result.error || "Unable to load proposal.");
      setReviewQuote(null);
      return;
    }
    setReviewQuote(result.quote as ReviewQuote);
  };

  const handleApprove = async () => {
    if (!selectedId || acting) return;
    setActing(true);
    const result = await approveProposalAction(selectedId);
    setActing(false);
    if (!result.ok) {
      setReviewError(result.error || result.message || "Unable to approve proposal.");
      return;
    }
    setToast("Proposal approved.");
    window.setTimeout(() => setToast(null), 2000);
    setQueue((prev) => prev.filter((item) => item.id !== selectedId));
    setReviewOpen(false);
    router.refresh();
  };

  const handleReturn = async () => {
    if (!selectedId || acting || !returnReason.trim()) return;
    setActing(true);
    const result = await returnProposalForRevisionAction(selectedId, returnReason.trim());
    setActing(false);
    if (!result.ok) {
      setReviewError(result.error || result.message || "Unable to return proposal.");
      return;
    }
    setToast("Proposal returned for revision.");
    window.setTimeout(() => setToast(null), 2000);
    setQueue((prev) => prev.filter((item) => item.id !== selectedId));
    setReviewOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Quotes</h1>
        <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}>
          + New Quote
        </Button>
      </div>

      {viewerIsRsm && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">RSM Approval Queue</h2>
            {queue.length > 0 && <Badge variant="warning">{queue.length} pending</Badge>}
          </div>

          {pendingApprovalsError ? (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Unable to load the approval queue: {pendingApprovalsError}
            </p>
          ) : queue.length === 0 ? (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              No proposals awaiting your approval right now.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {queue.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-ink">{item.number}</p>
                      <Badge variant="warning">Pending RSM Approval</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.customerName}
                      {item.companyName ? ` · ${item.companyName}` : ""}
                    </p>
                    {item.dealName && <p className="text-sm text-muted-foreground">Opportunity: {item.dealName}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>
                        BDO/Owner: <span className="font-medium text-ink">{item.ownerName}</span>
                      </span>
                      <span className="text-lg font-semibold tabular-nums text-ink">${formatMoney(item.total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted{" "}
                      {item.submittedForApprovalAt
                        ? new Date(item.submittedForApprovalAt).toLocaleString()
                        : "—"}
                    </p>
                    <div>
                      <Button size="sm" variant="outline" onClick={() => openReview(item.id)}>Review</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">All Proposals</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quotes.map((quote) => {
            const Tone = statusTone[quote.status];
            const approval = quote.approvalStatus ?? "not_submitted";
            return (
              <div
                key={quote.id}
                className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink">{quote.number}</p>
                    <Badge variant={Tone}>{quote.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={approvalTone[approval]}>{QUOTE_APPROVAL_LABELS[approval]}</Badge>
                    {approval === "returned_for_revision" && quote.rejectionReason && (
                      <span className="text-xs text-muted-foreground line-clamp-1">{quote.rejectionReason}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {quote.customerName}
                    {quote.dealName ? ` · ${quote.dealName}` : ""}
                  </p>
                  <p className="text-xl font-semibold tabular-nums text-ink">${quote.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(quote.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                  </p>
                </div>
              </div>
            );
          })}
          {quotes.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {initialError ? `Unable to load quotes: ${initialError}` : "No quotes found."}
            </p>
          )}
        </div>
      </section>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[90vh] w-[min(840px,92vw)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Review</DialogTitle>
            <DialogDescription>Review the proposal contents before approving or returning it.</DialogDescription>
          </DialogHeader>

          {reviewLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading proposal...</p>}

          {reviewError && !reviewLoading && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-[#991b1b]">{reviewError}</p>
          )}

          {reviewQuote && !reviewLoading && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Proposal</div>
                    <h3 className="mt-1 text-xl font-bold text-ink">{reviewQuote.quote_number || "Proposal"}</h3>
                  </div>
                  <Badge variant="warning">Pending RSM Approval</Badge>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div><span className="font-medium">Customer:</span> {reviewQuote.companies?.name || (reviewQuote.contacts?.first_name || reviewQuote.contacts?.last_name ? `${reviewQuote.contacts.first_name ?? ""} ${reviewQuote.contacts.last_name ?? ""}`.trim() : "—")}</div>
                  <div><span className="font-medium">Opportunity:</span> {reviewQuote.deals?.name || "—"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-ink">Line Items</div>
                {(reviewQuote.items ?? []).map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div>
                      <div className="font-medium text-ink">{item.description || "Service"}</div>
                      <div className="text-muted-foreground">{Number(item.quantity || 0)} × {Number(item.unit_price || 0)}</div>
                    </div>
                    <div className="text-right font-medium">{formatMoney(Number(item.line_total || 0))}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(Number(reviewQuote.subtotal ?? 0))}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>-{formatMoney(Number(reviewQuote.discount_total ?? 0))}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatMoney(Number(reviewQuote.tax_total ?? 0))}</span></div>
                <div className="mt-2 flex justify-between font-semibold"><span>Grand Total</span><span>{formatMoney(Number(reviewQuote.total ?? 0))}</span></div>
              </div>

              {reviewQuote.terms && (
                <div className="space-y-1">
                  <div className="font-semibold text-ink">Terms</div>
                  <p className="text-muted-foreground">{reviewQuote.terms}</p>
                </div>
              )}
              {reviewQuote.notes && (
                <div className="space-y-1">
                  <div className="font-semibold text-ink">Notes</div>
                  <p className="whitespace-pre-line text-muted-foreground">{reviewQuote.notes}</p>
                </div>
              )}
            </div>
          )}

          {returnOpen && (
            <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/20 p-4">
              <Label required>Reason for Return</Label>
              <Textarea
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                placeholder="Required — explain what the BDO needs to revise before this proposal can be approved."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setReturnOpen(false); setReturnReason(""); }}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={handleReturn} disabled={acting || !returnReason.trim()}>
                  {acting ? "Returning..." : "Confirm Return"}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Back</Button>
            {!returnOpen && (
              <>
                <Button variant="destructive" onClick={() => setReturnOpen(true)}>Return for Revision</Button>
                <Button onClick={handleApprove} disabled={acting}>{acting ? "Approving..." : "Approve Proposal"}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddQuoteDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleCreate}
        nextNumber={nextNumber}
        busy={busy}
      />

      {toast && (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export { QuotesPageClient };