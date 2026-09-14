import type {
  DealActivity,
  DealContactRole,
  DealForecast,
  DealForecastByMonth,
  DealHealth,
  DealHealthStatus,
  DealLostData,
  DealLostReason,
  DealProposal,
  DealQuote,
  DealRecord,
  DealStaleAlert,
  DealWinReason,
  DealWonData,
} from "@/lib/types";
import { leadOwners, leadSourceOptions } from "@/lib/mock-leads";
import { companyMocks } from "@/lib/mock-companies";
import { contactMocks } from "@/lib/mock-contacts";

// iso function defined locally since it's not exported from mock-leads
function iso(daysBack: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function daysInStage(createdAt: string) {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const created = new Date(createdAt);
  if (created < since) return Math.round((since.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  return 0;
}

function dealHealthStatus(value: number): DealHealthStatus {
  if (value >= 80) return "Healthy";
  if (value >= 60) return "Needs Attention";
  if (value >= 40) return "At Risk";
  return "Critical";
}

function dealHealthScore(deal: DealRecord): number {
  let score = 50; // base
  // Activity recency
  const daysAgo = daysInStage(deal.lastActivityAt);
  score -= Math.min(daysAgo, 30) * 0.5;
  // Probability contribution
  score += deal.probability * 0.3;
  // Expected revenue relative to value
  score += Math.min(deal.expectedRevenue / Math.max(deal.value, 1) * 100, 30);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function makeDealHealth(deal: DealRecord): DealHealth {
  const score = dealHealthScore(deal);
  return {
    score,
    status: dealHealthStatus(score),
    factors: [
      {
        label: "Customer Engagement",
        value: Math.max(0, 100 - daysInStage(deal.lastActivityAt) * 0.5),
        tone: score >= 80 ? "good" : score >= 60 ? "medium" : "low",
      },
      {
        label: "Activity Recency",
        value: Math.max(0, 100 - daysInStage(deal.lastActivityAt) * 0.7),
        tone: score >= 80 ? "good" : score >= 60 ? "medium" : "low",
      },
      {
        label: "Decision Maker Access",
        value: Math.max(0, 90 - Math.random() * 20),
        tone: "good",
      },
      {
        label: "Task Completion",
        value: 85,
        tone: "good",
      },
      {
        label: "Close Date Confidence",
        value: Math.max(0, 85 - Math.random() * 15),
        tone: "good",
      },
      {
        label: "Proposal Engagement",
        value: Math.max(0, 90 - Math.random() * 20),
        tone: "good",
      },
    ],
    riskFactors: [],
  };
}

function makeDeal(): DealRecord {
  const company = companyMocks[Math.floor(Math.random() * companyMocks.length)];
  const contact = contactMocks[Math.floor(Math.random() * contactMocks.length)];
  if (contact.companyId && contact.companyId !== company.id) {
    // Reassign contact to this company if needed
    contact.companyId = company.id;
    contact.companyName = company.name;
  }

  const stageOptions = ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const;
  const stage = stageOptions[Math.floor(Math.random() * stageOptions.length)];
  const probabilityMap: Record<string, number> = {
    new: 10,
    qualified: 35,
    proposal: 65,
    negotiation: 80,
    won: 100,
    lost: 0,
  };
  const baseProbability = probabilityMap[stage] || 50;
  const probability = Math.round(baseProbability + (Math.random() - 0.5) * 30);

  const value = Math.round(1000 + Math.random() * 99000);
  const expectedRevenue = Math.round(value * (probability / 100));

  const createdAt = iso(60 + Math.random() * 90, "10:00");
  const lastActivity = iso(Math.random() * 10, "14:00");

  const owner = leadOwners[Math.floor(Math.random() * leadOwners.length)];

  // Determine stage name and health
  const stageNames: Record<string, string> = {
    new: "New",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
  };

  const roles: DealContactRole[] = [
    "Decision Maker",
    "Champion",
    "Influencer",
  ];
  const winReasons: DealWinReason[] = [
    "Product Fit",
    "Price",
    "Relationship",
  ];
  const lostReasons: DealLostReason[] = [
    "Price",
    "Competitor",
    "No Decision",
  ];

  const deal: DealRecord = {
    id: `d_${Math.random().toString(36).slice(2, 9)}`,
    name: `Deal ${Math.random().toString(36).slice(2, 8)}`,
    companyId: company.id,
    companyName: company.name,
    primaryContactId: contact.id,
    primaryContactName: `${contact.firstName} ${contact.lastName}`,
    pipelineId: "p_001",
    pipelineName: "Main Sales Pipeline",
    stageId: stage,
    stageName: stageNames[stage],
    value,
    currency: "USD",
    probability,
    expectedRevenue,
    expectedCloseDate: iso(10 + Math.random() * 60, "09:00"),
    ownerId: owner.id,
    ownerName: owner.name,
    healthScore: 50,
    healthStatus: "Needs Attention",
    source: leadSourceOptions[Math.floor(Math.random() * leadSourceOptions.length)],
    description: `Evaluation for ${company.name} - ${company.industry} implementation`,
    tags: ["Enterprise", company.industry.toLowerCase(), "High Value"],
    products: [
      {
        id: "pr_1",
        name: "CRM Professional Plan",
        quantity: Math.floor(10 + Math.random() * 90),
        unitPrice: Math.round(100 + Math.random() * 900),
        discount: Math.round(Math.random() * 20),
        subtotal: Math.round(500 + Math.random() * 4500),
      },
    ],
    contacts: [
      {
        contactId: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        jobTitle: contact.jobTitle,
        email: contact.email,
        role: roles[Math.floor(Math.random() * roles.length)],
        isPrimary: Math.random() > 0.3,
      },
    ],
    createdAt,
    updatedAt: iso(Math.random() * 30, "09:00"),
    lastActivityAt: lastActivity,
    daysOpen: Math.floor(Math.random() * 45),
    daysInStage: daysInStage(createdAt),
    wonDate: stage === "won" ? iso(-1, "10:00") : undefined,
    lostDate: stage === "lost" ? iso(-1, "10:00") : undefined,
    winReason: stage === "won" ? winReasons[Math.floor(Math.random() * winReasons.length)] : undefined,
    lostReason: stage === "lost" ? lostReasons[Math.floor(Math.random() * lostReasons.length)] : undefined,
    competitor: stage === "lost" ? ["Competitor A", "Competitor B", "Competitor C"][Math.floor(Math.random() * 3)] : undefined,
  };
  deal.healthScore = dealHealthScore(deal);
  deal.healthStatus = dealHealthStatus(deal.healthScore);
  return deal;
}

// Create 25 deals with some won/lost for variety
const deals: DealRecord[] = [];

// Generate 22 active deals
for (let i = 0; i < 22; i++) {
  deals.push(makeDeal());
}

// Add 2 won deals
deals.push(
  makeDealWithStatus("won", "d_won_1"),
  makeDealWithStatus("won", "d_won_2")
);

// Add 1 lost deal
deals.push(
  makeDealWithStatus("lost", "d_lost_1")
);

// Add stale deals
function makeDealWithStatus(status: "won" | "lost", id: string) {
  const deal = makeDeal();
  deal.id = id;
  deal.stageId = status;
  deal.stageName = status;
  deal.probability = status === "won" ? 100 : 0;
  deal.expectedRevenue = deal.value;
  deal.wonDate = iso(-30, "14:00");
  deal.lostDate = status === "lost" ? iso(-30, "14:00") : undefined;
  if (status === "won") {
    deal.winReason = "Product Fit";
  } else {
    deal.lostReason = "Price";
  }
  return deal;
}

function generateStaleAlerts(deals: DealRecord[]): DealStaleAlert[] {
  const alerts: DealStaleAlert[] = [];
  deals.forEach((deal) => {
    if (deal.stageName !== "won" && deal.stageName !== "lost") {
      const daysSinceActivity = daysInStage(deal.lastActivityAt);
      if (daysSinceActivity >= 7) {
        alerts.push({
          dealId: deal.id,
          dealName: deal.name,
          companyName: deal.companyName,
          reason: "No customer activity",
          daysSinceActivity,
          recommendedAction: "Follow up with primary contact",
        });
      }
      if (daysInStage(deal.expectedCloseDate) > 0 && daysInStage(deal.expectedCloseDate) > 3) {
        alerts.push({
          dealId: deal.id,
          dealName: deal.name,
          companyName: deal.companyName,
          reason: "Close date passed",
          daysSinceActivity: daysInStage(deal.expectedCloseDate),
          recommendedAction: "Reset close date and re-engage",
        });
      }
    }
  });
  return alerts;
}

const staleAlerts = generateStaleAlerts(deals);

export const dealMocks: DealRecord[] = deals;

export const dealActivities: DealActivity[] = [
  {
    id: "act_1",
    type: "created",
    title: "Deal created",
    detail: "New opportunity added from website lead capture",
    at: iso(90, "10:00"),
    actor: "System",
  },
  {
    id: "act_2",
    type: "stage-changed",
    title: "Stage changed",
    detail: "Qualified → Proposal",
    at: iso(80, "14:30"),
    actor: "Hussain Ali",
    metadata: { from: "Qualified", to: "Proposal" },
  },
  {
    id: "act_3",
    type: "email",
    title: "Email opened",
    detail: "Proposal sent to prospect",
    at: iso(2, "11:15"),
    actor: "Ahmed Khan",
  },
  {
    id: "act_4",
    type: "call",
    title: "Discovery call completed",
    detail: "35 min discussion about implementation timeline",
    at: iso(1, "10:00"),
    actor: "Ali Khan",
  },
  {
    id: "act_5",
    type: "meeting",
    title: "Demo meeting scheduled",
    detail: "Product demo with technical team",
    at: iso(0, "15:00"),
    actor: "Sara Ahmed",
  },
  {
    id: "act_6",
    type: "task",
    title: "Follow up on proposal",
    detail: "Send implementation timeline",
    at: iso(0, "16:00"),
    actor: "Hussain Ali",
  },
];

export const dealHealth: Record<string, DealHealth> = {};
dealMocks.forEach((deal) => {
  dealHealth[deal.id] = makeDealHealth(deal);
});

export const dealQuotes: DealQuote[] = [
  {
    id: "q_1",
    number: "Q-1024",
    value: 24000,
    status: "sent",
    validUntil: iso(30, "09:00"),
    createdAt: iso(10, "10:00"),
  },
  {
    id: "q_2",
    number: "Q-1025",
    value: 18000,
    status: "viewed",
    validUntil: iso(45, "09:00"),
    createdAt: iso(20, "14:00"),
  },
];

export const dealProposals: DealProposal[] = [
  {
    id: "pr_1",
    name: "CRM Implementation Proposal",
    status: "sent",
    sentAt: iso(5, "10:00"),
    viewCount: 3,
  },
];

export const dealWonData: DealWonData = {
  wonDate: iso(-30, "10:00"),
  finalValue: 24000,
  products: [
    { id: "pr_1", name: "CRM Professional Plan", quantity: 20, unitPrice: 800, discount: 0, subtotal: 16000 },
  ],
  winReason: "Product Fit",
};

export const dealLostData: DealLostData = {
  lostDate: iso(-30, "14:00"),
  lostReason: "Price",
};

export const dealStaleAlerts: DealStaleAlert[] = staleAlerts;

export function getDealById(id: string): DealRecord | undefined {
  return dealMocks.find((deal) => deal.id === id);
}

export function getDealActivities(dealId: string): DealActivity[] {
  return dealActivities.filter((activity) =>
    activity.metadata?.dealId === dealId || Math.random() > 0.5
  );
}

export function getDealHealth(dealId: string): DealHealth | undefined {
  return dealHealth[dealId];
}

export function getDealQuotes(): DealQuote[] {
  return dealQuotes;
}

export function getDealProposals(): DealProposal[] {
  return dealProposals;
}

export function getDealWonData(dealId: string): DealWonData | undefined {
  return getDealById(dealId)?.stageName === "Won" ? dealWonData : undefined;
}

export function getDealLostData(dealId: string): DealLostData | undefined {
  return getDealById(dealId)?.stageName === "Lost" ? dealLostData : undefined;
}

export function getDealStaleAlerts(): DealStaleAlert[] {
  return dealStaleAlerts;
}

export function getDealForecast(): DealForecast {
  const pipeline = dealMocks.reduce((sum, d) => sum + d.value, 0);
  return {
    category: "Pipeline",
    value: pipeline,
    deals: dealMocks,
  };
}

export function getDealForecastByMonth(): DealForecastByMonth {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "short" });
  return {
    month,
    pipeline: dealMocks.reduce((sum, d) => sum + d.value, 0),
    bestCase: dealMocks.reduce((sum, d) => sum + d.expectedRevenue, 0),
    commit: 0,
    closedWon: 0,
  };
}