"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "performance", label: "Performance" },
] as const;

type DashboardTabId = (typeof tabs)[number]["id"];

function DashboardTabs() {
  const [active, setActive] = React.useState<DashboardTabId>("overview");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/40 bg-white/20 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_12px_30px_-18px_rgba(30,41,59,0.28)] backdrop-blur-2xl">
      {tabs.map((tab) => {
        const isActive = tab.id === active;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
              "border border-transparent",
              isActive
                ? "glass-strong border-white/50 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_-10px_rgba(124,140,255,0.65)]"
                : "text-muted-foreground hover:text-ink hover:bg-white/25"
            )}
            aria-pressed={isActive}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export { DashboardTabs };
