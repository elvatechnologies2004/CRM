import Link from "next/link";
import { ArrowRight, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getCurrentSubscription } from "@/lib/billing/subscriptions";

export const dynamic = "force-dynamic";

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

/**
 * Trial + activation banner (Step 98 / paid onboarding).
 * - During a trial: shows days remaining and an upgrade CTA.
 * - On the free plan (trial over): nudges to pick a plan.
 * - When past due: action needed.
 * Renders nothing when Stripe billing is fully unconfigured (no subscription
 * row ever gets created for a fresh org until Stripe is set up).
 */
export async function TrialBanner() {
  const ent = await getEntitlements();
  const sub = (await getCurrentSubscription()).subscription;

  // If there's no subscription row at all, there's no billing story yet.
  if (!ent || !sub) return null;

  const isTrialing = sub.status === "trialing" && ent.trialEndsAt;
  const isFree = sub.status === "free";
  const isPastDue = sub.status === "past_due";

  if (!isTrialing && !isFree && !isPastDue) return null;

  // Trial banner
  if (isTrialing) {
    const daysLeft = daysUntil(ent.trialEndsAt as string);
    return (
      <Link
        href="/settings/billing"
        className="group mb-5 flex flex-col gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-brand-purple/10 p-4 transition-colors hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4.5 w-4.5 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              You&apos;re on a 14-day Pro trial — {daysLeft} day{daysLeft === 1 ? "" : "s"} left
            </p>
            <p className="text-sm text-muted-foreground">
              Explore AI, automations and full reporting before you upgrade.
            </p>
          </div>
        </div>
        <Button size="sm" className="shrink-0">
          Choose a plan
        </Button>
      </Link>
    );
  }

  // Free plan / trial ended — upgrade nudge.
  if (isFree) {
    return (
      <Link
        href="/settings/billing"
        className="group mb-5 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4.5 w-4.5 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Your trial has ended</p>
            <p className="text-sm text-muted-foreground">
              You&apos;re on the free plan. Upgrade to Pro to keep full pipeline reporting and AI.
            </p>
          </div>
        </div>
        <Button size="sm" className="shrink-0">
          Upgrade
          <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </Link>
    );
  }

  // Past due — action needed.
  return (
    <Link
      href="/settings/billing"
      className="group mb-5 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 transition-colors hover:border-destructive/50 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
          <TriangleAlert className="h-4.5 w-4.5 text-destructive" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Your payment is past due</p>
          <p className="text-sm text-muted-foreground">
            Update your payment method to avoid disruption.
          </p>
        </div>
      </div>
      <Button size="sm" variant="destructive" className="shrink-0">
        Fix payment
      </Button>
    </Link>
  );
}