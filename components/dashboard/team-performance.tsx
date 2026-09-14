import Link from "next/link";
import { ArrowUpRight, TrendingUp } from "lucide-react";

import { InitialsAvatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamMemberPerformance } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";

interface TeamPerformanceProps {
  members: TeamMemberPerformance[];
}

function TeamPerformance({ members }: TeamPerformanceProps) {
  const maxRevenue = Math.max(...members.map((member) => member.revenue));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Top Performing Team Members</CardTitle>
        <Link
          href="/reports"
          scroll={false}
          className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          View all
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent className="pt-1">
        <ul className="flex flex-col gap-1.5">
          {members.map((member) => (
            <li
              key={member.id}
              className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              <InitialsAvatar name={member.name} className="h-9 w-9" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[13px] font-medium text-ink">
                  {member.name}
                </span>
                <span className="flex items-center gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {member.dealsWon} deals won
                  </span>
                  <span className="h-1.5 max-w-28 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-primary to-brand-blue transition-all group-hover:from-primary-blue group-hover:to-brand-purple"
                      style={{
                        width: `${Math.max(8, (member.revenue / maxRevenue) * 100)}%`,
                      }}
                    />
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-[13px] font-semibold text-ink">
                  {formatCompactCurrency(member.revenue)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#15803d]">
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  +{member.growth}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export { TeamPerformance };