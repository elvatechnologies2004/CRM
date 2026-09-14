import { SubscriptionsPageClient } from "@/components/subscriptions/subscriptions-page-client";
import { subscriptionMocks } from "@/lib/mock-subscriptions";

export default function SubscriptionsPage() {
  return <SubscriptionsPageClient initialSubscriptions={subscriptionMocks} />;
}