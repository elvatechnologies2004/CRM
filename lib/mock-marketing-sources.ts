import type { MarketingSource } from "@/lib/types";

export const marketingSourceMocks: MarketingSource[] = [
  { id: "src_001", name: "Website", type: "Organic", leads: 320, conversionRate: 18, status: "Active" },
  { id: "src_002", name: "Referral", type: "Word of Mouth", leads: 145, conversionRate: 38, status: "Active" },
  { id: "src_003", name: "Cold Call", type: "Outbound", leads: 210, conversionRate: 9, status: "Active" },
  { id: "src_004", name: "Trade Show", type: "Event", leads: 88, conversionRate: 21, status: "Paused" },
  { id: "src_005", name: "Partner", type: "Channel", leads: 122, conversionRate: 24, status: "Active" },
  { id: "src_006", name: "Social Media", type: "Organic", leads: 260, conversionRate: 12, status: "Active" },
  { id: "src_007", name: "Email Campaign", type: "Outbound", leads: 190, conversionRate: 25, status: "Active" },
  { id: "src_008", name: "Paid Advertising", type: "Paid", leads: 175, conversionRate: 16, cost: 8000, status: "Active" },
];