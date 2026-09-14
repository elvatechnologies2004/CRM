import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface StatTile {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "purple";
}

const toneText: Record<NonNullable<StatTile["tone"]>, string> = {
  default: "text-ink",
  success: "text-[#15803d]",
  warning: "text-[#b45309]",
  danger: "text-[#b91c1c]",
  info: "text-[#1d4ed8]",
  purple: "text-[#6d28d9]",
};

function StatGrid({ stats, className }: { stats: StatTile[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5",
        className
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
        >
          <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              toneText[stat.tone ?? "default"]
            )}
          >
            {stat.value}
          </p>
          {stat.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export { StatGrid };