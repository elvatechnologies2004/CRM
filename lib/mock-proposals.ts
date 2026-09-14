import type { Proposal, QuoteStatus } from "@/lib/types";

export const proposalStatuses: QuoteStatus[] = [
  "Draft",
  "Sent",
  "Viewed",
  "Accepted",
  "Rejected",
  "Expired",
];

export const proposalMocks: Proposal[] = [];