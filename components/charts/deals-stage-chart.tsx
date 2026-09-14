"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dealsByStage as mockDealsByStage } from "@/lib/mock-data";
import type { DealStageOverview } from "@/lib/types";
import { cn } from "@/lib/utils";

const stageColors = ["#6366F1", "#4F7CFF", "#8B5CF6", "#F59E0B", "#22C55E", "#EF4444"];

function buildChartData(source: DealStageOverview[]) {
  return source.map((stage, index) => ({
    name: stage.stage,
    value: stage.count,
    color: stageColors[index % stageColors.length],
    percentage: stage.percentage,
  }));
}

interface DealsStageChartProps {
  data?: DealStageOverview[];
}

function DealsStageChart({ data }: DealsStageChartProps = {}) {
  const chartData = buildChartData(data && data.length > 0 ? data : mockDealsByStage);
  const totalDeals = chartData.reduce((sum, stage) => sum + stage.value, 0);
  const openDeals = chartData
    .filter((s) => !/won/i.test(s.name))
    .reduce((sum, s) => sum + s.value, 0);
  const wonDeals = chartData.find((s) => /won/i.test(s.name))?.value ?? 0;

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden @container">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle>Deals by Stage</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 pt-0">
        <div className="grid min-w-0 grid-cols-1 gap-5 @[340px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex min-w-0 flex-col items-center justify-center gap-2">
            <div className="h-[150px] w-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={
                      <ChartTooltip formatter={(value) => `${value} deals`} />
                    }
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={2}
                    cornerRadius={4}
                    stroke="none"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center leading-tight">
              <p className="text-2xl font-bold tracking-tight text-ink">{totalDeals}</p>
              <p className="text-xs text-muted-foreground">Total deals</p>
            </div>
          </div>

          <ul className="flex min-w-0 flex-col gap-2">
            {chartData.map((entry, index) => (
              <li
                key={entry.name}
                className={cn(
                  "flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60",
                  index === 0 && "border border-border bg-card"
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                  {entry.name}
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-ink">
                  {entry.value}
                </span>
                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                  {entry.percentage}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto grid shrink-0 grid-cols-2 gap-2">
          <div className="rounded-lg border border-border p-2.5 text-center">
            <p className="text-lg font-bold tracking-tight text-ink">{openDeals}</p>
            <p className="text-[11px] text-muted-foreground">Open</p>
          </div>
          <div className="rounded-lg border border-border p-2.5 text-center">
            <p className="text-lg font-bold tracking-tight text-ink">{wonDeals}</p>
            <p className="text-[11px] text-muted-foreground">Won</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { DealsStageChart };