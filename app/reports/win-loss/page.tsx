import { WinLossPageClient } from "@/components/reports/win-loss-page-client";
import { winLossDealMocks, winLossSummary } from "@/lib/mock-win-loss";

export default function WinLossPage() {
  return <WinLossPageClient initialSummary={winLossSummary} initialDeals={winLossDealMocks} />;
}