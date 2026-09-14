import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "indigo" | "blue" | "purple" | "green";

const toneStyles: Record<
  StatTone,
  { tile: string; arrow: string }
> = {
  indigo: {
    tile: "bg-primary/10 text-primary",
    arrow: "text-[#15803d]",
  },
  blue: {
    tile: "bg-brand-blue/10 text-brand-blue",
    arrow: "text-[#15803d]",
  },
  purple: {
    tile: "bg-brand-purple/10 text-brand-purple",
    arrow: "text-[#15803d]",
  },
  green: {
    tile: "bg-success/10 text-[#15803d]",
    arrow: "text-[#15803d]",
  },
};

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  comparison: string;
  icon: LucideIcon;
  tone: StatTone;
}

function StatCard({
  label,
  value,
  change,
  comparison,
  icon: Icon,
  tone,
}: StatCardProps) {
  const styles = toneStyles[tone];
  const positive = change.startsWith("+");

  return (
    <Card className="group transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              styles.tile
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-sm font-semibold",
              styles.arrow
            )}
          >
            {positive ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden />
            )}
            {change}
          </span>
        </div>
        <p className="mt-4 text-[13px] font-medium text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-ink">
          {value}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{comparison}</p>
      </CardContent>
    </Card>
  );
}

export { StatCard };