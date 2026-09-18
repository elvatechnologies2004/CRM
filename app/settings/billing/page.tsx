import { fetchPlans, type Plan } from "@/lib/billing/plans";
import { getCurrentSubscription } from "@/lib/billing/subscriptions";
import { getEntitlements } from "@/lib/billing/entitlements";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { maybeSendTrialReminder } from "@/lib/email/reminders";
import { BillingPageClient } from "@/components/settings/billing-page-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const [plans, subResult, entitlements] = await Promise.all([
    fetchPlans(),
    getCurrentSubscription(),
    getEntitlements(),
  ]);

  // Trigger the trial-ending reminder while we render (best-effort).
  await maybeSendTrialReminder();

  return (
    <BillingPageClient
      plans={plans as Plan[]}
      subscription={subResult.subscription}
      entitlements={
        entitlements
          ? {
              planCode: entitlements.plan.code,
              usage: entitlements.usage,
              limits: entitlements.limits,
              trialEndsAt: entitlements.trialEndsAt,
              status: entitlements.status,
              withinLimits: entitlements.withinLimits,
              overLimitFields: entitlements.overLimitFields,
            }
          : null
      }
      trialDaysLeft={entitlements?.trialDaysLeft ?? 0}
      stripeConfigured={isStripeConfigured()}
      error={subResult.error}
    />
  );
}