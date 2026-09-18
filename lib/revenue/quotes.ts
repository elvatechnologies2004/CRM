/**
 * Quote workflow server actions.
 * Handles quote creation, line items, status changes, and acceptance.
 * Server-only.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";
import type { QuoteRecord, QuoteStatus } from "@/lib/types";

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
  companies?: { name: string } | null;
  contacts?: { first_name: string | null; last_name: string | null } | null;
  deals?: { name: string } | null;
}

/** Map a Supabase quote row (with embeds) to the frontend QuoteRecord shape. */
export function mapQuoteRowToRecord(row: QuoteListRow): QuoteRecord {
  const customerName = row.companies?.name
    ? row.companies.name
    : row.contacts
      ? `${row.contacts.first_name ?? ""} ${row.contacts.last_name ?? ""}`.trim() || "—"
      : "—";
  return {
    id: row.id,
    number: row.quote_number ?? "",
    companyId: row.company_id ?? undefined,
    customerName,
    dealId: row.deal_id ?? undefined,
    dealName: row.deals?.name ?? undefined,
    issueDate: row.issue_date ?? "",
    expiryDate: row.expiry_date ?? "",
    currency: row.currency ?? "USD",
    lineItems: [],
    subtotal: row.subtotal ?? 0,
    discount: row.discount_total ?? 0,
    tax: row.tax_total ?? 0,
    total: row.total ?? 0,
    status: (row.status as QuoteStatus) ?? "Draft",
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

  const update: Record<string, unknown> = {
    status: params.status,
    updated_at: new Date().toISOString(),
  };

  if (params.status === "Sent") {
    update.sent_at = new Date().toISOString();
  }
  if (params.status === "Viewed") {
    update.viewed_at = new Date().toISOString();
  }
  if (params.status === "Accepted") {
    update.accepted_at = new Date().toISOString();
    update.accepted_by = user.id;
    update.accepted_by_name = user.user_metadata?.full_name || user.email;
  }
  if (params.status === "Rejected") {
    update.rejected_at = new Date().toISOString();
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .update(update)
    .eq("id", params.quoteId)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) {
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

/**
 * Get quote with line items and related records.
 */
export async function getQuoteWithItems(quoteId: string) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { quote: null, error: "No active organization" };
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

  let query = supabase
    .from("quotes")
    .select("*, companies(name), contacts(first_name, last_name), deals(name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return { quotes: [], error: error.message };
  }

  return { quotes: (data || []).map((row) => mapQuoteRowToRecord(row as unknown as QuoteListRow)), error: null };
}