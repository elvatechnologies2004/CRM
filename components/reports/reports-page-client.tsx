"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportDataDialog } from "@/components/exports/export-data-dialog";
import type { ReportData, ReportType } from "@/lib/types";

interface ReportsPageClientProps {
  initialReports: ReportData[];
}

function ReportsPageClient({ initialReports }: ReportsPageClientProps) {
  const reports = useMemo(() => initialReports, [initialReports]);
  const [exportOpen, setExportOpen] = useState(false);

  const typeTone: Record<ReportType, "info" | "success" | "warning" | "danger"> = {
    "Win Loss": "info",
    Pipeline: "info",
    Forecast: "info",
    Activity: "info",
    Revenue: "success",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reports</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost">
            + New Report
          </Button>
          <Button size="sm" onClick={() => setExportOpen(true)}>
            Export Data
          </Button>
        </div>
      </div>

      <ExportDataDialog open={exportOpen} onOpenChange={setExportOpen} defaultScope="sales_report" title="FinloNexa Data Export" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const Tone = typeTone[report.type];
          return (
            <div
              key={report.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-2">
                <p className="font-medium text-ink">{report.name}</p>
                <Badge variant={Tone} className="text-[10px]">{report.type}</Badge>
                <p className="text-sm text-muted-foreground">{report.period}</p>
                {report.type === "Win Loss" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Win Rate: {report.winRate}% ({report.won} won / {report.lost} lost)
                  </p>
                )}
                {report.type === "Pipeline" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pipeline: ${(report.totalPipelineValue || 0).toLocaleString()} weighted: ${(report.weightedPipeline || 0).toLocaleString()}
                  </p>
                )}
                {report.type === "Forecast" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Forecast: ${(report.forecastedRevenue || 0).toLocaleString()} (Confidence: {report.confidenceLevel}%)
                  </p>
                )}
                {report.type === "Activity" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Activities: {report.totalActivities} total ({report.completedActivities} completed, {report.openActivities} open)
                  </p>
                )}
                {report.type === "Revenue" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Revenue: ${(report.totalRevenue || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {reports.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No reports found.
          </p>
        )}
      </div>
    </div>
  );
}

export { ReportsPageClient };