"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isStripeConfigured, getStripe } from "@/lib/billing/stripe";
import { fetchPlans, normalizePlan, type PlanCode, type BillingCycle } from "@/lib/billing/plans";
import { getStripePriceId } from "@/lib/env";
import { can } from "@/lib/crm/context";

export interface SubscriptionRecord {
  organizationId: string;
  planCode: PlanCode;
  planName: string;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid"
    | "paused"
    | "free";
  billingCycle: BillingCycle;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
}

interface BillingResult {
  ok: boolean;
  error?: string;
  url?: string;
  subscription?: SubscriptionRecord;
}

/**
 * Resolve the current organization + enforce settings.manage permission
 * which gates ALL billing operations. Returns org id or throws.
 */
async function requireBillingOrg(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const allowed = await can("settings.manage");
  if (!allowed) throw new Error("You don't have permission to manage billing");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) throw new Error("No active organization");

  return membership.organization_id as string;
}

/**
 * Get the subscription record for the current org.
 * Public read (member-scoped), used by the billing page.
 */
export async function getCurrentSubscription(): Promise<{
  subscription: SubscriptionRecord | null;
  error: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { subscription: null, error: "Not authenticated" };

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!membership) return { subscription: null, error: "No active organization" };

    const orgId = membership.organization_id as string;

    const { data, error } = await supabase
      .from("organization_subscriptions")
      .select("organization_id, provider_customer_id, provider_subscription_id, status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, trial_started_at, trial_ends_at, plans(code, name)")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) return { subscription: null, error: error.message };
    if (!data) return { subscription: null, error: null };

    const plan = Array.isArray(data.plans) ? null : (data.plans as { code?: string; name?: string } | null);

    return {
      subscription: {
        organizationId: orgId,
        planCode: (plan?.code as PlanCode) ?? "free",
        planName: plan?.name ?? "Free",
        status: (data.status as SubscriptionRecord["status"]) ?? "free",
        billingCycle: (data.billing_cycle as BillingCycle) ?? "monthly",
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
        trialStartedAt: data.trial_started_at,
        trialEndsAt: data.trial_ends_at,
        providerCustomerId: data.provider_customer_id,
        providerSubscriptionId: data.provider_subscription_id,
      },
      error: null,
    };
  } catch (e) {
    return { subscription: null, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/**
 * Get or create an org subscription row with a trial (Step 95/98).
 * Called server-side during onboarding/billing view. Running via the
 * RLS-enforced path would fail because there are no insert policies,
 * so we use security-definer RPC behavior via the admin client.
 */
export async function ensureOrgSubscription(orgId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("organization_subscriptions")
    .select("id, plan_id")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (existing) return existing.id as string;

  // Find the Free plan and Pro plan; trial starts on Pro.
  const plans = await fetchPlans();
  const freePlan = plans.find((p) => p.code === "free");
  const proPlan = plans.find((p) => p.code === "pro");
  if (!freePlan || !proPlan) return null;

  const { data, error } = await admin
    .from("organization_subscriptions")
    .insert({
      organization_id: orgId,
      plan_id: proPlan.id,
      provider: "none",
      status: "trialing",
      billing_cycle: "monthly",
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (error) return null;
  return data.id as string;
}

/**
 * Create a customer if one doesn't exist, then create a Checkout Session
 * (Step 96.4). Organization id is resolved server-side — never from the
 * client. If Stripe isn't configured, returns a clear error.
 */
export async function createCheckoutSession(
  planCode: Exclude<PlanCode, "free" | "business">,
  cycle: BillingCycle,
): Promise<BillingResult> {
  try {
    if (!isStripeConfigured()) {
      return {
        ok: false,
        error:
          "Billing is not configured yet. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and price IDs to enable checkout.",
      };
    }

    const orgId = await requireBillingOrg();
    const stripe = getStripe();
    const plans = await fetchPlans();
    const plan = plans.find((p) => p.code === planCode);
    if (!plan) return { ok: false, error: "Unknown plan" };

    const priceId = getStripePriceId(planCode, cycle);
    if (!priceId) return { ok: false, error: "Plan price is not configured (add STRIPE_*_PRICE_ID)" };

    // Get or create the provider customer for this org (Step 96.5).
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin
      .from("organization_subscriptions")
      .select("provider_customer_id")
      .eq("organization_id", orgId)
      .maybeSingle();

    let customerId = existing?.provider_customer_id as string | null;

    if (!customerId) {
      const { data: orgData } = await admin
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle();

      const customer = await stripe.customers.create({
        name: orgData?.name ?? undefined,
        metadata: { organization_id: orgId },
      });
      customerId = customer.id;

      await admin
        .from("organization_subscriptions")
        .update({ provider_customer_id: customerId })
        .eq("organization_id", orgId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        organization_id: orgId,
        plan_id: plan.id,
        plan_code: planCode,
        billing_cycle: cycle,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing/cancel`,
    });

    return { ok: true, url: session.url ?? undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Checkout failed" };
  }
}

/**
 * Open the Stripe Customer Portal (Step 96.10) so customers can manage
 * payment methods, invoices and billing on their own.
 */
export async function openBillingPortal(): Promise<BillingResult> {
  try {
    if (!isStripeConfigured()) {
      return {
        ok: false,
        error: "Billing is not configured yet. Add Stripe credentials to enable the billing portal.",
      };
    }
    const orgId = await requireBillingOrg();
    const stripe = getStripe();
    const admin = createSupabaseAdminClient();

    const { data } = await admin
      .from("organization_subscriptions")
      .select("provider_customer_id")
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!data?.provider_customer_id) {
      return { ok: false, error: "No billing customer found for this organization" };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: data.provider_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    return { ok: true, url: session.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not open billing portal" };
  }
}

/**
 * Cancel at period end (Step 96.12). Provider is the source of truth; we
 * mirror cancel_at_period_end into the DB only after Stripe confirms.
 */
export async function cancelSubscriptionNow(): Promise<BillingResult> {
  try {
    if (!isStripeConfigured()) {
      return { ok: false, error: "Billing is not configured." };
    }
    const orgId = await requireBillingOrg();
    const stripe = getStripe();
    const admin = createSupabaseAdminClient();

    const { data } = await admin
      .from("organization_subscriptions")
      .select("provider_subscription_id")
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!data?.provider_subscription_id) {
      return { ok: false, error: "No active subscription to cancel" };
    }

    await stripe.subscriptions.update(data.provider_subscription_id, {
      cancel_at_period_end: true,
    });

    // Provider is the source of truth; we mirror only cancel_at_period_end.
    // Period dates are synced by the subscription.updated webhook.
    await admin
      .from("organization_subscriptions")
      .update({
        cancel_at_period_end: true,
        status: "active",
      })
      .eq("organization_id", orgId);

    revalidatePath("/settings/billing");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Cancellation failed" };
  }
}

/**
 * Reactivate a subscription that's set to cancel at period end (96.12).
 */
export async function reactivateSubscription(): Promise<BillingResult> {
  try {
    if (!isStripeConfigured()) return { ok: false, error: "Billing is not configured." };
    const orgId = await requireBillingOrg();
    const stripe = getStripe();
    const admin = createSupabaseAdminClient();

    const { data } = await admin
      .from("organization_subscriptions")
      .select("provider_subscription_id")
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!data?.provider_subscription_id) {
      return { ok: false, error: "No subscription to reactivate" };
    }

    await stripe.subscriptions.update(data.provider_subscription_id, {
      cancel_at_period_end: false,
    });

    await admin
      .from("organization_subscriptions")
      .update({ cancel_at_period_end: false })
      .eq("organization_id", orgId);

    revalidatePath("/settings/billing");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Reactivation failed" };
  }
}

/**
 * Upgrade or downgrade plan plus switch billing cycle (Step 96.11).
 * Changes the price on the provider subscription; provider webhook/state
 * is the source of truth.
 */
export async function changePlan(
  planCode: Exclude<PlanCode, "free" | "business">,
  cycle: BillingCycle,
): Promise<BillingResult> {
  try {
    if (!isStripeConfigured()) return { ok: false, error: "Billing is not configured." };
    const orgId = await requireBillingOrg();
    const stripe = getStripe();
    const admin = createSupabaseAdminClient();

    const priceId = getStripePriceId(planCode, cycle);
    if (!priceId) return { ok: false, error: "Plan price is not configured" };

    const { data } = await admin
      .from("organization_subscriptions")
      .select("provider_subscription_id")
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!data?.provider_subscription_id) {
      return { ok: false, error: "No existing subscription to change" };
    }

    // Swap the price on the current item.
    const res = await stripe.subscriptions.retrieve(data.provider_subscription_id);
    const items = res.items.data.map((item) => ({ id: item.id, price: priceId, quantity: 1 }));

    await stripe.subscriptions.update(data.provider_subscription_id, { items });

    revalidatePath("/settings/billing");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Plan change failed" };
  }
}

export type { BillingResult };
export { normalizePlan };