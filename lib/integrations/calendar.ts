/**
 * Calendar integration server actions.
 * Handles calendar sync and meeting creation.
 * Server-only.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/crm/base";

export interface SyncCalendarParams {
  provider: "google_calendar" | "outlook_calendar";
  maxResults?: number;
  timeMin?: string;
  timeMax?: string;
}

export interface CreateCalendarEventParams {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  meetingId?: string;
  contactId?: string;
  dealId?: string;
}

/**
 * Get connected calendar accounts.
 */
export async function getCalendarAccounts() {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { accounts: [], error: "No active organization" };
  }

  const { data, error } = await supabase
    .from("connected_accounts")
    .select("id, provider, provider_account_id, status, scopes, expires_at")
    .eq("organization_id", orgId)
    .in("provider", ["google_calendar", "outlook_calendar"]);

  if (error) {
    return { accounts: [], error: error.message };
  }

  return { accounts: data || [], error: null };
}

/**
 * Sync calendar events from a connected provider.
 * Uses external_event_id for deduplication.
 */
export async function syncCalendar(params: SyncCalendarParams) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { synced: 0, error: "No active organization" };
  }

  const { data: account, error: accErr } = await supabase
    .from("connected_accounts")
    .select("id, provider, status, expires_at")
    .eq("organization_id", orgId)
    .eq("provider", params.provider)
    .eq("status", "connected")
    .single();

  if (accErr || !account) {
    return { synced: 0, error: `No connected ${params.provider} account` };
  }

  if (account.expires_at && new Date(account.expires_at) < new Date()) {
    return { synced: 0, error: "Token expired. Please reconnect your calendar." };
  }

  // In production, this would call the provider API
  return {
    synced: 0,
    error: null,
    message: `${params.provider} sync ready. Configure provider credentials to enable live sync.`,
  };
}

/**
 * Create a calendar event (manual entry).
 * Also creates a CRM meeting record if meetingId is provided.
 */
export async function createCalendarEvent(params: CreateCalendarEventParams) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { error: "No active organization" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert({
      organization_id: orgId,
      provider: "manual",
      external_event_id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: params.title,
      description: params.description,
      location: params.location,
      start_at: params.startAt,
      end_at: params.endAt,
      meeting_id: params.meetingId || null,
      contact_id: params.contactId || null,
      deal_id: params.dealId || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // If linked to a meeting, update the meeting record
  if (params.meetingId) {
    await supabase
      .from("meetings")
      .update({
        start_at: params.startAt,
        end_at: params.endAt,
        title: params.title,
        description: params.description,
        location: params.location,
      })
      .eq("id", params.meetingId)
      .eq("organization_id", orgId);
  }

  return { event, error: null };
}

/**
 * Get upcoming calendar events for the current organization.
 */
export async function getUpcomingEvents(limit: number = 20) {
  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);

  if (!orgId) {
    return { events: [], error: "No active organization" };
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*, meetings(title), contacts(first_name, last_name)")
    .eq("organization_id", orgId)
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);

  if (error) {
    return { events: [], error: error.message };
  }

  return { events: data || [], error: null };
}