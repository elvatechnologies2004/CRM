"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApprovalRequest, RiskLevel } from "@/lib/types";

interface ApprovalsPageClientProps {
  initialApprovals: ApprovalRequest[];
}

function ApprovalsPageClient({ initialApprovals }: ApprovalsPageClientProps) {
  const approvals = useMemo(() => initialApprovals, [initialApprovals]);

  const riskTone: Record<RiskLevel, "success" | "warning" | "danger"> = {
    Low: "success",
    Medium: "warning",
    High: "danger",
  };

  const statusTone: Record<
    ApprovalRequest["status"],
    "warning" | "success" | "danger"
  > = {
    Pending: "warning",
    Approved: "success",
    Rejected: "danger",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Approvals
        </h1>
        <Button size="sm" variant="ghost">
          + New Approval Request
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {approvals.map((approval) => (
          <div
            key={approval.id}
            className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{approval.action}</p>
                  <Badge variant={statusTone[approval.status]}>
                    {approval.status}
                  </Badge>
                  <Badge
                    variant={riskTone[approval.riskLevel]}
                    className="text-[10px]"
                  >
                    {approval.riskLevel} risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {approval.summary}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {approval.requestedAt}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Reasoning
                </p>
                <p className="mt-1 text-sm text-ink">{approval.reasoning}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Expected outcome
                </p>
                <p className="mt-1 text-sm text-ink">
                  {approval.expectedOutcome}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Requested by
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm text-ink",
                    approval.status === "Pending" && "text-muted-foreground"
                  )}
                >
                  {approval.requestedBy}
                </p>
              </div>
            </div>

            {approval.status === "Pending" && (
              <div className="mt-4 flex gap-2">
                <Button size="sm">Approve</Button>
                <Button size="sm" variant="outline">
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
        {approvals.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No approval requests found.
          </p>
        )}
      </div>
    </div>
  );
}

export { ApprovalsPageClient };