"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { salesPerformanceData } from "@/lib/mock-data";

const series = [
  { key: "leads" as const, name: "Leads", color: "#6366F1" },
  { key: "deals" as const, name: "Deals", color: "#4F7CFF" },
  { key: "won" as const, name: "Won", color: "#22C55E" },
];

const axisTickProps = {
  fill: "#94a3b8",
  fontSize: 11,
};

function LegendDot({ color, name }: { color: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="h-2 w-2 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
      {name}
    </span>
  );
}

function SalesPerformance() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Sales Performance</CardTitle>
        <div className="hidden items-center gap-3 sm:flex" aria-hidden>
          {series.map((item) => (
            <LegendDot key={item.key} color={item.color} name={item.name} />
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-2">
        <div className="min-h-0 w-full flex-1" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesPerformanceData}
              margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
              barGap={4}
              barCategoryGap="24%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EFF4FA" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={axisTickProps}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={axisTickProps}
                tickMargin={6}
                width={40}
              />
              <Tooltip
                cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                content={<ChartTooltip />}
              />
              {series.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.name}
                  fill={item.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-3 sm:hidden">
          {series.map((item) => (
            <LegendDot key={item.key} color={item.color} name={item.name} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { SalesPerformance };