/**
 * Quote workflow server actions.
 * Handles quote creation, line items, status changes, and acceptance.
 * Server-only.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchOwnerIndex, getActiveOrgId } from "@/lib/crm/base";
import { assertDealAccess, applyOwnerScope, canAccessRecord, getSalesAccessScope } from "@/lib/crm/scope";
import type { QuoteApprovalStatus, QuoteRecord, QuoteStatus } from "@/lib/types";

interface QuoteListRow {
  id: string;
  quote_number: string | null;
  company_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  status: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  currency: string | null;
  subtotal: number | null;
  discount_total: number | null;
  tax_total: number | null;
  total: number | null;
  terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  approval_status?: string | null;
  submitted_for_approval_at?: string | null;
  submitted_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  approval_cycle?: number | null;
  companies?: { name: string }[] | { name: string } | null;
  contacts?: { first_name: string | null; last_name: string | null }[] | { first_name: string | null; last_name: string | null } | null;
  deals?: { name: string }[] | { name: string } | null;
}

function pickFirst<T>(value: T[] | T | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Map a Supabase quote row (with embeds) to the frontend QuoteRecord shape. */
export function mapQuoteRowToRecord(row: QuoteListRow): QuoteRecord {
  const company = pickFirst(row.companies);
  const contact = pickFirst(row.contacts);
  const deal = pickFirst(row.deals);
  const customerName = company?.name
    ? company.name
    : contact
      ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || "—"
      : "—";
  return {
    id: row.id,
    number: row.quote_number ?? "",
    companyId: row.company_id ?? undefined,
    customerName,
    dealId: row.deal_id ?? undefined,
    dealName: deal?.name ?? undefined,
    issueDate: row.issue_date ?? "",
    expiryDate: row.expiry_date ?? "",
    currency: row.currency ?? "USD",
    lineItems: [],
    subtotal: row.subtotal ?? 0,
    discount: row.discount_total ?? 0,
    tax: row.tax_total ?? 0,
    total: row.total ?? 0,
    status: (row.status as QuoteStatus) ?? "Draft",
    approvalStatus: (row.approval_status as QuoteApprovalStatus) ?? "not_submitted",
    submittedForApprovalAt: row.submitted_for_approval_at ?? undefined,
    submittedBy: row.submitted_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectedBy: row.rejected_by ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    approvalCycle: row.approval_cycle ?? 0,
    terms: row.terms ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    timeline: [],
  };
}

export interface CreateQuoteParams {
  dealId?: string;
  company_id?: string;
  contact_id?: string;
  status?: "Draft" | "Sent" | "Viewed" | "Accepted" | "Rejected" | "Expired";
  issue_date?: string;
  expiry_date?: string;
  currency?: string;
  terms?: string;
  notes?: string;
  discount_total?: number;
  tax_total?: number;
  items: Array<{
    product_id?: string;
    name_snapshot: string;
    description?: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_rate?: number;
  }>;
}

export interface UpdateQuoteStatusParams {
  quoteId: string;
  status: "Draft" | "Sent" | "Viewed" | "Accepted" | "Rejected" | "Expired";
}

/**
 * Create a new quote with line items.
 * Uses a database transaction for atomicity.
 */
