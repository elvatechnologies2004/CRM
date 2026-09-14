"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/crm/alert";
import { cn } from "@/lib/utils";
import type { Plan, PlanEntitlements, PlanLimits, PlanCode } from "@/lib/billing/plans";
import type { SubscriptionRecord } from "@/lib/billing/subscriptions";
import {
  createCheckoutSession,
  openBillingPortal,
  cancelSubscriptionNow,
  reactivateSubscription,
  changePlan,
} from "@/lib/billing/subscriptions";
import type { BillingCycle, OrgUsage } from "@/lib/billing/types";

interface BillingEntitlements {
  planCode: PlanCode;
  usage: OrgUsage;
  limits: PlanLimits;
  trialEndsAt: string | null;
  status: "trialing" | "active" | "past_due" | "free" | "canceled";
  withinLimits: boolean;
  overLimitFields: Array<keyof PlanLimits>;
}

interface BillingPageClientProps {
  plans: Plan[];
  subscription: SubscriptionRecord | null;
  entitlements: BillingEntitlements | null;
  stripeConfigured: boolean;
  error: string | null;
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: [],
  starter: ["Automations", "Integrations", "Email sequences"],
  pro: ["AI assistant & agents", "Reports & forecast", "API access", "More automations"],
  business: ["Everything in Pro", "SSO", "Advanced audit", "Custom limits"],
};

function formatPrice(cents: number, cycle: BillingCycle): string {
  if (cents === 0) return "Rs 0";
  const yearlyHint = cycle === "yearly" ? "" : "";
  void yearlyHint;
  return `Rs ${(cents / 100).toFixed(2)}`;
}

function planAction(
  plan: Plan,
  subscription: SubscriptionRecord | null,
): { label: string; disabled: boolean; tone: "default" | "outline" | "ghost" | "destructive" } | null {
  if (plan.code === "free" && subscription && subscription.planCode === "free") {
    return { label: "Current plan", disabled: true, tone: "ghost" };
  }
  if (plan.code === "business") {
    return { label: "Contact Sales", disabled: false, tone: "outline" };
  }
  if (subscription && subscription.planCode === plan.code) {
    return { label: "Current plan", disabled: true, tone: "ghost" };
  }
  return { label: "Choose plan", disabled: false, tone: "default" };
}

