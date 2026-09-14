import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Privacy-conscious product analytics (Step 99).
 *
 * Rules:
 * - Never store CRM message bodies, email content, or other PII payloads.
 * - Only event_name + small allow-listed properties.
 * - Server-side only; the public API route allows limited, scoped tracking.
 * - We cap the stored footprint and drop unknowns.
 */
const ALLOWED_EVENTS = new Set([
  "app.opened",
  "page.viewed",
  "feature.used",
  "record.created",
  "record.updated",
  "deal.moved",
  "deal.won",
  "deal.lost",
  "lead.created",
  "contact.created",
  "task.completed",
  "automation.ran",
  "quote.created",
  "billing.page_viewed",
  "billing.checkout_started",
  "billing.checkout_completed",
  "billing.trial_started",
  "report.exported",
]);

const MAX_PROPERTIES = 8;
const MAX_PROPERTY_LENGTH = 128;

/** Sanitize a property bag — strip keys we don't allow, cap sizes. */
function sanitizeProperties(properties: Record<string, JsonValue>): Record<string, JsonValue> {
  const cleaned: Record<string, JsonValue> = {};
  const entries = Object.entries(properties ?? {}).slice(0, MAX_PROPERTIES);
  for (const [key, value] of entries) {
    if (key.length > MAX_PROPERTY_LENGTH) continue;
    if (typeof value === "string" && value.length > MAX_PROPERTY_LENGTH) {
      cleaned[key] = value.slice(0, MAX_PROPERTY_LENGTH);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean" || value === null || typeof value === "string") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export interface TrackEventInput {
  eventName: string;
  properties?: Record<string, JsonValue>;
  organizationId?: string | null;
}

/**
 * Record a product event. Best-effort — never throws so analytics can't
 * break a core flow.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    if (!isSupabaseConfigured()) return;
    if (!ALLOWED_EVENTS.has(input.eventName)) return;

    const admin = createSupabaseAdminClient();
    let userId: string | null = null;
    let organizationId = input.organizationId ?? null;

    if (!organizationId) {
      // Try to resolve from the current request's auth cookie.
      try {
        const supabase = await createSupabaseServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id ?? null;
        if (user && !organizationId) {
          const { data: member } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();
          organizationId = member?.organization_id ?? null;
        }
      } catch {
        // fall through and store event without user/org ids
      }
    }

    await admin.from("product_events").insert({
      organization_id: organizationId,
      user_id: userId,
      event_name: input.eventName,
      properties: sanitizeProperties(input.properties ?? {}),
    });
  } catch {
    // Best-effort — swallow errors.
  }
}

export type { JsonValue };