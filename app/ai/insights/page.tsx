import { AIInsightsPageClient } from "@/components/ai/insights-page-client";
import { insightMocks } from "@/lib/mock-insights";

export default function AIInsightsPage() {
  return <AIInsightsPageClient initialInsights={insightMocks} />;
}