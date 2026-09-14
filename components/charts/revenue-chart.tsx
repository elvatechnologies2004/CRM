"use client";

import * as React from "react";
import { ArrowUpRight, CalendarRange, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { revenueData as mockRevenueData } from "@/lib/mock-data";
import type { RevenuePoint } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";

const chartColors = {
  primary: "#6366F1",
  primarySoft: "rgba(99, 102, 241, 0.16)",
  primaryFaint: "rgba(99, 102, 241, 0.04)",
};

const axisTickProps = {
  fill: "#94a3b8",
  fontSize: 11,
};

interface RevenueChartProps {
  data?: RevenuePoint[];
}

function RevenueChart({ data }: RevenueChartProps = {}) {
  const [granularity, setGranularity] = React.useState("Monthly");
  const chartData = data && data.length > 0 ? data : mockRevenueData;
  const months = chartData.map((m) => m.value);
  const latest = months[months.length - 1] ?? 0;
  const previous = months[months.length - 2] ?? 0;
  const deltaPct = previous > 0 ? Math.round(((latest - previous) / previous) * 100) : 0;
  const isPositive = deltaPct >= 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Revenue Overview</CardTitle>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {formatCompactCurrency(latest)}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isPositive
                  ? "bg-success/10 text-[#15803d]"
                  : "bg-destructive/10 text-[#dc2626]"
              }`}
            >
              <TrendingUp className="h-3 w-3" aria-hidden />
              {isPositive ? "+" : ""}
              {deltaPct}%
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total revenue this month
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              aria-label="Chart granularity"
            >
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {granularity}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuRadioGroup
              value={granularity}
              onValueChange={setGranularity}
            >
              {["Monthly", "Weekly", "Quarterly", "Yearly"].map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {option}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-2">
        <div className="min-h-0 w-full flex-1" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.24} />
                  <stop offset="45%" stopColor={chartColors.primarySoft} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={chartColors.primaryFaint} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EFF4FA"
                vertical={false}
              />
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
                tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                width={44}
              />
              <Tooltip
                cursor={{ stroke: "#c7d2fe", strokeWidth: 1 }}
                content={<ChartTooltip formatter={(value) => formatCompactCurrency(Number(value))} />}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Revenue"
                stroke={chartColors.primary}
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: "#ffffff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Revenue{" "}
            <span
              className={`font-semibold ${
                isPositive ? "text-[#15803d]" : "text-[#dc2626]"
              }`}
            >
              {isPositive ? "grew" : "dropped"} {Math.abs(deltaPct)}%
            </span>{" "}
            compared to last month
          </p>
          <Badge variant="outline" className="hidden gap-1 border-transparent bg-accent/60 text-accent-foreground sm:inline-flex">
            <ArrowUpRight className="h-3 w-3" aria-hidden />
            View report
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export { RevenueChart };