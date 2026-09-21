/**
 * AI Assistant - main entry point for the /ai page.
 * Provides natural language queries over CRM data.
 * Server-only.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId, type DbClient } from "@/lib/crm/base";
import { applyOwnerScope, getSalesAccessScope } from "@/lib/crm/scope";
import { generateAICompletion } from "@/lib/ai/provider";

export interface AIAssistantRequest {
  query: string;
  context?: Record<string, unknown>;
}

export interface AIAssistantResponse {
  answer: string;
  provider: string;
  model: string;
  dataUsed?: string[];
}

/**
 * Process a natural language query about the CRM.
 * Uses read-only tools to gather context, then asks AI to answer.
 */
export async function askAIAssistant(
  request: AIAssistantRequest
): Promise<AIAssistantResponse> {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    throw new Error("No active organization");
  }

  // Gather CRM context based on the query
  const context = await gatherCRMContext(request.query, supabase, orgId);

  const systemPrompt = `You are a helpful CRM assistant. Answer the user's question using the CRM data provided. Be concise and specific. If you cannot answer with the data provided, say so. Do NOT make up data.`;

  const userPrompt = `Question: ${request.query}\n\nCRM Data:\n${JSON.stringify(context, null, 2)}`;

  const response = await generateAICompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxOutputTokens: 2048,
  });

  return {
    answer: response.text,
    provider: response.provider,
    model: response.model,
    dataUsed: Object.keys(context),
  };
}

/**
 * Gather CRM context based on the user's query.
 * Uses read-only tools to fetch relevant data.
 */
async function gatherCRMContext(
  query: string,
  supabase: DbClient,
  orgId: string
): Promise<Record<string, unknown>> {
  const lowerQuery = query.toLowerCase();
  const context: Record<string, unknown> = {};

  // Phase 2 — the assistant answers strictly from data inside the caller's
  // sales scope (owner-scoped leads/deals/tasks and creator-scoped quotes).
  const salesScope = await getSalesAccessScope();

  // Always include basic org stats
  let leadsQ = supabase
    .from("leads")
    .select("id, name, status, score, source, owner_id, created_at")
    .eq("organization_id", orgId)
    .limit(50);
  leadsQ = applyOwnerScope(leadsQ, salesScope, "owner_id") as typeof leadsQ;

  let dealsQ = supabase
    .from("deals")
    .select("id, name, value, probability, owner_id, stage_id, stages(name)")
    .eq("organization_id", orgId)
    .limit(50);
  dealsQ = applyOwnerScope(dealsQ, salesScope, "owner_id") as typeof dealsQ;

  let tasksQ = supabase
    .from("tasks")
    .select("id, title, status, priority, owner_id, due_at")
    .eq("organization_id", orgId)
    .neq("status", "Completed")
    .limit(50);
  tasksQ = applyOwnerScope(tasksQ, salesScope, "owner_id") as typeof tasksQ;

  const [leadsRes, dealsRes, tasksRes] = await Promise.all([leadsQ, dealsQ, tasksQ]);

  context.leads = leadsRes.data || [];
  context.deals = dealsRes.data || [];
  context.openTasks = tasksRes.data || [];

  // If query mentions specific record types, fetch more detail
  if (lowerQuery.includes("company") || lowerQuery.includes("customer")) {
    const { data } = await supabase
      .from("companies")
      .select("id, name, domain, industry, annual_revenue")
      .eq("organization_id", orgId)
      .limit(20);
    context.companies = data || [];
  }

  if (lowerQuery.includes("contact")) {
    const { data } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, company_id")
      .eq("organization_id", orgId)
      .limit(20);
    context.contacts = data || [];
  }

  if (lowerQuery.includes("deal") || lowerQuery.includes("opportunity") || lowerQuery.includes("pipeline")) {
    // Already have deals above
  }

  if (lowerQuery.includes("invoice") || lowerQuery.includes("revenue") || lowerQuery.includes("payment")) {
    let invoicesQ = supabase
      .from("invoices")
      .select("id, invoice_number, status, total, balance, due_date, created_by")
      .eq("organization_id", orgId)
      .limit(20);
    invoicesQ = applyOwnerScope(invoicesQ, salesScope, "created_by") as typeof invoicesQ;
    const { data } = await invoicesQ;
    context.invoices = data || [];
  }

  if (lowerQuery.includes("quote")) {
    let quotesQ = supabase
      .from("quotes")
      .select("id, quote_number, status, total, created_by")
      .eq("organization_id", orgId)
      .limit(20);
    quotesQ = applyOwnerScope(quotesQ, salesScope, "created_by") as typeof quotesQ;
    const { data } = await quotesQ;
    context.quotes = data || [];
  }

  if (lowerQuery.includes("meeting") || lowerQuery.includes("calendar")) {
    let meetingsQ = supabase
      .from("meetings")
      .select("id, title, start_at, status, owner_id")
      .eq("organization_id", orgId)
      .order("start_at", { ascending: false })
      .limit(10);
    meetingsQ = applyOwnerScope(meetingsQ, salesScope, "owner_id") as typeof meetingsQ;
    const { data } = await meetingsQ;
    context.meetings = data || [];
  }

  return context;
}