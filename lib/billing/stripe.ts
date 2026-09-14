import "server-only";

import Stripe from "stripe";

import { stripeEnv } from "@/lib/env";

/**
 * Server-only Stripe client (Step 96.2).
 *
 * Initialized lazily and only when credentials exist. Never import this
 * module into client components — the secret key must stay server-side.
 */
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeEnv.secretKey) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET) to enable billing.",
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(stripeEnv.secretKey, {
      typescript: true,
    });
  }
  return stripeClient;
}

/** True only when both the secret key and webhook secret are configured. */
export function isStripeConfigured(): boolean {
  return stripeEnv.isConfigured;
}