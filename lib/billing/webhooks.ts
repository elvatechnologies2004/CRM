import "server-only";

import Stripe from "stripe";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripeEnv } from "@/lib/env";
import { fetchPlans } from "@/lib/billing/plans";
import { sendTransactionalEmail } from "@/lib/email/send";

/**
 * Stripe webhook processing (Step 96.6).
 *
 * Signature verification happens in the route handler; this module maps
 * provider events onto the canonical `organization_subscriptions` row and
 * records idempotency in `billing_webhook_events`.
 *
 * Only provider-confirmed state is written. A browser returning from
 * checkout never marks anything active by itself.
 */

type WebhookResult =
  | { ok: true; status: "processed" | "ignored" }
  | { ok: false; error: string };

/** Stripe Subscription plus legacy period fields (still in webhook payloads). */
interface SubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start?: number | null;
  current_period_end?: number | null;
}

/** Stripe Invoice plus subscription ref (still present in webhook payloads). */
interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string | null;
}

/** Build a safe, minimal payload for the idempotency log. */
function redactPayload(event: Stripe.Event): Record<string, unknown> {
  const obj = event.data.object as unknown as Record<string, unknown>;
  return {
    id: obj.id,
    type: event.type,
    created: obj.created ?? null,
    // Never store payment card / bank details or raw entities that could
    // contain PII beyond ids we need for reconciliation.
  };
}

async function recordEvent(
  providerEventId: string,
  eventType: string,
  payload: Record<string, unknown>,
  status: string,
  errorMessage?: string,
) {
  const admin = createSupabaseAdminClient();
  await admin.from("billing_webhook_events").upsert(
    {
      provider: "stripe",
      provider_event_id: providerEventId,
      event_type: eventType,
      status,
      payload,
      error_message: errorMessage ?? null,
      processed_at: status === "received" ? null : new Date().toISOString(),
    },
    { onConflict: "provider,provider_event_id" },
  );
}

async function markProcessed(providerEventId: string, status: string, errorMessage?: string) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("billing_webhook_events")
    .update({
      status,
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("provider_event_id", providerEventId);
}

/** Resolve plan + subscription changes from a Stripe subscription object. */
function extractSubscriptionState(sub: SubscriptionWithPeriod) {
  const planCode = (sub.metadata?.plan_code as string | undefined) ?? "starter";
  const cycle = (sub.metadata?.billing_cycle as "monthly" | "yearly" | undefined) ?? "monthly";
  return {
    planCode: ["free", "starter", "pro", "business"].includes(planCode) ? planCode : "starter",
    cycle,
    status: sub.status,
    currentPeriodStart: new Date((sub.current_period_start ?? 0) * 1000).toISOString(),
    currentPeriodEnd: new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
  };
}

export async function handleStripeEvent(event: Stripe.Event): Promise<WebhookResult> {
  const eventId = event.id;
  const admin = createSupabaseAdminClient();

  // Idempotency: if already processed, skip.
  const { data: known } = await admin
    .from("billing_webhook_events")
    .select("status")
    .eq("provider_event_id", eventId)
    .maybeSingle();
  if (known && (known.status === "processed" || known.status === "ignored")) {
    return { ok: true, status: "ignored" };
  }

  // Record receipt first so duplicates are visible even if processing fails.
  await recordEvent(eventId, event.type, redactPayload(event), "received");

  try {
    const orgIdFromMeta = extractOrgId(event);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId = session.subscription as string | null;
        // The subscription row's customer id is stored on the session too.
        if (subId) await handleSubscriptionEvent(subId, orgIdFromMeta, admin);
        await markProcessed(eventId, "processed");
        return { ok: true, status: "processed" };
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as SubscriptionWithPeriod;
        await handleSubscriptionEvent(sub.id, orgIdFromMeta, admin, sub);
        await markProcessed(eventId, "processed");
        return { ok: true, status: "processed" };
      }

      case "invoice.paid": {
        const invoice = event.data.object as InvoiceWithSubscription;
        const subId = invoice.subscription ?? null;
        let resolvedOrg: string | null = null;
        if (subId) {
          resolvedOrg = orgIdFromMeta ?? (await resolveOrgByCustomer(invoice.customer, admin));
          if (resolvedOrg) await handleSubscriptionEvent(subId, resolvedOrg, admin);
        }
        // Receipt email — best-effort (Step 100). Skipped when email
        // delivery isn't configured; the result is logged, never faked.
        if (resolvedOrg) {
          await sendReceiptEmail({
            organizationId: resolvedOrg,
            recipientEmail: invoice.customer_email,
            invoiceAmountLabel: formatAmount(invoice.amount_paid, invoice.currency),
            planName: (await fetchPlans()).find((p) =>
              p.code === invoice.metadata?.plan_code,
            )?.name ?? "paid",
          });
        }
        await markProcessed(eventId, "processed");
        return { ok: true, status: "processed" };
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as InvoiceWithSubscription;
        const subId = invoice.subscription ?? null;
        const resolvedOrg = orgIdFromMeta ?? (await resolveOrgByCustomer(invoice.customer, admin));
        // Mark past_due for billing warnings (Step 96.13). Recovery is by
        // Stripe's own dunning; a later subscription.updated flips it back.
        if (subId && resolvedOrg) {
          await handleSubscriptionEvent(subId, resolvedOrg, admin);
          await sendPaymentFailedEmail({
            organizationId: resolvedOrg,
            recipientEmail: invoice.customer_email,
            planName: (await fetchPlans()).find((p) =>
              p.code === invoice.metadata?.plan_code,
            )?.name ?? "plan",
          });
        }
        await markProcessed(eventId, "processed");
        return { ok: true, status: "processed" };
      }

      default:
        await markProcessed(eventId, "ignored");
        return { ok: true, status: "ignored" };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook processing failed";
    await markProcessed(eventId, "failed", message);
    return { ok: false, error: message };
  }
}

