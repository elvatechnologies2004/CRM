"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SubscriptionRecord, SubscriptionStatus } from "@/lib/types";

interface SubscriptionsPageClientProps {
  initialSubscriptions: SubscriptionRecord[];
}

const statusTone: Record<SubscriptionStatus, "success" | "info" | "warning" | "danger" | "secondary"> = {
  Active: "success",
  Trial: "info",
  "Past Due": "warning",
  Cancelled: "secondary",
  Expired: "danger",
};

function SubscriptionsPageClient({ initialSubscriptions }: SubscriptionsPageClientProps) {
  const subscriptions = useMemo(() => initialSubscriptions, [initialSubscriptions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Subscriptions</h1>
        <Button size="sm" variant="ghost">
          + New Subscription
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <ul className="divide-y divide-border">
          {subscriptions.map((subscription) => (
            <li key={subscription.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-ink">{subscription.companyName}</p>
                  <Badge variant={statusTone[subscription.status]} className="text-[10px]">
                    {subscription.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subscription.plan} · {subscription.billingCycle} · Renews{" "}
                  {new Date(subscription.renewalDate).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="text-sm font-semibold tabular-nums text-ink">
                  {subscription.currency === "USD" ? "$" : subscription.currency}{" "}
                  {subscription.amount.toLocaleString()}
                </p>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </div>
            </li>
          ))}
          {subscriptions.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">
              No subscriptions found.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export { SubscriptionsPageClient };