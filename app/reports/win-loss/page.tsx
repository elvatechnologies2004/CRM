import { WinLossPageClient } from "@/components/reports/win-loss-page-client";
import type { DealRecord, WinLossData } from "@/lib/types";
import { getDeals } from "@/lib/crm/deals";
import type { WinLossDeal } from "@/lib/mock-win-loss";

function buildWinLossData(deals: DealRecord[]) {
  const wonDeals = deals.filter((deal) => deal.wonDate || deal.stageName === "Won");
  const lostDeals = deals.filter((deal) => deal.lostDate || deal.stageName === "Lost");

  const winLossDeals: WinLossDeal[] = [...wonDeals, ...lostDeals].map((deal) => ({
    id: deal.id,
    dealName: deal.name,
    companyName: deal.companyName,
    amount: deal.value,
    outcome: deal.wonDate || deal.stageName === "Won" ? "Won" : "Lost",
    ownerName: deal.ownerName,
    closedAt: deal.wonDate ?? deal.lostDate ?? deal.updatedAt,
    reason: deal.winReason ?? deal.lostReason ?? "No reason provided",
  }));

  const summary: WinLossData = {
    won: wonDeals.length,
    lost: lostDeals.length,
    total: wonDeals.length + lostDeals.length,
    winRate: wonDeals.length + lostDeals.length === 0 ? 0 : Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100),
  };

  return { summary, deals: winLossDeals };
}

export default async function WinLossPage() {
  const result = await getDeals({ pageSize: 1000 });
  const { summary, deals } = buildWinLossData(result.rows);

  return <WinLossPageClient initialSummary={summary} initialDeals={deals} />;
}