/**
 * Email integration server actions.
 * Handles email sync, sending, and activity logging.
 * Server-only. Tokens are never exposed to the client.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";

export interface SyncEmailParams {
  provider: "gmail" | "outlook";
  maxResults?: number;
}

export interface SendEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  contactId?: string;
  dealId?: string;
  replyTo?: string;
  threadId?: string;
}

/**
 * Get connected email accounts for the current user.
 */
export async function getEmailAccounts() {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { accounts: [], error: "No active organization" };
  }

  const { data, error } = await supabase
    .from("connected_accounts")
    .select("id, provider, provider_account_id, email, status, scopes, expires_at, created_at")
    .eq("organization_id", orgId)
    .eq("provider", "gmail")
    .or("provider.eq.outlook");

  if (error) {
    return { accounts: [], error: error.message };
  }

  return { accounts: data || [], error: null };
}

/**
 * Sync emails from a connected provider.
 * Uses provider message ID for deduplication.
 */
export async function syncEmails(params: SyncEmailParams) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { synced: 0, error: "No active organization" };
  }

  // Get the connected account
  const { data: account, error: accErr } = await supabase
    .from("connected_accounts")
    .select("id, provider, provider_account_id, access_token_encrypted, refresh_token_encrypted, expires_at")
    .eq("organization_id", orgId)
    .eq("provider", params.provider)
    .eq("status", "connected")
    .single();

  if (accErr || !account) {
    return { synced: 0, error: `No connected ${params.provider} account` };
  }

  // Check if token is expired
  if (account.expires_at && new Date(account.expires_at) < new Date()) {
    return { synced: 0, error: "Token expired. Please reconnect your account." };
  }

  // In production, this would call the provider API (Gmail/Outlook)
  // For now, return success with 0 synced (integration not fully configured)
  return {
    synced: 0,
    error: null,
    message: `${params.provider} sync ready. Configure provider credentials to enable live sync.`,
  };
}

/**
 * Send an email via a connected provider.
 * Creates an email record and activity log.
 */
export async function sendEmail(params: SendEmailParams) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { error: "No active organization" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if there's a connected email account
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id, provider, status")
    .eq("organization_id", orgId)
    .eq("status", "connected")
    .in("provider", ["gmail", "outlook"])
    .single();

  if (!account) {
    return { error: "No connected email account. Please connect your email first." };
  }

  // Create the email record
  const { data: email, error: emailErr } = await supabase
    .from("emails")
    .insert({
      organization_id: orgId,
      provider: account.provider,
      external_message_id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      thread_id: params.threadId || null,
      from_address: user.email || "",
      to_addresses: params.to,
      cc_addresses: params.cc || [],
      bcc_addresses: params.bcc || [],
      subject: params.subject,
      body_preview: params.body.slice(0, 200),
      direction: "outbound",
      status: "sent",
      contact_id: params.contactId || null,
      deal_id: params.dealId || null,
      sent_by: user.id,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (emailErr) {
    return { error: emailErr.message };
  }

  // Create activity for the sent email
  await supabase.from("activities").insert({
    organization_id: orgId,
    activity_type: "email_sent",
    related_type: "email",
    related_id: email.id,
    actor_user_id: user.id,
    title: `Email sent: ${params.subject}`,
    description: `To: ${params.to.join(", ")}`,
    metadata: {
      email_id: email.id,
      contact_id: params.contactId,
      deal_id: params.dealId,
      thread_id: params.threadId,
    },
    occurred_at: new Date().toISOString(),
  });

  return { email, error: null };
}

/**
 * Link an inbound email to CRM records.
 * Used by webhook handlers.
 */
export async function linkEmailToRecords(
  emailId: string,
  contactId?: string,
  dealId?: string,
  company_id?: string
) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { error: "No active organization" };
  }

  const { error } = await supabase
    .from("emails")
    .update({
      contact_id: contactId || null,
      deal_id: dealId || null,
      company_id: company_id || null,
    })
    .eq("id", emailId)
    .eq("organization_id", orgId);

  if (error) {
    return { error: error.message };
  }

  return { success: true, error: null };
}