function BillingPageClient({ plans, subscription, entitlements, stripeConfigured, error }: BillingPageClientProps) {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const daysLeft = entitlements?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(entitlements.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  async function runAction(key: string, fn: () => Promise<{ ok: boolean; url?: string; error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      setBusyAction(key);
      const res = await fn();
      setBusyAction(null);
      if (!res.ok) {
        setActionError(res.error ?? "Action failed");
        return;
      }
      if (res.url) window.location.href = res.url;
      else router.refresh();
    });
  }

  function handleCheckout(plan: Plan) {
    if (plan.code === "free" || plan.code === "business") return;
    void runAction(`checkout-${plan.code}-${cycle}`, () =>
      createCheckoutSession(plan.code as Exclude<PlanCode, "free" | "business">, cycle),
    );
  }

  async function handleChangePlan(plan: Plan) {
    if (plan.code === "free" || plan.code === "business") return;
    await runAction(`change-${plan.code}-${cycle}`, () =>
      changePlan(plan.code as Exclude<PlanCode, "free" | "business">, cycle),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Billing &amp; Plan</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, plan and payment details.
        </p>
      </div>

      {error ? (
        <Alert tone="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!stripeConfigured ? (
        <Alert tone="warning">
          <AlertDescription>
            Billing is not configured yet. Set <code>STRIPE_SECRET_KEY</code>,{" "}
            <code>STRIPE_WEBHOOK_SECRET</code> and the plan price IDs in your environment to activate
            checkouts and portal. No payments are being processed.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Current plan */}
      {subscription && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-ink">{subscription.planName}</p>
                <p className="text-sm text-muted-foreground capitalize">{subscription.status}</p>
              </div>
            </div>
            {subscription.status === "trialing" && (
              <Badge variant="info">
                Trial · {daysLeft} day{daysLeft === 1 ? "" : "s"} left
              </Badge>
            )}
            {subscription.status === "past_due" && (
              <Badge variant="danger">Past due — update payment method</Badge>
            )}
            {subscription.cancelAtPeriodEnd && (
              <Badge variant="warning">Cancels at period end</Badge>
            )}
          </div>

          {subscription.currentPeriodEnd && (
            <p className="mt-3 text-xs text-muted-foreground">
              Current period ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          {/* Entitlements summary */}
          {entitlements && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["seats", "Seats"],
                  ["contacts", "Contacts"],
                  ["deals", "Deals"],
                  ["automations", "Automations"],
                ] as const
              ).map(([key, label]) => {
                const limit = entitlements.limits[key];
                const used = entitlements.usage[key];
                const unlimited = limit === -1;
                const over = !unlimited && used > limit;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-border bg-muted/40 px-3 py-2"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className={cn("text-sm font-semibold text-ink", over && "text-destructive")}>
                      {used}
                      <span className="text-muted-foreground">
                        {unlimited ? "" : ` / ${limit}`}
                      </span>
                      {over ? " · over" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {subscription.cancelAtPeriodEnd ? (
              <Button
                size="sm"
                disabled={isPending || busyAction === "reactivate"}
                onClick={() => runAction("reactivate", reactivateSubscription)}
              >
                {busyAction === "reactivate" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reactivate
              </Button>
            ) : null}
            {subscription.status !== "free" && !subscription.cancelAtPeriodEnd ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending || busyAction === "cancel"}
                onClick={() => {
                  if (confirm("Cancel subscription? Your data stays intact until the period end.")) {
                    void runAction("cancel", cancelSubscriptionNow);
                  }
                }}
              >
                {busyAction === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Cancel subscription
              </Button>
            ) : null}
            {subscription.providerCustomerId && stripeConfigured ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending || busyAction === "portal"}
                onClick={() => runAction("portal", openBillingPortal)}
              >
                {busyAction === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <ExternalLink className="h-4 w-4" aria-hidden />
                Billing portal
              </Button>
            ) : null}
          </div>
        </section>
      )}

      {/* Plan chooser */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Choose your plan</h2>
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors",
                  cycle === c ? "bg-card text-ink shadow-sm" : "text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan: Plan) => {
            const action = planAction(plan, subscription);
            const isCurrent = subscription?.planCode === plan.code;
            const price = cycle === "monthly" ? plan.monthlyPriceCents : plan.yearlyPriceCents;
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-xl border bg-card p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]",
                  isCurrent ? "border-primary/60 ring-1 ring-primary/20" : "border-border",
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">{plan.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                  {isCurrent ? <Badge variant="success">Current</Badge> : null}
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-ink">
                  {plan.billingMode === "contact_sales" ? (
                    "Custom"
                  ) : (
                    <>
                      {formatPrice(price, cycle)}
                      <span className="text-sm font-normal text-muted-foreground">
                        {price > 0 ? "/mo" : " forever"}
                      </span>
                    </>
                  )}
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {(PLAN_FEATURES[plan.code] ?? []).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {feature}
                    </li>
                  ))}
                  {plan.code === "free" && (
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      Core CRM (leads, contacts, deals, tasks)
                    </li>
                  )}
                </ul>

                <div className="mt-5">
                  {plan.code === "business" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => (window.location.href = "/contact")}
                    >
                      Contact Sales
                    </Button>
                  ) : isCurrent ? (
                    <Button variant="ghost" className="w-full" disabled>
                      Current plan
                    </Button>
                  ) : action ? (
                    <Button
                      variant={action.tone}
                      className="w-full"
                      disabled={action.disabled || isPending}
                      onClick={() => {
                        if (subscription?.providerSubscriptionId) void handleChangePlan(plan);
                        else handleCheckout(plan);
                      }}
                    >
                      {busyAction === `checkout-${plan.code}-${cycle}` ||
                      busyAction === `change-${plan.code}-${cycle}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {subscription?.providerSubscriptionId ? "Switch plan" : "Choose plan"}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Prices shown are indicative. Actual charges are set by your service provider and confirmed
          at checkout. Cancelling never deletes your data.
        </p>
      </section>
    </div>
  );
}

export { BillingPageClient };