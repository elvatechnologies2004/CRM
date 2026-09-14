import { ProposalsPageClient } from "@/components/proposals/proposals-page-client";
import { proposalMocks } from "@/lib/mock-proposals";

export default function ProposalsPage() {
  return <ProposalsPageClient initialProposals={proposalMocks} />;
}