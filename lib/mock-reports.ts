import type { ReportData, ReportType } from "@/lib/types";

export const reportTypes: ReportType[] = [
  "Win Loss",
  "Pipeline",
  "Forecast",
  "Activity",
  "Revenue",
];

export const reportMocks: ReportData[] = [];

export function getReportById(id: string): ReportData | undefined {
  return reportMocks.find((r) => r.id === id);
}