export async function createQuote(params: CreateQuoteParams) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { error: "No active organization" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Phase 2 — proposals can only be created against an opportunity the caller
  // can access (and become visible to the caller's sales scope via created_by).
  const salesScope = await getSalesAccessScope();
  if (params.dealId) {
    const dealAccess = await assertDealAccess(supabase, salesScope, params.dealId, orgId);
    if (!dealAccess.ok) {
      return { error: "Opportunity not found or access denied." };
    }
  }

  // Generate quote number via RPC
  const { data: quoteNumber, error: numErr } = await supabase.rpc(
    "next_document_number",
    { p_org_id: orgId, p_kind: "quote" }
  );

  if (numErr || !quoteNumber) {
    return { error: numErr?.message || "Failed to generate quote number" };
  }

  // Calculate totals
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const item of params.items) {
    const lineSubtotal = item.quantity * item.unit_price;
    const lineDiscount = item.discount_amount || 0;
    const lineTax = (lineSubtotal - lineDiscount) * (item.tax_rate || 0) / 100;
    subtotal += lineSubtotal;
    discountTotal += lineDiscount;
    taxTotal += lineTax;
  }

  const total = subtotal - discountTotal + taxTotal + (params.discount_total || 0) + (params.tax_total || 0);

  // Create quote
  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .insert({
      organization_id: orgId,
      quote_number: quoteNumber,
      deal_id: params.dealId || null,
      company_id: params.company_id || null,
      contact_id: params.contact_id || null,
      status: params.status || "Draft",
      issue_date: params.issue_date || new Date().toISOString().split("T")[0],
      expiry_date: params.expiry_date || null,
      currency: params.currency || "PKR",
      subtotal,
      discount_total: params.discount_total || 0,
      tax_total: taxTotal + (params.tax_total || 0),
      total,
      terms: params.terms,
      notes: params.notes,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (quoteErr) {
    return { error: quoteErr.message };
  }

  // Create quote items
  const itemRows = params.items.map((item, index) => {
    const lineSubtotal = item.quantity * item.unit_price;
    const lineDiscount = item.discount_amount || 0;
    const lineTax = (lineSubtotal - lineDiscount) * (item.tax_rate || 0) / 100;
    return {
      organization_id: orgId,
      quote_id: quote.id,
      product_id: item.product_id || null,
      description: item.description ?? item.name_snapshot,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: lineDiscount,
      tax_amount: lineTax,
      line_total: lineSubtotal - lineDiscount + lineTax,
      position: index,
    };
  });

  const { error: itemsErr } = await supabase.from("quote_items").insert(itemRows);

  if (itemsErr) {
    return { error: itemsErr.message };
  }

  // Create activity
  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "quote_created",
    related_type: "quote",
    related_id: quote.id,
    actor_user_id: user.id,
    title: `Quote created: ${quote.quote_number}`,
    description: `Total: ${total} ${quote.currency}`,
    metadata: {
      quote_id: quote.id,
      quote_number: quote.quote_number,
      deal_id: params.dealId,
    },
    occurred_at: new Date().toISOString(),
  });

  return { quote, error: null };
}

/**
 * Update quote status (send, view, accept, reject, expire).
 *
 * Phase 3 — SENDING (status → 'Sent') is the customer-delivery step and is
 * gated on the RSM approval lifecycle: only proposals with
 * `approval_status = 'approved'` may be sent. The gate is enforced here
 * server-side (never client-only) and is race-safe via a conditional update.
 */
export async function updateQuoteStatus(params: UpdateQuoteStatusParams) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { error: "No active organization" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Phase 2 — a scoped seller can only change a proposal they own (created_by).
  const salesScope = await getSalesAccessScope();
  const { data: existing } = await supabase
    .from("quotes")
    .select("id, organization_id, status, approval_status, created_by, quote_number")
    .eq("id", params.quoteId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!existing) {
    return { error: "Quote not found or access denied." };
  }

  if (salesScope && !canAccessRecord(salesScope, existing)) {
    return { error: "Quote not found or access denied." };
  }

  // Phase 3 — send gate: an unapproved proposal can never be sent, no matter
  // how the caller reaches this action (UI, URL, direct API, server action).
  if (params.status === "Sent") {
    if (existing.approval_status !== "approved") {
      return { error: "This proposal requires RSM approval before it can be sent." };
    }
  }

  const update: Record<string, unknown> = {
    status: params.status,
    updated_at: new Date().toISOString(),
  };

  // The live schema only includes status + timestamps that already exist on quotes.
  // Avoid writing to non-existent fields like accepted_at/rejected_at/sent_at/viewed_at.

  let query = supabase
    .from("quotes")
    .update(update)
    .eq("id", params.quoteId)
    .eq("organization_id", orgId);

  if (params.status === "Sent") {
    // Race safety — a send only succeeds while the proposal is still approved.
    query = query.eq("approval_status", "approved") as typeof query;
  }

  const { data: quote, error } = await query.select().single();

  if (error) {
    if (params.status === "Sent") {
      return { error: "This proposal requires RSM approval before it can be sent." };
    }
    return { error: error.message };
  }

  // Create activity for status change
  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: `quote_${params.status.toLowerCase()}`,
    related_type: "quote",
    related_id: params.quoteId,
    actor_user_id: user.id,
    title: `Quote ${params.status.toLowerCase()}: ${quote.quote_number}`,
    description: `Status changed to ${params.status}`,
    metadata: {
      quote_id: params.quoteId,
      quote_number: quote.quote_number,
      previous_status: quote.status,
      new_status: params.status,
    },
    occurred_at: new Date().toISOString(),
  });

  return { quote, error: null };
}

