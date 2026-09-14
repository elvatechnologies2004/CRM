import { NextRequest } from "next/server";
import Stripe from "stripe";

import { getStripe } from "@/lib/billing/stripe";
import { handleStripeEvent } from "@/lib/billing/webhooks";
import { stripeEnv } from "@/lib/env";

/**
 * POST /api/webhooks/stripe (Step 96.6).
 *
 * Verifies the Stripe signature before touching any data. When Stripe is
 * not configured the route intentionally fails closed (405) — there is
 * nothing to process and we must not accept unsigned/unconfigured events.
 */

export async function POST(request: NextRequest) {
  if (!stripeEnv.isConfigured) {
    return Response.json({ error: "Billing webhook is not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeEnv.webhookSecret,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return Response.json({ error: message }, { status: 400 });
  }

  const result = await handleStripeEvent(event);

  // Always ack Stripe even when we log a failure — Stripe retries would
  // otherwise cascade. We track the failure in billing_webhook_events.
  return Response.json({ received: true, ...result }, { status: 200 });
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}