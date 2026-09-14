import {
  CalendarPlus,
  Clock,
  Handshake,
  Split,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ContactStats {
  total: number;
  activeCustomers: number;
  newThisMonth: number;
  withOpenDeals: number;
  noRecentActivity: number;
}

interface StatItem {
  id: string;
  label: string;
  value: string;
  icon: typeof Users;
  iconClass: string;
}

function iconClass(base: string) {
  return cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", base);
}

function ContactsStats({ stats }: { stats: ContactStats }) {
  const items: StatItem[] = [
    {
      id: "total",
      label: "Total Contacts",
      value: String(stats.total),
      icon: Users,
      iconClass: iconClass("bg-brand-blue/10 text-brand-blue"),
    },
    {
      id: "customers",
      label: "Active Customers",
      value: String(stats.activeCustomers),
      icon: Handshake,
      iconClass: iconClass("bg-success/10 text-[#15803d]"),
    },
    {
      id: "new",
      label: "New This Month",
      value: String(stats.newThisMonth),
      icon: CalendarPlus,
      iconClass: iconClass("bg-brand-cyan/10 text-[#0e7490]"),
    },
    {
      id: "deals",
      label: "With Open Deals",
      value: String(stats.withOpenDeals),
      icon: Split,
      iconClass: iconClass("bg-warning/10 text-[#b45309]"),
    },
    {
      id: "inactive",
      label: "No Recent Activity",
      value: String(stats.noRecentActivity),
      icon: Clock,
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

export { ContactsStats };