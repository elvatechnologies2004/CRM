"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { DateRangeSelector } from "@/components/dashboard/date-range-selector";
import { formatDate } from "@/lib/utils";

function DashboardHeader() {
  const [today, setToday] = React.useState<string | null>(null);

  React.useEffect(() => {
    const id = window.setTimeout(() => setToday(formatDate(new Date())), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[26px]">
          Good Morning, Hussain!{" "}
          <span role="img" aria-label="wave">
            👋
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground shadow-[0_1px_2px_0_rgba(15,23,42,0.03)]">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <span className={today ? "" : "opacity-0"} aria-hidden={!today}>
            {today ?? "Placeholder date"}
          </span>
          <span className="sr-only">{today}</span>
        </div>
        <DateRangeSelector />
      </div>
    </div>
  );
}

export { DashboardHeader };