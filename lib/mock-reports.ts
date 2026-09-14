import type { ReportData, ReportType } from "@/lib/types";

export const reportTypes: ReportType[] = [
  "Win Loss",
  "Pipeline",
  "Forecast",
  "Activity",
  "Revenue",
];

export const reportMocks: ReportData[] = [
  {
    id: "rep_001",
    type: "Win Loss",
    name: "Win/Loss Analysis",
    period: "Q4 2024",
    winRate: 28,
    totalOpportunities: 42,
    won: 12,
    lost: 18,
    createdAt: "2024-10-01",
  },
  {
    id: "rep_002",
    type: "Pipeline",
    name: "Pipeline Overview",
    period: "Current",
    totalPipelineValue: 1450000,
    weightedPipeline: 425000,
    opportunities: 28,
  },
  {
    id: "rep_003",
    type: "Forecast",
    name: "Revenue Forecast",
    period: "Q1 2025",
    forecastedRevenue: 380000,
    confidenceLevel: 72,
    adjustedForecast: 273600,
  },
  {
    id: "rep_004",
    type: "Activity",
    name: "Activity Summary",
    period: "Last 30 Days",
    totalActivities: 156,
    completedActivities: 98,
    openActivities: 58,
  },
  {
    id: "rep_005",
    type: "Revenue",
    name: "Revenue by Region",
    period: "Q4 2024",
    totalRevenue: 985000,
    revenueByRegion: [
      { region: "North America", revenue: 620000 },
      { region: "Europe", revenue: 215000 },
      { region: "Asia Pacific", revenue: 150000 },
    ],
  },
];

export function getReportById(id: string): ReportData | undefined {
  return reportMocks.find((r) => r.id === id);
}