import type { ForecastData, ForecastPeriod } from "@/lib/types";

export const forecastPeriods: ForecastPeriod[] = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

export const forecastMocks: ForecastData[] = [
  {
    id: "fc_001",
    period: "Monthly",
    name: "Monthly Revenue Forecast",
    month: "January 2025",
    actualRevenue: 125000,
    forecastedRevenue: 135000,
    variance: 8000,
    confidence: 75,
    topContributors: ["Techno Solutions", "Skyline Retail", "Nova Systems"],
  },
  {
    id: "fc_002",
    period: "Quarterly",
    name: "Quarterly Pipeline Forecast",
    quarter: "Q1 2025",
    forecastedPipeline: 500000,
    confidence: 80,
    topDeals: ["d_001", "d_006", "d_003"],
  },
  {
    id: "fc_003",
    period: "Yearly",
    name: "Yearly Revenue Forecast",
    year: 2025,
    forecastedRevenue: 2000000,
    actualRevenuePreviousYear: 1800000,
    growthRate: 11,
    confidence: 70,
  },
];