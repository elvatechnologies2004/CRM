import type { ApprovalRequest } from "@/lib/types";

export const approvalMocks: ApprovalRequest[] = [
  {
    id: "appr_001",
    action: "Send sequence to 214 leads",
    summary: "Activates the Q3 Nurture sequence for 214 qualified leads in the East region.",
    reasoning:
      "These leads engaged with the pricing page in the last 60 days and scored above 70.",
    expectedOutcome: "Estimated 18% reply rate and ~22 meetings booked.",
    riskLevel: "Medium",
    requestedBy: "Lead Agent",
    requestedAt: "2024-12-15T09:00:00Z",
    status: "Pending",
  },
  {
    id: "appr_002",
    action: "Apply 15% discount to Deal D-2024-118",
    summary: "Applies a one-time 15% discount to the Meridian renewal proposal.",
    reasoning:
      "The customer has been with us for 3 years and is comparing a competitor offer.",
    expectedOutcome: "Expected to close $48,500 ARR this quarter.",
    riskLevel: "Medium",
    requestedBy: "Sales Agent",
    requestedAt: "2024-12-14T15:30:00Z",
    status: "Pending",
  },
  {
    id: "appr_003",
    action: "Mark 32 support tickets as resolved",
    summary: "Auto-closes 32 tickets matching the known-good fix for the import issue.",
    reasoning:
      "All tickets match the confirmed regression fix that shipped in v4.2.1.",
    expectedOutcome: "Reduces support backlog by ~18% this week.",
    riskLevel: "Low",
    requestedBy: "Support Agent",
    requestedAt: "2024-12-14T11:00:00Z",
    status: "Approved",
  },
  {
    id: "appr_004",
    action: "Bulk-update 400 contact records",
    summary: "Rewrites company names for 400 contacts based on the domain mapping.",
    reasoning:
      "Verification matched 96% of domains against official registries.",
    expectedOutcome: "Improves data quality score by ~9 points.",
    riskLevel: "High",
    requestedBy: "Data Agent",
    requestedAt: "2024-12-13T10:45:00Z",
    status: "Rejected",
  },
  {
    id: "appr_005",
    action: "Extend free trial by 14 days",
    summary: "Grants an extended trial to the Nova account pending contract review.",
    reasoning:
      "The pilot has 31 active users and is one signature away from closing.",
    expectedOutcome: "Leads to a ~$64,000 expansion contract.",
    riskLevel: "Low",
    requestedBy: "Customer Success Agent",
    requestedAt: "2024-12-12T08:20:00Z",
    status: "Approved",
  },
];