/** Look up an org by Stripe customer id (expanded customer or raw string). */
async function resolveOrgByCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<string | null> {
  const customerId = typeof customer === "string" ? customer : (customer?.id ?? null);
  if (!customerId) return null;
  const { data } = await admin
    .from("organization_subscriptions")
    .select("organization_id")
    .eq("provider_customer_id", customerId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

function extractOrgId(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>;
  const metaKey = (obj["metadata"] as Record<string, unknown>) ?? {};
  if (typeof metaKey["organization_id"] === "string") return metaKey["organization_id"];
  return null;
}

/**
 * Synchronize our subscription row from a Stripe subscription object.
 * Uses the admin client (bypasses the member-scoped RLS). When metadata is
 * missing, the org is looked up by provider_customer_id.
 */
async function handleSubscriptionEvent(
  providerSubscriptionId: string,
  fallbackOrgId: string | null,
  admin: ReturnType<typeof createSupabaseAdminClient>,
  periodHint?: SubscriptionWithPeriod,
) {
  const stripe = new Stripe(stripeEnv.secretKey);
  const sub = await stripe.subscriptions.retrieve(providerSubscriptionId, {
    expand: ["customer"],
  });

  const plans = await fetchPlans();
  const fallbackCode = (sub.metadata?.plan_code as string | undefined) ?? "starter";
  const plan = plans.find((p) => p.code === fallbackCode) ?? plans[0];

  const expandedCustomer = (sub.customer as Stripe.Customer | Stripe.DeletedCustomer | null) ?? null;
  const customerId = expandedCustomer?.id ?? (typeof sub.customer === "string" ? sub.customer : null);

  // Find org: prefer metadata, then provider_customer_id match.
  let orgId: string | null = null;
  if (typeof sub.metadata?.organization_id === "string" && sub.metadata.organization_id.length > 0) {
    orgId = sub.metadata.organization_id;
  } else if (customerId) {
    const { data } = await admin
      .from("organization_subscriptions")
      .select("organization_id")
      .eq("provider_customer_id", customerId)
      .maybeSingle();
    orgId = data?.organization_id ?? null;
  }
  if (!orgId) {
    // No org association — cannot reconcile. Keep the row ignored.
    return;
  }

  // The webhook payload carries current_period_* which the retrieve
  // response no longer exposes; prefer it, else derive from created.
  const withPeriod: SubscriptionWithPeriod = {
    ...sub,
    current_period_start:
      periodHint?.current_period_start ?? sub.start_date ?? sub.created,
    current_period_end: periodHint?.current_period_end ?? null,
  };
  const state = extractSubscriptionState(withPeriod);

  await admin
    .from("organization_subscriptions")
    .upsert(
      {
        organization_id: orgId,
        plan_id: plan?.id,
        provider: "stripe",
        provider_customer_id: customerId,
        provider_subscription_id: providerSubscriptionId,
        status: state.status,
        billing_cycle: state.cycle,
        current_period_start: state.currentPeriodStart,
        current_period_end: state.currentPeriodEnd,
        cancel_at_period_end: state.cancelAtPeriodEnd,
      },
      { onConflict: "organization_id" },
    );
}

/** Format a Stripe amount into a label like "$49.00". */
function formatAmount(amount: number, currency: string | null): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "usd").toUpperCase(),
  }).format(amount / 100);
}

/** Best-effort receipt email on paid invoice (Step 100). */
async function sendReceiptEmail(args: {
  organizationId: string;
  recipientEmail?: string | null;
  invoiceAmountLabel: string;
  planName: string;
}) {
  if (!args.recipientEmail) return;
  // Default name is fine — the email is transactional, not personalized.
  await sendTransactionalEmail({
    organizationId: args.organizationId,
    to: [args.recipientEmail],
    template: "invoice_paid",
    data: { name: "", plan: args.planName, amountLabel: args.invoiceAmountLabel },
  });
}

/** Best-effort payment-failure alert (Step 100). */
async function sendPaymentFailedEmail(args: {
  organizationId: string;
  recipientEmail?: string | null;
  planName: string;
}) {
  if (!args.recipientEmail) return;
  await sendTransactionalEmail({
    organizationId: args.organizationId,
    to: [args.recipientEmail],
    template: "invoice_failed",
    data: {
      name: "",
      plan: args.planName,
      billingUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/settings/billing`,
    },
  });
}