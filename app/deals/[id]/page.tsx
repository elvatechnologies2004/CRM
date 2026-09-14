import { notFound } from "next/navigation";

import { DealDetailView } from "@/components/deals/deal-detail-view";
import {
  getDealById,
  getDealActivities,
  getDealHealth,
  getDealQuotes,
  getDealProposals,
  getDealWonData,
  getDealLostData,
  getDealStaleAlerts,
} from "@/lib/mock-deals";
import { leadOwners } from "@/lib/mock-leads";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = getDealById(id);
  if (!deal) notFound();

  return (
    <DealDetailView
      deal={deal}
      owners={leadOwners}
      activities={getDealActivities(id)}
      health={getDealHealth(id)}
      quotes={getDealQuotes()}
      proposals={getDealProposals()}
      wonData={getDealWonData(id)}
      lostData={getDealLostData(id)}
      staleAlerts={getDealStaleAlerts()}
    />
  );
}