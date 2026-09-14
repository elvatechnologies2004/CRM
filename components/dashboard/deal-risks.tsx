import Link from "next/link";
import { ArrowUpRight, AlertTriangle, Timer, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DealRisk, RiskStatus } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

const riskMeta: Record<
  RiskStatus,
  { icon: React.ReactNode; badge: "danger" | "warning" | "secondary"; label: string; bar: string }
> = {
  red: {
    icon: <AlertTriangle className="h-4 w-4" aria-hidden />,
    badge: "danger",
    label: "High risk",
    bar: "from-danger/80 to-danger/30",
  },
  orange: {
    icon: <TriangleAlert className="h-4 w-4" aria-hidden />,
    badge: "warning",
    label: "Medium risk",
    bar: "from-warning/80 to-warning/30",
  },
  yellow: {
    icon: <Timer className="h-4 w-4" aria-hidden />,
    badge: "secondary",
    label: "Low risk",
    bar: "from-[#eab308]/80 to-[#eab308]/30",
  },
};

interface DealRisksProps {
  risks: DealRisk[];
}

function DealRisks({ risks }: DealRisksProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Deal Risks</CardTitle>
        <Link
          href="/pipeline"
          scroll={false}
          className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          View all
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="pt-1">
        <ul className="flex flex-col gap-2">
          {risks.map((risk) => {
            const meta = riskMeta[risk.status];
            return (
              <li
                key={risk.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card pl-4 transition-colors hover:border-border/80 hover:bg-muted/40"
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-1 bg-gradient-to-b",
                    meta.bar
                  )}
                  aria-hidden
                />
                <span className="flex items-center gap-3 py-3 pr-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      risk.status === "red"
                        ? "bg-danger/10 text-danger"
                        : risk.status === "orange"
                          ? "bg-warning/10 text-warning"
                          : "bg-[#eab308]/10 text-[#a16207]"
                    )}
                  >
                    {meta.icon}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-ink">
                        {risk.company}
                      </span>
                      <Badge
                        variant={meta.badge}
                        className="shrink-0 border-transparent"
                      >
                        {meta.label}
                      </Badge>
                    </span>
                    <span className="mt-0.5 truncate text-xs text-muted-foreground">
                      {risk.reason}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-ink">
                    {formatCurrency(risk.amount)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export { DealRisks };