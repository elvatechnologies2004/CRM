import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { emailProvider, isEmailDeliveryConfigured } from "./provider";
import { EMAIL_TEMPLATES, type EmailTemplateData, type EmailTemplateKey } from "./templates";

/**
 * Dispatcher for transactional email (Step 100).
 *
 * Flow:
 *   1. Resolve template to subject/html.
 *   2. Attempt delivery through the configured provider.
 *   3. Record every attempt in `transactional_email_logs` (status computed
 *      from the real provider result — never fakes a "sent").
 *
 * Never throws. Returns a result so callers can surface errors.
 */

/**
 * Send a transactional email to one or more recipients.
 */
export async function sendTransactionalEmail(params: {
  organizationId?: string | null;
  to: string[];
  template: EmailTemplateKey;
  data: EmailTemplateData;
  fromName?: string;
  fromEmail?: string;
}): Promise<{ ok: boolean; status: string; providerMessageId?: string; error?: string }> {
  const { to, template, data } = params;
  const recipients = to.map((email) => email.trim()).filter(Boolean);

  // Template layer may throw on a programming error — convert to result.
  let rendered: { subject: string; html: string };
  try {
    const render = EMAIL_TEMPLATES[template];
    if (!render) return { ok: false, status: "failed", error: `Unknown template: ${template}` };
    // The union of renderers matches the union of data — TS narrows by key.
    rendered = (render as (d: EmailTemplateData) => { subject: string; html: string })(data);
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      error: err instanceof Error ? err.message : "Template render failed",
    };
  }

  // If delivery is not configured, skip gracefully (log it) — do NOT claim sent.
  if (!isEmailDeliveryConfigured() || !recipients.length) {
    await logDelivery({
      organizationId: params.organizationId ?? null,
      recipient: recipients[0] ?? "",
      template,
      status: "skipped",
      error: !recipients.length
        ? "No recipients"
        : "Email delivery is not configured (provider skipped)",
    });
    return {
      ok: false,
      status: "skipped",
      error: "Email delivery is not configured yet — no message was sent.",
    };
  }

  const result = await emailProvider.send({
    from: {
      email: params.fromEmail ?? "no-reply@relvo.app",
      name: params.fromName ?? "Relvo CRM",
    },
    to: recipients.map((email) => ({ email })),
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
  });

  await logDelivery({
    organizationId: params.organizationId ?? null,
    recipient: recipients[0] ?? "",
    template,
    status: result.ok ? "sent" : "failed",
    providerMessageId: result.providerMessageId,
    error: result.error,
  });

  return {
    ok: result.ok,
    status: result.ok ? "sent" : "failed",
    providerMessageId: result.providerMessageId,
    error: result.error,
  };
}

/** Internal — persist an attempt row. Best-effort (analytics-style). */
async function logDelivery(args: {
  organizationId: string | null;
  recipient: string;
  template: string;
  status: string;
  providerMessageId?: string;
  error?: string;
}): Promise<void> {
  try {
    if (!isSupabaseConfigured()) return;
    const admin = createSupabaseAdminClient();
    await admin.from("transactional_email_logs").insert({
      organization_id: args.organizationId,
      recipient: args.recipient.slice(0, 254),
      template: args.template,
      provider: emailProvider.name,
      provider_message_id: args.providerMessageId ?? null,
      status: args.status,
      error_message: args.error?.slice(0, 1000) ?? null,
    });
  } catch {
    // logging must never break the caller
  }
}