"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Proposal, QuoteStatus } from "@/lib/types";

interface ProposalsPageClientProps {
  initialProposals: Proposal[];
}

function ProposalsPageClient({ initialProposals }: ProposalsPageClientProps) {
  const proposals = useMemo(() => initialProposals, [initialProposals]);

  const statusTone: Record<QuoteStatus, "info" | "warning" | "success" | "danger"> = {
    Draft: "info",
    Sent: "warning",
    Viewed: "info",
    Accepted: "success",
    Rejected: "danger",
    Expired: "danger",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Proposals</h1>
        <Button size="sm" variant="ghost">
          + New Proposal
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {proposals.map((proposal) => {
          const Tone = statusTone[proposal.status];
          return (
            <div
              key={proposal.id}
              className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
            >
              <div className="flex flex-col gap-2">
                <p className="font-medium text-ink">{proposal.name}</p>
                <Badge variant={Tone}>{proposal.status}</Badge>
                <p className="text-sm text-muted-foreground">
                  {proposal.customerName}
                  {proposal.issueDate && ` · Issued ${new Date(proposal.issueDate).toLocaleDateString("en-US", { timeZone: "UTC" })}`}
                </p>
              </div>
            </div>
          );
        })}
        {proposals.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No proposals found.
          </p>
        )}
      </div>
    </div>
  );
}

export { ProposalsPageClient };