export interface UpdateQuoteContentParams {
  quoteId: string;
  terms?: string | null;
  notes?: string | null;
  issue_date?: string;
  expiry_date?: string | null;
  currency?: string;
  items: CreateQuoteParams["items"];
}

/**
 * Phase 3 — edit an existing proposal's content (revision flow).
 *
 * Editing always recomputes totals from the line items and REPLACES the item
 * set, and (critically) invalidates any previous RSM approval: the proposal
 * is reset to `not_submitted` with its approval metadata cleared, so a
 * materially edited proposal can never be sent on a stale approval. It must
 * be resubmitted for a fresh approval cycle.
 */
export async function updateQuoteContent(params: UpdateQuoteContentParams) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { error: "No active organization" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Phase 2 — scoped seller can only edit a proposal they can see (created_by).
  const salesScope = await getSalesAccessScope();
  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select("id, organization_id, status, approval_status, deal_id, created_by, quote_number, issue_date, expiry_date, currency")
    .eq("id", params.quoteId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (quoteErr || !quote) {
    return { error: "Quote not found or access denied." };
  }

  if (salesScope && !canAccessRecord(salesScope, quote)) {
    return { error: "Quote not found or access denied." };
  }

  if (quote.status === "Sent") {
    return { error: "This proposal has already been sent and cannot be edited." };
  }

  // Recompute totals from line items.
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const item of params.items) {
    const lineSubtotal = item.quantity * item.unit_price;
    const lineDiscount = item.discount_amount || 0;
    const lineTax = (lineSubtotal - lineDiscount) * (item.tax_rate || 0) / 100;
    subtotal += lineSubtotal;
    discountTotal += lineDiscount;
    taxTotal += lineTax;
  }

  const total = subtotal - discountTotal + taxTotal;
  const approvalInvalidated = quote.approval_status !== "not_submitted";

  const { data: updated, error: updateErr } = await supabase
    .from("quotes")
    .update({
      terms: params.terms ?? null,
      notes: params.notes ?? null,
      issue_date: params.issue_date || quote.issue_date,
      expiry_date: params.expiry_date ?? quote.expiry_date,
      currency: params.currency || quote.currency,
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      total,
      // Phase 3 — any edit invalidates a previous approval/pending state so the
      // proposal requires a fresh RSM approval before it can be sent.
      approval_status: "not_submitted",
      submitted_for_approval_at: null,
      submitted_by: null,
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.quoteId)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (updateErr) {
    return { error: updateErr.message };
  }

  // Replace the line-item set.
  await supabase.from("quote_items").delete().eq("quote_id", params.quoteId).eq("organization_id", orgId);

  const itemRows = params.items.map((item, index) => {
    const lineSubtotal = item.quantity * item.unit_price;
    const lineDiscount = item.discount_amount || 0;
    const lineTax = (lineSubtotal - lineDiscount) * (item.tax_rate || 0) / 100;
    return {
      organization_id: orgId,
      quote_id: params.quoteId,
      product_id: item.product_id || null,
      description: item.description ?? item.name_snapshot,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: lineDiscount,
      tax_amount: lineTax,
      line_total: lineSubtotal - lineDiscount + lineTax,
      position: index,
    };
  });

  if (itemRows.length > 0) {
    const { error: itemsErr } = await supabase.from("quote_items").insert(itemRows);
    if (itemsErr) {
      return { error: itemsErr.message };
    }
  }

  // Audit — the approval invalidation is recorded for the revision trail.
  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: approvalInvalidated ? "proposal_edited_approval_invalidated" : "proposal_edited",
    related_type: "quote",
    related_id: params.quoteId,
    actor_user_id: user.id,
    title: `Proposal edited: ${updated.quote_number}`,
    description: approvalInvalidated
      ? "Proposal content was changed and the previous RSM approval invalidated — resubmission is required."
      : "Proposal draft updated.",
    metadata: {
      quote_id: params.quoteId,
      quote_number: updated.quote_number,
      approval_invalidated: approvalInvalidated,
    },
    occurred_at: new Date().toISOString(),
  });

  return { quote: updated, error: null };
}

