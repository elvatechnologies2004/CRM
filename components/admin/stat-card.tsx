import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "brand",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  accent?: "brand" | "green" | "amber" | "red" | "purple" | "cyan";
}) {
  const accentClass = {
    brand: "bg-primary/10 text-primary",
    green: "bg-success/10 text-[#15803d]",
    amber: "bg-warning/10 text-[#b45309]",
    red: "bg-danger/10 text-[#b91c1c]",
    purple: "bg-brand-purple/10 text-[#6d28d9]",
    cyan: "bg-brand-cyan/10 text-[#0e7490]",
  }[accent];

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium text-muted-foreground">
              {label}
            </span>
            <span className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-ink">
              {value}
            </span>
          </div>
          {Icon ? (
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", accentClass)}>
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
          ) : null}
        </div>
        {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}