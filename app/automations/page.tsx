import { AutomationsPageClient } from "@/components/automations/automations-page-client";
import { automationMocks } from "@/lib/mock-automations";

export default function AutomationsPage() {
  return <AutomationsPageClient initialAutomations={automationMocks} />;
}