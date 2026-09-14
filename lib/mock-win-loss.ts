import type { WinLossData } from "@/lib/types";

export interface WinLossDeal {
  id: string;
  dealName: string;
  companyName: string;
  amount: number;
  outcome: "Won" | "Lost";
  ownerName: string;
  closedAt: string;
  reason: string;
  competitor?: string;
}

export const winLossSummary: WinLossData = {
  won: 14,
  lost: 9,
  total: 23,
  winRate: 61,
};

export const winLossDealMocks: WinLossDeal[] = [
  { id: "wl_001", dealName: "CRM Enterprise Rollout", companyName: "Acme Motors", amount: 98000, outcome: "Won", ownerName: "Sara Ahmed", closedAt: "2025-11-28", reason: "Product Fit" },
  { id: "wl_002", dealName: "Support Platform Migration", companyName: "Nova Systems", amount: 64000, outcome: "Won", ownerName: "Hussain Ali", closedAt: "2025-11-20", reason: "Relationship" },
  { id: "wl_003", dealName: "Annual Automation Suite", companyName: "Skyline Retail", amount: 76000, outcome: "Lost", ownerName: "Ali Khan", closedAt: "2025-11-18", reason: "Competitor", competitor: "Competitor A" },
  { id: "wl_004", dealName: "Multi-Site Expansion", companyName: "BrightWave Media", amount: 121000, outcome: "Won", ownerName: "Zain Malik", closedAt: "2025-11-12", reason: "Price" },
  { id: "wl_005", dealName: "Data Migration Project", companyName: "Lotus Digital", amount: 32000, outcome: "Lost", ownerName: "Ayesha Siddiqui", closedAt: "2025-11-05", reason: "No Decision" },
  { id: "wl_006", dealName: "Invoice Automation Plan", companyName: "Echo Furnishings", amount: 52000, outcome: "Won", ownerName: "Sara Ahmed", closedAt: "2025-10-30", reason: "Product Fit" },
  { id: "wl_007", dealName: "CRM Starter Migration", companyName: "Gulf Data Group", amount: 28000, outcome: "Won", ownerName: "Hussain Ali", closedAt: "2025-10-22", reason: "Relationship" },
  { id: "wl_008", dealName: "Agency Retainer Renewal", companyName: "Pixel Networks", amount: 44000, outcome: "Lost", ownerName: "Ali Khan", closedAt: "2025-10-15", reason: "Competitor", competitor: "Competitor B" },
];