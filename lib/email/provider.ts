import "server-only";

/**
 * Transactional email provider abstraction (Step 100).
 *
 * Only ONE provider is wired in this release: Resend (SMTP-style REST).
 * Additional providers can implement the same `EmailProvider` interface
 * without changing callers.
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface SendEmailInput {
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  // Optional: used by Resend for open/click tracking. We only ever store
  // the message id in transactional_email_logs, never body content.
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface EmailProvider {
  /** Human-readable provider name (e.g. "resend"). */
  readonly name: string;
  /** True when this provider is configured (API key present). */
  isConfigured(): boolean;
  /** Deliver an email. Must NEVER throw — return a result instead. */
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

/**
 * Resend provider adapter.
 */
export class ResendProvider implements EmailProvider {
  readonly name = "resend";

  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY);
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? "FinloNexa CRM <no-reply@finlonexa.com>";
    if (!apiKey) {
      return { ok: false, error: "RESEND_API_KEY is not configured." };
    }
    if (!input.to.length) {
      return { ok: false, error: "No recipients provided." };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: input.to.map((t) => (t.name ? `${t.name} <${t.email}>` : t.email)),
          reply_to: input.replyTo?.email,
          subject: input.subject,
          html: input.html,
          text: input.text ?? undefined,
          headers: input.headers,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const detail = (await res.text()).slice(0, 500);
        return { ok: false, error: `Resend ${res.status}: ${detail}` };
      }

      const json = (await res.json()) as { id?: string };
      return { ok: true, providerMessageId: json.id };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown email error" };
    }
  }
}

/**
 * The single provider used by the app in this release.
 */
export const emailProvider: EmailProvider = new ResendProvider();

/**
 * True when a transactional email provider is configured and can actually
 * deliver messages (as opposed to being logged-and-dropped).
 */
export function isEmailDeliveryConfigured(): boolean {
  return emailProvider.isConfigured();
}