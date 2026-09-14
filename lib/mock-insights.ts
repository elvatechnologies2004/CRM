import type { AiInsight } from "@/lib/types";

export const insightMocks: AiInsight[] = [
  {
    id: "ins_001",
    kind: "Revenue Opportunity",
    headline: "3 enterprise deals are ready to close early",
    detail:
      "Techno Solutions, Nova Systems and BrightWave all show buying signals in the last 7 days.",
    impact: "~$212,000 revenue this quarter",
    action: "Create follow-up tasks for the 3 owners",
    actionLabel: "Create Tasks",
  },
  {
    id: "ins_002",
    kind: "At-Risk Deals",
    headline: "2 deals have been idle for more than 10 days",
    detail:
      "Skyline Retail and Lotus Digital have no activity since proposal was sent.",
    impact: "$86,000 at risk",
    action: "Send a re-engagement email to both contacts",
    actionLabel: "Send Email",
  },
  {
    id: "ins_003",
    kind: "Inactive Customers",
    headline: "5 customers have not logged in for 30+ days",
    detail:
      "Churn risk is rising for accounts across the Enterprise segment.",
    impact: "Potential ~$45,000 ARR loss",
    action: "Assign health-check calls to CSMs",
    actionLabel: "Assign Calls",
  },
  {
    id: "ins_004",
    kind: "Sales Bottleneck",
    headline: "Deals are stalling in the Negotiation stage",
    detail:
      "Average time in Negotiation is now 24 days, up from 15 days last quarter.",
    impact: "Slows overall velocity by 18%",
    action: "Review negotiation blockers with the sales team",
    actionLabel: "Open Review",
  },
  {
    id: "ins_005",
    kind: "High-Performing Source",
    headline: "Referral leads convert 2.4x better than paid ads",
    detail:
      "Referrals close at 38% while Paid Advertising closes at 16%.",
    impact: "Shift $8,000 budget to referral programs",
    action: "Propose a budget reallocation plan",
    actionLabel: "Propose Plan",
  },
  {
    id: "ins_006",
    kind: "Team Performance",
    headline: "Sara Ahmed leads the team with a 92% win rate",
    detail:
      "Her deal velocity is 30% faster than the team average this quarter.",
    impact: "Model her playbook across the sales team",
    action: "Schedule a playbook sharing session",
    actionLabel: "Schedule Session",
  },
];