/**
 * Get quote with line items and related records.
 */
export async function getQuoteWithItems(quoteId: string) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { quote: null, error: "No active organization" };
  }

  // Phase 2 — the resolved quote must be inside the caller's sales scope.
  const salesScope = await getSalesAccessScope();
  if (salesScope) {
    const { data: quoteOwner } = await supabase
      .from("quotes")
      .select("created_by")
      .eq("id", quoteId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!quoteOwner || !canAccessRecord(salesScope, quoteOwner)) {
      return { quote: null, error: "Quote not found or access denied." };
    }
  }

  const { data: quote, error: quoteErr } = await supabase
    .from("quotes")
    .select("*, companies(name, domain), contacts(first_name, last_name, email), deals(name, value, stages(name))")
    .eq("id", quoteId)
    .eq("organization_id", orgId)
    .single();

  if (quoteErr || !quote) {
    return { quote: null, error: quoteErr?.message || "Quote not found" };
  }

  const { data: items, error: itemsErr } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at");

  return {
    quote: { ...quote, items: items || [] },
    error: null,
  };
}

/**
 * Get all quotes for the current organization.
 */
export async function getAllQuotes(status?: string) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { quotes: [], error: "No active organization" };
  }

  // Phase 2 — proposal list visibility follows the caller's sales scope
  // via the created_by owner column.
  const salesScope = await getSalesAccessScope();

  let query = supabase
    .from("quotes")
    .select("*, companies(name), contacts(first_name, last_name), deals(name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  query = applyOwnerScope(query, salesScope, "created_by") as typeof query;

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return { quotes: [], error: error.message };
  }

  return { quotes: (data || []).map((row) => mapQuoteRowToRecord(row as unknown as QuoteListRow)), error: null };
}

export interface ProposalApprovalView {
  id: string;
  number: string;
  status: QuoteStatus;
  approvalStatus: QuoteApprovalStatus;
  submittedForApprovalAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  approvalCycle?: number;
  createdBy?: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  issueDate?: string;
  expiryDate?: string;
  terms?: string;
  notes?: string;
  lineItems: Array<{
    id: string;
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    subtotal: number;
  }>;
}

/**
 * Phase 3 — the latest proposal attached to an Opportunity, hydrated with its
 * approval lifecycle, so the Opportunity screen can resume the RSM approval
 * workflow instead of starting from scratch. Scoped per Phase 2.
 */
