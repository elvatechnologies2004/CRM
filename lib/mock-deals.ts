import type {
  DealActivity,
  DealForecast,
  DealForecastByMonth,
  DealHealth,
  DealLostData,
  DealProposal,
  DealQuote,
  DealRecord,
  DealStaleAlert,
  DealWonData,
} from "@/lib/types";

export const dealMocks: DealRecord[] = [];

export const dealActivities: DealActivity[] = [];

export const dealHealth: Record<string, DealHealth> = {};

export const dealQuotes: DealQuote[] = [];

export const dealProposals: DealProposal[] = [];

export const dealWonData: DealWonData = {
  wonDate: "",
  finalValue: 0,
  products: [],
  winReason: "Product Fit",
};

export const dealLostData: DealLostData = {
  lostDate: "",
  lostReason: "Price",
};

export const dealStaleAlerts: DealStaleAlert[] = [];

export function getDealById(id: string): DealRecord | undefined {
  return dealMocks.find((deal) => deal.id === id);
}

export function getDealActivities(dealId: string): DealActivity[] {
  return dealActivities;
}

export function getDealHealth(dealId: string): DealHealth | undefined {
  return dealHealth[dealId];
}

export function getDealQuotes(): DealQuote[] {
  return dealQuotes;
}

export function getDealProposals(): DealProposal[] {
  return dealProposals;
}

export function getDealWonData(dealId: string): DealWonData | undefined {
  return getDealById(dealId)?.stageName === "Won" ? dealWonData : undefined;
}

export function getDealLostData(dealId: string): DealLostData | undefined {
  return getDealById(dealId)?.stageName === "Lost" ? dealLostData : undefined;
}

export function getDealStaleAlerts(): DealStaleAlert[] {
  return dealStaleAlerts;
}

export function getDealForecast(): DealForecast {
  return {
    category: "Pipeline",
    value: 0,
    deals: dealMocks,
  };
}

export function getDealForecastByMonth(): DealForecastByMonth {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "short" });
  return {
    month,
    pipeline: 0,
    bestCase: 0,
    commit: 0,
    closedWon: 0,
  };
}