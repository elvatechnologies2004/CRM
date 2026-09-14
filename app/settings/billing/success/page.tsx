import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentSubscription } from "@/lib/billing/subscriptions";

export const dynamic = "force-dynamic";

/**
 * /settings/billing/success (Step 96.9)
 *
 * Never assumes success from a browser redirect. Loads the actual DB
 * subscription state, which is only written by provider webhooks.
 */
export default async function BillingSuccessPage() {
  const { subscription, error } = await getCurrentSubscription();
  const confirmed = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
        <span className="text-2xl text-[#15803d]" aria-hidden>
          ✓
        </span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Payment received</h1>
      <p className="text-sm text-muted-foreground">
        {confirmed
          ? "Your subscription is active."
          : "Your subscription status is being confirmed. It updates automatically moments after we verify payment."}
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button asChild>
        <Link href="/settings/billing">Back to Billing</Link>
      </Button>
    </div>
  );
}