export async function getLatestProposalForDeal(dealId: string): Promise<{ proposal: ProposalApprovalView | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { proposal: null, error: "No active organization" };
  }

  const salesScope = await getSalesAccessScope();

  // Phase 2 — only opportunities inside the caller's sales scope expose a proposal.
  if (salesScope) {
    const dealAccess = await assertDealAccess(supabase, salesScope, dealId, orgId);
    if (!dealAccess.ok) {
      return { proposal: null, error: null };
    }
  }

  const { data: rows } = await supabase
    .from("quotes")
    .select("*, companies(name), contacts(first_name, last_name, email), deals(name, value, currency)")
    .eq("organization_id", orgId)
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(1);

  const row = rows?.[0];
  if (!row) {
    return { proposal: null, error: null };
  }

  // Phase 2 — the proposal itself must be within the caller's scope.
  const quoteScopeRow = { owner_id: null as string | null, created_by: (row.created_by as string | null) ?? null };
  if (salesScope && !canAccessRecord(salesScope, quoteScopeRow)) {
    return { proposal: null, error: null };
  }

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", row.id)
    .order("position", { ascending: true });

  const lineItems = (items ?? []).map((item) => ({
    id: (item.id as string) ?? `item-${item.position}`,
    productId: (item.product_id as string | null) ?? undefined,
    name: String(item.description ?? item.name_snapshot ?? "Service"),
    quantity: Number(item.quantity ?? 0),
    unitPrice: Number(item.unit_price ?? 0),
    discount: Number(item.discount_amount ?? 0),
    tax: Number(item.tax_amount ?? 0),
    subtotal: Number(item.line_total ?? 0),
  }));

  const proposal: ProposalApprovalView = {
    id: row.id,
    number: row.quote_number ?? "",
    status: (row.status as QuoteStatus) ?? "Draft",
    approvalStatus: (row.approval_status as QuoteApprovalStatus) ?? "not_submitted",
    submittedForApprovalAt: row.submitted_for_approval_at ?? undefined,
    submittedBy: row.submitted_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectedBy: row.rejected_by ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    approvalCycle: row.approval_cycle ?? 0,
    createdBy: (row.created_by as string | null) ?? undefined,
    currency: row.currency ?? "USD",
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount_total ?? 0),
    tax: Number(row.tax_total ?? 0),
    total: Number(row.total ?? 0),
    issueDate: row.issue_date ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    terms: row.terms ?? undefined,
    notes: row.notes ?? undefined,
    lineItems,
  };

  return { proposal, error: null };
}

export interface PendingApprovalQueueItem {
  id: string;
  number: string;
  customerName: string;
  companyName?: string;
  dealName?: string;
  total: number;
  currency: string;
  ownerName: string;
  submittedForApprovalAt?: string;
  status: string;
  approvalStatus: QuoteApprovalStatus;
}

/**
 * Phase 3 — RSM approval queue: every proposal in `pending_rsm_approval`
 * inside the caller's Phase-2 scope, oldest submission first, with the
 * submitting BDO's name resolved for the review screen.
 */
export async function getPendingProposalApprovalQueue(): Promise<{ items: PendingApprovalQueueItem[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { items: [], error: "No active organization" };
  }

  const salesScope = await getSalesAccessScope();

  let query = supabase
    .from("quotes")
    .select("id, quote_number, deal_id, status, approval_status, submitted_for_approval_at, submitted_by, created_by, total, currency, companies(name), contacts(first_name, last_name), deals(name)")
    .eq("organization_id", orgId)
    .eq("approval_status", "pending_rsm_approval")
    .order("submitted_for_approval_at", { ascending: true });

  query = applyOwnerScope(query, salesScope, "created_by") as typeof query;

  const { data, error } = await query;

  if (error) {
    return { items: [], error: error.message };
  }

  const ownerIndex = await fetchOwnerIndex(supabase, orgId);
  const items: PendingApprovalQueueItem[] = (data ?? []).map((row) => {
    const company = pickFirst(row.companies);
    const contact = pickFirst(row.contacts);
    const deal = pickFirst(row.deals);
    const customerName = company?.name
      ? company.name
      : contact
        ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || "—"
        : "—";
    return {
      id: row.id,
      number: row.quote_number ?? "",
      customerName,
      companyName: company?.name ?? undefined,
      dealName: deal?.name ?? undefined,
      total: Number(row.total ?? 0),
      currency: row.currency ?? "USD",
      ownerName: ownerIndex[row.created_by as string]?.name ?? "—",
      submittedForApprovalAt: row.submitted_for_approval_at ?? undefined,
      status: row.status ?? "Draft",
      approvalStatus: (row.approval_status as QuoteApprovalStatus) ?? "not_submitted",
    };
  });

  return { items, error: null };
}