import {
  BadgePercent,
  Flame,
  Sparkles,
  Target,
  UserPlus,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface LeadStats {
  total: number;
  newLeads: number;
  qualified: number;
  hot: number;
  conversionRate: number;
}

interface StatItem {
  id: string;
  label: string;
  value: string;
  icon: typeof Target;
  iconClass: string;
}

const iconClass = (base: string) =>
  cn(
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
    base
  );

function LeadsStats({ stats }: { stats: LeadStats }) {
  const items: StatItem[] = [
    {
      id: "total",
      label: "Total Leads",
      value: String(stats.total),
      icon: Sparkles,
      iconClass: iconClass("bg-brand-blue/10 text-brand-blue"),
    },
    {
      id: "new",
      label: "New Leads",
      value: String(stats.newLeads),
      icon: UserPlus,
      iconClass: iconClass("bg-brand-cyan/10 text-[#0e7490]"),
    },
    {
      id: "qualified",
      label: "Qualified",
      value: String(stats.qualified),
      icon: Target,
      iconClass: iconClass("bg-success/10 text-[#15803d]"),
    },
    {
      id: "hot",
      label: "Hot Leads",
      value: String(stats.hot),
      icon: Flame,
      iconClass: iconClass("bg-warning/10 text-[#b45309]"),
    },
    {
      id: "conversion",
      label: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: BadgePercent,
      iconClass: iconClass("bg-brand-purple/10 text-[#6d28d9]"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <Card
            key={item.id}
            className="flex items-center gap-3 p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <span className={cn(item.iconClass, "hidden sm:flex")}>
              <ItemIcon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-ink">
                {item.value}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export { LeadsStats };