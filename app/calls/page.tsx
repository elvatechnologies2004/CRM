import { CallsPageClient } from "@/components/activities/calls-page-client";
import { callMocks } from "@/lib/mock-calls";
import { leadOwners } from "@/lib/mock-leads";

export default function CallsPage() {
  const ownerNames = leadOwners.map((owner) => owner.name);
  return <CallsPageClient initialCalls={callMocks} owners={ownerNames} />;
}