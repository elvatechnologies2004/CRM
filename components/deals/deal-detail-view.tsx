"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { deleteDealAction } from "@/app/deals/actions";
import { Button } from "@/components/ui/button";
import { DealHealthBadge } from "@/components/crm/deal-health-badge";
import { AIDealSummary } from "@/components/deals/ai-deal-summary";
import { DealNextBestAction } from "@/components/deals/ai-next-best-action";
import { formatCurrency } from "@/lib/crm-meta";
import { lastActivityLabel } from "@/lib/mock-leads";
import type {
  DealActivity,
  DealHealth,
  DealLostData,
  DealProposal,
  DealQuote,
  DealRecord,
  DealStaleAlert,
  DealWonData,
  User,
} from "@/lib/types";

interface DealDetailViewProps {
  deal: DealRecord;
  owners: User[];
  activities: DealActivity[];
  health: DealHealth | undefined;
  quotes: DealQuote[];
  proposals: DealProposal[];
  wonData: DealWonData | undefined;
  lostData: DealLostData | undefined;
  staleAlerts: DealStaleAlert[];
}

function DealDetailView({
  deal,
  health,
}: DealDetailViewProps) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  const handleMarkWon = () => setToast("Deal marked as won");
  const handleMarkLost = () => setToast("Deal marked as lost");

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete ${deal.name}? This action cannot be undone.`);
    if (!confirmed) return;

    const result = await deleteDealAction(deal.id);
    if (!result.ok) {
      window.alert(result.error || "Failed to delete deal");
      return;
    }

    router.push("/deals");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-ink mb-3">Opportunity Information</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Opportunity Name</p>
            <p className="font-medium text-ink">{deal.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium text-ink">{deal.companyName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Stage</p>
            <p className="font-medium text-ink">{deal.stageName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Value</p>
            <p className="font-medium text-ink">{formatCurrency(deal.value)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Probability</p>
            <p className="font-medium text-ink">{deal.probability}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expected Revenue</p>
            <p className="font-medium text-ink">{formatCurrency(deal.expectedRevenue)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Expected Close</p>
          <p className="font-medium text-ink">
            {lastActivityLabel(deal.expectedCloseDate)}
          </p>
        </div>

        <DealHealthBadge status={health?.status ?? "Healthy"} />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkWon}>
            Mark as Won
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkLost}>
            Mark as Lost
          </Button>
        </div>

        <div className="mt-3">
          <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full">
            Delete Opportunity
          </Button>
        </div>
      </div>

      <AIDealSummary deal={deal} />
      <DealNextBestAction deal={deal} />

      {toast && (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-lg"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export { DealDetailView };