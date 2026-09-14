import type { Proposal, QuoteStatus } from "@/lib/types";
import { iso } from "@/lib/date-utils";

export const proposalStatuses: QuoteStatus[] = [
  "Draft",
  "Sent",
  "Viewed",
  "Accepted",
  "Rejected",
  "Expired",
];

export const proposalMocks: Proposal[] = [
  {
    id: "pr_001",
    name: "Enterprise Automation Proposal",
    customerName: "Techno Solutions",
    issueDate: iso(-10, "10:00"),
    expiryDate: iso(0, "10:00"),
    status: "Sent",
    terms: "Valid for 30 days",
    notes: "Custom automation platform implementation",
    timeline: [
      { event: "Proposal drafted", at: iso(-10, "10:00") },
      { event: "Proposal sent", at: iso(-5, "14:00") },
    ],
  },
  {
    id: "pr_002",
    name: "Integration Service Proposal",
    customerName: "Skyline Retail",
    issueDate: iso(-5, "14:00"),
    expiryDate: iso(10, "14:00"),
    status: "Draft",
    terms: "Valid for 14 days",
    notes: "Pending internal review",
    timeline: [
      { event: "Proposal drafted", at: iso(-5, "14:00") },
    ],
  },
  {
    id: "pr_003",
    name: "Support Subscription Proposal",
    customerName: "Nova Systems",
    issueDate: iso(0, "11:00"),
    expiryDate: iso(20, "11:00"),
    status: "Accepted",
    terms: "Annual commitment",
    notes: "Customer signed during call",
    timeline: [
      { event: "Proposal drafted", at: iso(-10, "11:00") },
      { event: "Proposal accepted", at: iso(4, "10:00") },
    ],
  },
];