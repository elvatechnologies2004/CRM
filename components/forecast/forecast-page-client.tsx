"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ForecastData } from "@/lib/types";

interface ForecastPageClientProps {
  initialForecasts: ForecastData[];
}

function ForecastPageClient({ initialForecasts }: ForecastPageClientProps) {
  const forecasts = useMemo(() => initialForecasts, [initialForecasts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Forecast</h1>
        <Button size="sm" variant="ghost">
          + Forecast
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {forecasts.map((forecast) => {
          const variance = (forecast.forecastedRevenue || 0) - (forecast.actualRevenue || 0);
          const badgeVariant = variance >= 0 ? "success" : "danger";
          return (
            <div
              key={forecast.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-2">
                <p className="font-medium text-ink">{forecast.name}</p>
                <p className="text-sm text-muted-foreground">
                  {forecast.period}: {forecast.month || forecast.quarter || forecast.year}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-ink">Forecasted</span>
                  <span className="font-medium text-ink">${(forecast.forecastedRevenue || 0).toLocaleString()}</span>
                  <Badge variant={badgeVariant} className="text-[10px]">
                    {Math.abs(variance).toLocaleString()}
                  </Badge>
                </div>
                {forecast.topContributors && forecast.topContributors.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Top: {forecast.topContributors.join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {forecasts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No forecasts found.
          </p>
        )}
      </div>
    </div>
  );
}

export { ForecastPageClient };