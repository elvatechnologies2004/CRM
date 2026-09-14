import "server-only";

/**
 * Transactional email templates (Step 100).
 * These are intentionally small, plain HTML strings — no external CSS or
 * tracking pixels. Production releases would move these to a template
 * service; the abstraction (lib/email/provider.ts) makes that swap clean.
 */

export interface WelcomeTemplateData {
  name: string;
  loginUrl: string;
}

export function renderWelcomeTemplate(data: WelcomeTemplateData): { subject: string; html: string } {
  const subject = "Welcome to Relvo CRM";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a202c">
      <h1 style="color:#111827">Hello ${escapeHtml(data.name)}</h1>
      <p>Your Relvo CRM workspace is ready. Start with your first lead, contact, company or deal.</p>
      <p><a href="${escapeHtml(data.loginUrl)}" style="background:#2563eb;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none">Open your workspace →</a></p>
      <p style="color:#6b7280;font-size:12px">You're receiving this because an account was created for you. If this wasn't you, you can delete it in your workspace settings.</p>
    </div>`;
  return { subject, html };
}

export interface TrialReminderTemplateData {
  name: string;
  daysLeft: number;
  billingUrl: string;
}

export function renderTrialReminderTemplate(data: TrialReminderTemplateData): { subject: string; html: string } {
  const subject = `Your Relvo trial ends in ${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a202c">
      <h1 style="color:#111827">Hi ${escapeHtml(data.name)}</h1>
      <p>Your Pro trial has <strong>${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"}</strong> left. When the trial ends you'll keep your data on the free plan.</p>
      <p><a href="${escapeHtml(data.billingUrl)}" style="background:#2563eb;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none">Review plans →</a></p>
    </div>`;
  return { subject, html };
}

export interface InvoicePaidTemplateData {
  name: string;
  plan: string;
  amountLabel: string;
}

export function renderInvoicePaidTemplate(data: InvoicePaidTemplateData): { subject: string; html: string } {
  const subject = `Receipt — ${data.plan} plan`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a202c">
      <h1 style="color:#111827">Payment received</h1>
      <p>Hi ${escapeHtml(data.name)} — your ${escapeHtml(data.plan)} subscription is all set.</p>
      <p style="font-size:18px"><strong>${escapeHtml(data.amountLabel)}</strong> was charged successfully.</p>
      <p style="color:#6b7280;font-size:12px">Statements are available in your billing portal.</p>
    </div>`;
  return { subject, html };
}

export interface InvoiceFailedTemplateData {
  name: string;
  plan: string;
  billingUrl: string;
}

export function renderInvoiceFailedTemplate(data: InvoiceFailedTemplateData): { subject: string; html: string } {
  const subject = "Action needed: your Relvo payment did not go through";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a202c">
      <h1 style="color:#111827">We couldn't charge your card</h1>
      <p>Hi ${escapeHtml(data.name)} — your latest ${escapeHtml(data.plan)} plan payment failed. You can update your payment method below.</p>
      <p><a href="${escapeHtml(data.billingUrl)}" style="background:#2563eb;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none">Update payment method →</a></p>
      <p style="color:#6b7280;font-size:12px">If no action is taken your access may be downgraded.</p>
    </div>`;
  return { subject, html };
}

export interface BetaApprovedTemplateData {
  name: string;
  loginUrl: string;
}

export function renderBetaApprovedTemplate(data: BetaApprovedTemplateData): { subject: string; html: string } {
  const subject = "You're in — Relvo beta access approved";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a202c">
      <h1 style="color:#111827">Welcome to the beta 🎉</h1>
      <p>Hi ${escapeHtml(data.name)} — your beta request was approved. Create your account to get started.</p>
      <p><a href="${escapeHtml(data.loginUrl)}" style="background:#2563eb;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none">Start using it →</a></p>
    </div>`;
  return { subject, html };
}

/**
 * Escape HTML entities for user-provided strings (never inject raw data).
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type EmailTemplateKey =
  | "welcome"
  | "trial_reminder"
  | "invoice_paid"
  | "invoice_failed"
  | "beta_approved";

export type EmailTemplateData =
  | WelcomeTemplateData
  | TrialReminderTemplateData
  | InvoicePaidTemplateData
  | InvoiceFailedTemplateData
  | BetaApprovedTemplateData;

export interface RenderedEmail {
  subject: string;
  html: string;
}

type TemplateRenderer<T> = (data: T) => RenderedEmail;

/** Typed map of template key → renderer. */
export const EMAIL_TEMPLATES: {
  welcome: TemplateRenderer<WelcomeTemplateData>;
  trial_reminder: TemplateRenderer<TrialReminderTemplateData>;
  invoice_paid: TemplateRenderer<InvoicePaidTemplateData>;
  invoice_failed: TemplateRenderer<InvoiceFailedTemplateData>;
  beta_approved: TemplateRenderer<BetaApprovedTemplateData>;
} = {
  welcome: renderWelcomeTemplate,
  trial_reminder: renderTrialReminderTemplate,
  invoice_paid: renderInvoicePaidTemplate,
  invoice_failed: renderInvoiceFailedTemplate,
  beta_approved: renderBetaApprovedTemplate,
};