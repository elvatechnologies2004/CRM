import { GoalsPageClient } from "@/components/goals/goals-page-client";
import { goalMocks } from "@/lib/mock-goals";

export default function GoalsPage() {
  return <GoalsPageClient initialGoals={goalMocks} />;
}