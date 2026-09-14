import type { WinLossData } from "@/lib/types";

export interface WinLossDeal {
  id: string;
  dealName: string;
  companyName: string;
  amount: number;
  outcome: "Won" | "Lost";
  ownerName: string;
  closedAt: string;
  reason: string;
  competitor?: string;
}

export const winLossSummary: WinLossData = {
  won: 0,
  lost: 0,
  total: 0,
  winRate: 0,
};

export const winLossDealMocks: WinLossDeal[] = [];
